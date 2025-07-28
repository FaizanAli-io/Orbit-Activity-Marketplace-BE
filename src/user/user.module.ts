import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [UserController, SocialController],
  providers: [UserService, SocialService],
  imports: [PrismaModule],
})
export class UserModule {}
