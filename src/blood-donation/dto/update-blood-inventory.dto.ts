
import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBloodInventoryDto {
  @ApiProperty({ example: 10, description: 'Total units', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalUnits?: number;

  @ApiProperty({ example: 8, description: 'Available units', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  availableUnits?: number;

  @ApiProperty({ example: 2, description: 'Reserved units', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reservedUnits?: number;

  @ApiProperty({ example: 0, description: 'Expired units', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  expiredUnits?: number;

  @ApiProperty({ example: 5, description: 'Minimum threshold for alerts', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumThreshold?: number;
}
