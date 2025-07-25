import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { VendorModule } from './vendor/vendor.module';
import { ActivityModule } from './activity/activity.module';
import { CalendarEventModule } from './calendar-event/calendar-event.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    VendorModule,
    ActivityModule,
    CalendarEventModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
