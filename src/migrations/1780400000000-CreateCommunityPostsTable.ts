import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommunityPostsTable1780400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if type already exists to avoid errors
    const typeExists = await queryRunner.query(`
      SELECT 1 FROM pg_type WHERE typname = 'community_posts_type_enum';
    `);

    if (typeExists.length === 0) {
      await queryRunner.query(`
        CREATE TYPE "community_posts_type_enum" AS ENUM('discussion', 'article', 'event', 'job');
      `);
    }

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "community_posts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "author_id" uuid NOT NULL,
        "content" text NOT NULL,
        "image" character varying,
        "tags" text,
        "likes" integer NOT NULL DEFAULT 0,
        "comments" integer NOT NULL DEFAULT 0,
        "type" "community_posts_type_enum" NOT NULL DEFAULT 'discussion',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_community_posts" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraint if it doesn't exist
    await queryRunner.query(`
      ALTER TABLE "community_posts" 
      ADD CONSTRAINT "FK_community_posts_author" 
      FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "community_posts" DROP CONSTRAINT IF EXISTS "FK_community_posts_author"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "community_posts"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "community_posts_type_enum"`);
  }
}
