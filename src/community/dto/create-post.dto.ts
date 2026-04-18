import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  video?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value.split(',').map(s => s.trim());
      }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(['discussion', 'article', 'event', 'job'])
  type?: string;
}
