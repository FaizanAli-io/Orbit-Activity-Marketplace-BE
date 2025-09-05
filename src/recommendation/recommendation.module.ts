import { Module } from '@nestjs/common';
import { EngineCoreModule } from './engine/engine.core';
import { PrismaModule } from '../prisma/prisma.module';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';

@Module({
  imports: [PrismaModule, EngineCoreModule],
  controllers: [RecommendationController],
  providers: [RecommendationService],
})
export class RecommendationModule {}
