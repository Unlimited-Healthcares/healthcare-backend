
import { IsArray, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadReviewPhotosDto {
  @ApiProperty({
    description: 'Array of photo URLs',
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']
  })
  @IsArray()
  @IsString({ each: true })
  photos: string[];

  @ApiPropertyOptional({
    description: 'Photo descriptions or captions',
    example: ['Waiting room', 'Clean facilities']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  captions?: string[];
}
