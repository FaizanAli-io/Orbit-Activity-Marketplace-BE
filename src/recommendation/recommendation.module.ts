import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { SingleRecommendationModule } from './engine/single.core';
import { GroupRecommendationModule } from './engine/group.core';

@Module({
  imports: [
    PrismaModule,
    SingleRecommendationModule,
    GroupRecommendationModule,
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService],
})
export class RecommendationModule {}
