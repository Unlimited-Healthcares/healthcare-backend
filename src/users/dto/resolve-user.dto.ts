import { ApiProperty } from '@nestjs/swagger';

export class ResolveUserResponseDto {
  @ApiProperty({ description: 'Public display identifier', example: 'DR919768304' })
  publicId: string;

  @ApiProperty({ description: 'User UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  uuid: string;

  @ApiProperty({ description: 'Display name', example: 'Dr. John Smith' })
  displayName: string;
}


