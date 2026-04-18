import { ApiProperty } from '@nestjs/swagger';
import { SafeUserDto } from '../../users/dto/safe-user.dto';

export class StaffWithUserDto {
  @ApiProperty({ description: 'Staff record ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Center ID' })
  centerId: string;

  @ApiProperty({ description: 'Staff role in the center' })
  role: string;

  @ApiProperty({ description: 'User details with profile information', type: SafeUserDto })
  user: SafeUserDto;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}
