import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReccomendationService } from './reccomendation.service';
import { ReccomendationController } from './reccomendation.controller';

@Module({
  controllers: [ReccomendationController],
  providers: [ReccomendationService],
  imports: [PrismaModule],
})
export class ReccomendationModule {}
