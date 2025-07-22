import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { UserService } from './user.service';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users.' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Return user by id.' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: Object })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
  })
  update(@Param('id') id: string, @Body() data: Prisma.UserUpdateInput) {
    return this.userService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully deleted.',
  })
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    await this.userService.deleteAuth(id);
    return { message: 'User and auth deleted' };
  }

  @Get(':id/liked')
  @ApiOperation({ summary: 'Get all liked activities for a user' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return all liked activities for user.',
  })
  getLiked(@Param('id') id: string) {
    return this.userService.getLiked(id);
  }

  @Get(':id/subscriptions')
  @ApiOperation({ summary: 'Get all signed-up activities for a user' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Return all subscribed activities for user.',
  })
  getSubscriptions(@Param('id') id: string) {
    return this.userService.getSubscriptions(id);
  }
}
