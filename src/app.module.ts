import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { VendorModule } from './vendor/vendor.module';
import { PaymentModule } from './payment/payment.module';
import { ActivityModule } from './activity/activity.module';
import { CategoryModule } from './category/category.module';
import { CalendarEventModule } from './calendar-event/calendar-event.module';
import { RecommendationModule } from './recommendation/recommendation.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    VendorModule,
    PaymentModule,
    ActivityModule,
    CategoryModule,
    CalendarEventModule,
    RecommendationModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
