import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { VendorService } from './vendor.service';

@ApiTags('vendors')
@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post()
  @ApiOperation({ summary: 'Create vendor' })
  @ApiBody({ type: Object })
  @ApiResponse({
    status: 201,
    description: 'The vendor has been successfully created.',
  })
  create(@Body() data: Prisma.VendorCreateInput) {
    return this.vendorService.create(data);
  }

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
}
