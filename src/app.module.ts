import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { CacheModule } from './cache/redis.module';

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
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule,
    AuthModule,
    UserModule,
    VendorModule,
    PaymentModule,
    ActivityModule,
    CategoryModule,
    CalendarEventModule,
    RecommendationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
