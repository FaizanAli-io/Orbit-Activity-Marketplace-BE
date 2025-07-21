import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { AuthController } from './auth.controller';

@Module({
  controllers: [AuthController],
  providers: [AuthService, EmailService],
})
export class AuthModule {}
