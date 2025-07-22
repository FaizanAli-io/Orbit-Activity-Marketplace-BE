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
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SocialService } from './social.service';
import { AuthGuard } from '../guards/auth.guard';
import { Auth } from '../decorators/auth.decorator';

@ApiTags('Social')
@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('friend-requests')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List friend requests received by the user' })
  listFriendRequests(@Auth() auth: any) {
    return this.socialService.listFriendRequests(auth.userId);
  }

  @Post('friend-requests/:friendId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiParam({ name: 'friendId', type: String })
  sendFriendRequest(@Param('friendId') friendId: string, @Auth() auth: any) {
    return this.socialService.sendFriendRequest(auth.userId, friendId);
  }

  @Post('friend-requests/:friendId/accept')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Accept a friend request' })
  @ApiParam({ name: 'friendId', type: String })
  acceptFriendRequest(@Param('friendId') friendId: string, @Auth() auth: any) {
    return this.socialService.acceptFriendRequest(auth.userId, friendId);
  }

  @Post('friend-requests/:friendId/decline')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Decline a friend request' })
  @ApiParam({ name: 'friendId', type: String })
  declineFriendRequest(@Param('friendId') friendId: string, @Auth() auth: any) {
    return this.socialService.declineFriendRequest(auth.userId, friendId);
  }

  @Get('friends')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List friends' })
  listFriends(@Auth() auth: any) {
    return this.socialService.listFriends(auth.userId);
  }

  @Delete('friends/:friendId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Remove friend' })
  @ApiParam({ name: 'friendId', type: String })
  removeFriend(@Param('friendId') friendId: string, @Auth() auth: any) {
    return this.socialService.removeFriend(auth.userId, friendId);
  }
}
