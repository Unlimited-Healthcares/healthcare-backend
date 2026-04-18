
import { IsEmail, IsString, MinLength, IsArray, IsOptional, Validate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Common weak passwords to reject
const COMMON_WEAK_PASSWORDS = [
  'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
  'password1', 'admin', 'admin123', 'letmein', 'welcome', 'monkey',
  'dragon', 'master', 'hello', 'freedom', 'whatever', 'qazwsx',
  'trustno1', 'jordan', 'harley', 'hunter', 'buster', 'thomas',
  'tigger', 'robert', 'soccer', 'batman', 'test', 'pass', 'guest',
  '123123', '1234', '12345', '1234567', '123456789', '1234567890',
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'qwerty123', 'password123',
  'admin123', 'root', 'toor', '123456789', '1234567890', 'password1',
  'password12', 'password123', 'password1234', 'password12345',
  'admin1', 'admin12', 'admin123', 'admin1234', 'admin12345',
  'user', 'user123', 'user1234', 'user12345', 'test123', 'test1234',
  'guest123', 'guest1234', 'demo', 'demo123', 'demo1234', 'demo12345',
  'temp', 'temp123', 'temp1234', 'temp12345', 'temp123456',
  'changeme', 'changeme123', 'changeme1234', 'changeme12345',
  'newpass', 'newpass123', 'newpass1234', 'newpass12345',
  'oldpass', 'oldpass123', 'oldpass1234', 'oldpass12345',
  'secret', 'secret123', 'secret1234', 'secret12345',
  'private', 'private123', 'private1234', 'private12345',
  'mypass', 'mypass123', 'mypass1234', 'mypass12345',
  'mypassword', 'mypassword123', 'mypassword1234', 'mypassword12345',
  'mypasswd', 'mypasswd123', 'mypasswd1234', 'mypasswd12345',
  'mypwd', 'mypwd123', 'mypwd1234', 'mypwd12345',
  'mypass123', 'mypass1234', 'mypass12345', 'mypass123456',
  'mypassword123', 'mypassword1234', 'mypassword12345', 'mypassword123456',
  'mypasswd123', 'mypasswd1234', 'mypasswd12345', 'mypasswd123456',
  'mypwd123', 'mypwd1234', 'mypwd12345', 'mypwd123456',
  'mypass123456', 'mypassword123456', 'mypasswd123456', 'mypwd123456',
  'mypass1234567', 'mypassword1234567', 'mypasswd1234567', 'mypwd1234567',
  'mypass12345678', 'mypassword12345678', 'mypasswd12345678', 'mypwd12345678',
  'mypass123456789', 'mypassword123456789', 'mypasswd123456789', 'mypwd123456789',
  'mypass1234567890', 'mypassword1234567890', 'mypasswd1234567890', 'mypwd1234567890'
];

// Custom password validation decorator
export function IsStrongPassword(validationOptions?: Record<string, unknown>) {
  return function (object: unknown, propertyName: string) {
    Validate((value: string) => {
      if (!value) return false;
      
      // Convert to lowercase for weak password checking
      const lowerValue = value.toLowerCase();
      
      // Check for common weak passwords
      if (COMMON_WEAK_PASSWORDS.includes(lowerValue)) {
        return false;
      }
      
      // Check minimum length (increased to 10)
      if (value.length < 10) return false;
      
      // Check for uppercase letter
      if (!/[A-Z]/.test(value)) return false;
      
      // Check for lowercase letter
      if (!/[a-z]/.test(value)) return false;
      
      // Check for number
      if (!/[0-9]/.test(value)) return false;
      
      // Check for special character
      if (!/[^A-Za-z0-9]/.test(value)) return false;
      
      // Check for consecutive characters (like 123, abc, etc.)
      if (/(.)\1{2,}/.test(value)) return false;
      
      // Check for sequential characters (like 123, abc, etc.)
      if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(value)) return false;
      if (/012|123|234|345|456|567|678|789|890/i.test(value)) return false;
      
      // Check for keyboard patterns
      if (/qwerty|asdfgh|zxcvbn/i.test(value)) return false;
      
      // Check for repeated patterns
      if (/(.{2,})\1{2,}/.test(value)) return false;
      
      // Check for too many repeated characters
      const charCounts: { [key: string]: number } = {};
      for (const char of value) {
        charCounts[char] = (charCounts[char] || 0) + 1;
        if (charCounts[char] > Math.ceil(value.length * 0.3)) {
          return false; // More than 30% of the same character
        }
      }
      
      return true;
    }, {
      message: 'Password must be at least 10 characters long and contain uppercase, lowercase, number, special character, and cannot be a common weak password',
      ...validationOptions,
    })(object, propertyName);
  };
}

// Custom validator to prevent admin role registration from public endpoint
export function IsNotAdminRole(validationOptions?: any) {
  return function (object: any, propertyName: string) {
    Validate((value: string[]) => {
      if (!value || !Array.isArray(value)) return false;
      
      // Prevent admin role registration from public endpoint
      if (value.includes('admin')) {
        return false;
      }
      
      return true;
    }, {
      message: 'Admin role cannot be assigned during public registration. Please contact system administrators for admin access.',
      ...validationOptions,
    })(object, propertyName);
  };
}

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongP@ss123!', minLength: 10 })
  @IsString()
  @MinLength(10)
  @IsStrongPassword()
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ 
    example: ['patient'], 
    description: 'User roles (admin role not allowed in public registration)' 
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotAdminRole()
  roles: string[];

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}
