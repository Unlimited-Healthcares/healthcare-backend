
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsArray } from 'class-validator';
import { CreateProfileDto } from './create-profile.dto';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'StrongP@ss123', description: 'User password' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: ['patient'], description: 'User roles' })
  @IsArray()
  @IsOptional()
  roles?: string[];

  @ApiPropertyOptional({ description: 'User profile information' })
  @IsOptional()
  profile?: CreateProfileDto;
}
