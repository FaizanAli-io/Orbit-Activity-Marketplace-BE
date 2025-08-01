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
import { Auth, AuthRole } from '../decorators';
import { SocialService } from './social.service';
import { AuthGuard } from '../guards/auth.guard';

@ApiTags('Social')
@Controller('social')
@UseGuards(AuthGuard)
@AuthRole('USER')
@ApiBearerAuth('access-token')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Get('friend-requests')
  @ApiOperation({ summary: 'List friend requests received by the user' })
  listFriendRequests(@Auth() auth: any) {
    return this.socialService.listFriendRequests(auth.userId);
  }

  @Post('friend-requests/:friendId')
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiParam({ name: 'friendId', type: Number })
  sendFriendRequest(@Param('friendId') friendId: number, @Auth() auth: any) {
    return this.socialService.sendFriendRequest(auth.userId, friendId);
  }

  @Post('friend-requests/:friendId/accept')
  @ApiOperation({ summary: 'Accept a friend request' })
  @ApiParam({ name: 'friendId', type: Number })
  acceptFriendRequest(@Param('friendId') friendId: number, @Auth() auth: any) {
    return this.socialService.acceptFriendRequest(auth.userId, friendId);
  }

  @Post('friend-requests/:friendId/decline')
  @ApiOperation({ summary: 'Decline a friend request' })
  @ApiParam({ name: 'friendId', type: Number })
  declineFriendRequest(@Param('friendId') friendId: number, @Auth() auth: any) {
    return this.socialService.declineFriendRequest(auth.userId, friendId);
  }

  @Get('friends')
  @ApiOperation({ summary: 'List friends' })
  listFriends(@Auth() auth: any) {
    return this.socialService.listFriends(auth.userId);
  }

  @Delete('friends/:friendId')
  @ApiOperation({ summary: 'Remove friend' })
  @ApiParam({ name: 'friendId', type: Number })
  removeFriend(@Param('friendId') friendId: number, @Auth() auth: any) {
    return this.socialService.removeFriend(auth.userId, friendId);
  }
}
