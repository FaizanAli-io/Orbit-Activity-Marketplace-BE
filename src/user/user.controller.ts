import {
  Get,
  Patch,
  Delete,
  Body,
  Query,
  UseGuards,
  Controller,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { PaginationDto } from '../utils/pagination.dto';
import { UserQueryDto, UpdateUserDto } from './user.dto';
import { Auth, AuthRole, ApiPagination } from '../common/decorators';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard)
@AuthRole('USER')
@ApiBearerAuth('access-token')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({
    summary: 'Get paginated list of users (optionally search by name)',
    description:
      'Returns a paginated list of users. You can provide a search query to filter users by name.',
  })
  @ApiPagination()
  @ApiResponse({
    status: 200,
    description: 'Paginated list of users',
  })
  findAll(@Auth() auth: any, @Query() query: UserQueryDto) {
    const { page, limit, search } = query;
    return this.userService.findAll(auth.userId, search, { page, limit });
  }

  @Patch()
  @ApiOperation({
    summary: 'Update current user',
    description: 'Updates the profile of the currently authenticated user.',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
  })
  update(@Body() data: UpdateUserDto, @Auth() auth: any) {
    return this.userService.update(auth.userId, data);
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete current user',
    description:
      'Deletes the current user account and its associated authentication record.',
  })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully deleted.',
  })
  remove(@Auth() auth: any) {
    return this.userService.remove(auth.userId);
  }

  @Get('liked')
  @ApiOperation({
    summary: 'Get paginated liked activities for current user',
    description:
      'Returns a paginated list of all activities liked by the current user.',
  })
  @ApiPagination()
  @ApiResponse({
    status: 200,
    description: 'Paginated list of liked activities.',
  })
  getLiked(@Auth() auth: any, @Query() query: PaginationDto) {
    const { page, limit } = query;
    return this.userService.getLiked(auth.userId, { page, limit });
  }

  @Get('subscriptions')
  @ApiOperation({
    summary: 'Get paginated subscribed activities for current user',
    description:
      'Returns a paginated list of all activities the current user has subscribed to.',
  })
  @ApiPagination()
  @ApiResponse({
    status: 200,
    description: 'Paginated list of subscribed activities.',
  })
  getSubscriptions(@Auth() auth: any, @Query() query: PaginationDto) {
    const { page, limit } = query;
    return this.userService.getSubscriptions(auth.userId, { page, limit });
  }
}
