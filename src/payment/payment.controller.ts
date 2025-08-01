import {
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiParam,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Auth, AuthRole } from '../decorators';
import { AuthGuard } from '../guards/auth.guard';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, UpdatePaymentDto } from './dto';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(AuthGuard)
@AuthRole('USER')
@ApiBearerAuth('access-token')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  async create(@Body() dto: CreatePaymentDto, @Auth() auth: any) {
    return this.paymentService.create(dto, auth.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments for the authenticated user' })
  @ApiResponse({ status: 200 })
  async findAll(@Auth() auth: any) {
    return this.paymentService.findAll(auth.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID for the authenticated user' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Auth() auth: any) {
    return this.paymentService.findOne(id, auth.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update payment by ID for the authenticated user' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Payment updated successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentDto,
    @Auth() auth: any,
  ) {
    return this.paymentService.update(id, dto, auth.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete payment by ID for the authenticated user' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Payment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async remove(@Param('id', ParseIntPipe) id: number, @Auth() auth: any) {
    return this.paymentService.remove(id, auth.userId);
  }
}
