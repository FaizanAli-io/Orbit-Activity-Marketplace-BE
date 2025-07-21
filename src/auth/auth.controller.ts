import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register user or vendor' })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 201, description: 'User or vendor registered.' })
  signup(@Body() data: any) {
    return this.authService.signup(data);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user or vendor' })
  @ApiBody({ type: Object })
  @ApiResponse({ status: 200, description: 'User or vendor logged in.' })
  login(@Body() data: any) {
    return this.authService.login(data);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile.' })
  getMe(@Req() req: any) {
    return this.authService.getMe(req.user);
  }
}
