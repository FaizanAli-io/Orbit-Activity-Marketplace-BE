import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { InteractionService } from './interaction.service';
import { InteractionController } from './interaction.controller';

@Module({
  controllers: [ActivityController, InteractionController],
  providers: [ActivityService, InteractionService],
})
export class ActivityModule {}
