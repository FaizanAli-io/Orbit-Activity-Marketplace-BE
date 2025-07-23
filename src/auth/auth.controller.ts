import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  LoginDto,
  SignupDto,
  VerifyEmailDto,
  RequestResetDto,
  ResetPasswordDto,
} from './dto';
import { AuthService } from './auth.service';
import { AuthGuard } from '../guards/auth.guard';
import { Auth } from '../decorators/auth.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register user or vendor' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({ status: 201, description: 'User or vendor registered.' })
  signup(@Body() data: SignupDto) {
    return this.authService.signup(data);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user or vendor' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'User or vendor logged in.' })
  login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 200, description: 'Email verified.' })
  verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('request-reset')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiBody({ type: RequestResetDto })
  @ApiResponse({ status: 200, description: 'Password reset email sent.' })
  requestPasswordReset(@Body() data: RequestResetDto) {
    return this.authService.requestPasswordReset(data.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password has been reset.' })
  resetPassword(@Body() data: ResetPasswordDto) {
    return this.authService.resetPassword(data.token, data.newPassword);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile.' })
  getMe(@Auth() auth: any) {
    return this.authService.getMe(auth);
  }
}
