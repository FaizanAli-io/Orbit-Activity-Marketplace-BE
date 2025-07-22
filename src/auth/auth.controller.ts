import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SignupDto, LoginDto } from './dto';
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

  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified.' })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
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
