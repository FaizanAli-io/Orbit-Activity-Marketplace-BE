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
} from '@nestjs/swagger';
import { UpdateUserDto } from './user.dto';
import { UserService } from './user.service';
import { PaginationDto } from '../utils/pagination.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { Auth, AuthRole, Public, ApiPagination } from '../common/decorators';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard)
@AuthRole('USER')
@ApiBearerAuth('access-token')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users.' })
  findAll() {
    return this.userService.findAll();
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
  })
  update(@Body() data: UpdateUserDto, @Auth() auth: any) {
    return this.userService.update(auth.userId, data);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete current user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully deleted.',
  })
  async remove(@Auth() auth: any) {
    return this.userService.remove(auth.userId);
  }

  @Get('liked')
  @ApiOperation({
    summary: 'Get all liked activities for the current user with pagination',
  })
  @ApiPagination()
  @ApiResponse({
    status: 200,
    description: 'Return paginated liked activities for user.',
  })
  getLiked(@Auth() auth: any, @Query() query: PaginationDto) {
    const { page, limit } = query;
    return this.userService.getLiked(auth.userId, { page, limit });
  }

  @Get('subscriptions')
  @ApiOperation({
    summary:
      'Get all signed-up activities for the current user with pagination',
  })
  @ApiPagination()
  @ApiResponse({
    status: 200,
    description: 'Return paginated subscribed activities for user.',
  })
  getSubscriptions(@Auth() auth: any, @Query() query: PaginationDto) {
    const { page, limit } = query;
    return this.userService.getSubscriptions(auth.userId, { page, limit });
  }
}
