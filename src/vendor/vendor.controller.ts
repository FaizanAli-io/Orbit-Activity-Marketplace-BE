import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { VendorService } from './vendor.service';

@ApiTags('Vendors')
@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get()
  @ApiOperation({ summary: 'Get all vendors' })
  @ApiResponse({ status: 200, description: 'Return all vendors.' })
  findAll() {
    return this.vendorService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Return vendor by id.' })
  findOne(@Param('id') id: string) {
    return this.vendorService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vendor by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: Object })
  @ApiResponse({
    status: 200,
    description: 'The vendor has been successfully updated.',
  })
  update(@Param('id') id: string, @Body() data: Prisma.VendorUpdateInput) {
    return this.vendorService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete vendor by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'The vendor has been successfully deleted.',
  })
  async remove(@Param('id') id: string) {
    return this.vendorService.remove(id);
  }
}
