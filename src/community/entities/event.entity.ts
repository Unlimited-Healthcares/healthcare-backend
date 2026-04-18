import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn
} from 'typeorm';

@Entity('community_events')
export class CommunityEvent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column('text', { nullable: true })
    description: string;

    @Column()
    date: string; // Formatting: "Oct 15" or ISO

    @Column()
    time: string; // Formatting: "10:00 AM"

    @Column({ default: 'General' })
    category: string;

    @Column({ nullable: true })
    location: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
