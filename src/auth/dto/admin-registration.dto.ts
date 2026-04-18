import { IsEmail, IsString, MinLength, IsArray, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from './register.dto';

export class AdminRegistrationRequestDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongP@ss123!', minLength: 10 })
  @IsString()
  @MinLength(10)
  @IsStrongPassword()
  password: string;

  @ApiProperty({ example: 'Admin User' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    example: ['admin'], 
    description: 'Admin role is required for admin registration requests' 
  })
  @IsArray()
  @IsString({ each: true })
  roles: string[];

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ 
    example: 'I am requesting admin access to manage the healthcare system', 
    description: 'Reason for requesting admin access' 
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ 
    example: 'System Administrator', 
    description: 'Intended role or responsibility' 
  })
  @IsString()
  @IsNotEmpty()
  intendedRole: string;
}

export class AdminRegistrationApprovalDto {
  @ApiProperty({ 
    example: 'approved', 
    enum: ['approved', 'rejected'], 
    description: 'Approval decision' 
  })
  @IsString()
  @IsNotEmpty()
  decision: 'approved' | 'rejected';

  @ApiProperty({ 
    example: 'Request approved based on qualifications', 
    description: 'Reason for approval/rejection' 
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ 
    example: ['admin'], 
    description: 'Final roles to be assigned (if approved)' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  finalRoles?: string[];

  @ApiProperty({ 
    example: 'NewSecureP@ss123!', 
    minLength: 10,
    description: 'Password for the new admin user (required when approving)' 
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @IsStrongPassword()
  password?: string;
}
