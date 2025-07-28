import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { VendorModule } from './vendor/vendor.module';
import { ActivityModule } from './activity/activity.module';
import { CategoryModule } from './category/category.module';
import { CalendarEventModule } from './calendar-event/calendar-event.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    VendorModule,
    ActivityModule,
    CategoryModule,
    CalendarEventModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
