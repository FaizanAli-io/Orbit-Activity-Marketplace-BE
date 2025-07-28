import {
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Controller,
} from '@nestjs/common';

import {
  ApiTags,
  ApiParam,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { AuthGuard } from '../guards/auth.guard';
import { Auth } from '../decorators/auth.decorator';
import { AuthRole } from '../decorators/auth-role.decorator';

import { InteractionService } from './interaction.service';

@ApiTags('Interactions')
@Controller('activities')
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @Get(':id/likes')
  @ApiOperation({ summary: 'Get all users who liked an activity' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Return all users who liked the activity.',
  })
  getActivityLikes(@Param('id') id: number) {
    return this.interactionService.getActivityLikes(id);
  }

  @Post(':id/like')
  @UseGuards(AuthGuard)
  @AuthRole('USER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Like an activity' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 201, description: 'Activity liked successfully.' })
  like(@Param('id') id: number, @Auth() auth: any) {
    return this.interactionService.like(id, auth.userId);
  }

  @Delete(':id/unlike')
  @UseGuards(AuthGuard)
  @AuthRole('USER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove like from an activity' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Like removed successfully.' })
  unlike(@Param('id') id: number, @Auth() auth: any) {
    return this.interactionService.unlike(id, auth.userId);
  }

  @Get(':id/subscriptions')
  @ApiOperation({ summary: 'Get all users subscribed to an activity' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Return all users subscribed to the activity.',
  })
  getActivitySubscriptions(@Param('id') id: number) {
    return this.interactionService.getActivitySubscriptions(id);
  }

  @Post(':id/subscribe')
  @UseGuards(AuthGuard)
  @AuthRole('USER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'User subscribes/signs up for an activity' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Subscribed to activity successfully.',
  })
  subscribe(@Param('id') id: number, @Auth() auth: any) {
    return this.interactionService.subscribe(id, auth.userId);
  }

  @Delete(':id/unsubscribe')
  @UseGuards(AuthGuard)
  @AuthRole('USER')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cancel activity subscription' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully.',
  })
  unsubscribe(@Param('id') id: number, @Auth() auth: any) {
    return this.interactionService.unsubscribe(id, auth.userId);
  }
}
