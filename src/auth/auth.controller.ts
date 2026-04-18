import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Public } from './decorators/public.decorator';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { GetCurrentUserId } from './decorators/get-current-user-id.decorator';
import { GetCurrentUser } from './decorators/get-current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'User with this email already exists.' })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);

    // Explicitly trigger verification - using 'email' as default channel
    await this.authService.resendVerification(user.email, 'email').catch(err => {
      // Non-fatal if sending fails here (user is still created)
      console.warn(`Initial verification send failed for ${user.email}: ${err.message}`);
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
        displayId: user.displayId,
      },
      message: 'Registration successful. A verification code has been sent to your email.'
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'center')
  @Post('register/staff')
  @ApiOperation({ summary: 'Register a new staff or doctor user (admin or center only)' })
  @ApiResponse({ status: 201, description: 'Staff/doctor user successfully registered.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'User with this email already exists.' })
  @ApiBearerAuth('access-token')
  async registerStaffOrDoctor(
    @Body() registerDto: RegisterDto,
    @GetCurrentUserId() _createdBy: string
  ) {
    // Ensure only doctor or staff roles can be created
    if (!registerDto.roles.every(role => role === 'doctor' || role === 'staff')) {
      registerDto.roles = registerDto.roles.filter(role => role === 'doctor' || role === 'staff');
      if (registerDto.roles.length === 0) {
        registerDto.roles = ['staff'];
      }
    }

    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('register/admin')
  @ApiOperation({ summary: 'Register a new admin user (existing admin only)' })
  @ApiResponse({ status: 201, description: 'Admin user successfully registered.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'User with this email already exists.' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions.' })
  @ApiBearerAuth('access-token')
  async registerAdmin(
    @Body() registerDto: RegisterDto,
    @GetCurrentUserId() _createdBy: string
  ) {
    // Ensure only admin role can be created through this endpoint
    if (!registerDto.roles.includes('admin')) {
      registerDto.roles = ['admin'];
    }

    const user = await this.authService.register(registerDto);

    // Generate access token for the newly registered admin
    const payload = {
      username: user.email,
      sub: user.id,
      roles: user.roles
    };
    const accessToken = this.authService['jwtService'].sign(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
        displayId: user.displayId,
      },
      access_token: accessToken,
      message: 'Admin user created successfully',
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in a user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() loginDto: LoginDto) {
    const authResponse = await this.authService.login(loginDto);

    // Return full auth response including refresh_token
    return {
      user: authResponse.user,
      profile: authResponse.profile,
      center_id: authResponse.center_id,
      access_token: authResponse.access_token,
      refresh_token: authResponse.refresh_token,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Log out a user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out.' })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid token.' })
  async logout(@GetCurrentUserId() userId: string, @Req() req) {
    // Extract the access token from the Authorization header
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.replace('Bearer ', '');

    await this.authService.logout(userId, accessToken);
    return { message: 'Successfully logged out' };
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('refresh-token')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Use your refresh token as a Bearer token in the Authorization header to get a new access token. Do not include any other headers or body with the request.'
  })
  @ApiResponse({ status: 200, description: 'Token successfully refreshed.' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
  async refreshTokens(
    @GetCurrentUserId() userId: string,
    @GetCurrentUser('refreshToken') refreshToken: string
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid token.' })
  async getCurrentUser(@GetCurrentUserId() userId: string) {
    if (!userId) {
      throw new Error('User ID not found in token');
    }

    const user = await this.authService.getUserProfile(userId);
    return {
      success: true,
      data: user,
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Sends a password reset link to the provided email address if an account exists.'
  })
  @ApiResponse({ status: 200, description: 'Password reset email sent (if account exists).' })
  @ApiResponse({ status: 400, description: 'Invalid email format.' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Resets the user password using the token received via email.'
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired reset token.' })
  @ApiResponse({ status: 400, description: 'Invalid password format.' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Verifies the user email address using the token received via email.'
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired verification token.' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto.token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend verification email',
    description: 'Resends the email verification link to the provided email address.'
  })
  @ApiResponse({ status: 200, description: 'Verification email sent (if account exists).' })
  @ApiResponse({ status: 400, description: 'Invalid email format.' })
  async resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    return this.authService.resendVerification(resendVerificationDto.email, resendVerificationDto.channel);
  }
}
