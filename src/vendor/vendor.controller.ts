import { Controller, Get, Patch, Body, Param, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { UpdateVendorDto } from './vendor.dto';
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
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Return vendor by id.' })
  findOne(@Param('id') id: number) {
    return this.vendorService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vendor by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateVendorDto })
  @ApiResponse({
    status: 200,
    description: 'The vendor has been successfully updated.',
  })
  update(@Param('id') id: number, @Body() data: UpdateVendorDto) {
    return this.vendorService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete vendor by id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'The vendor has been successfully deleted.',
  })
  async remove(@Param('id') id: number) {
    return this.vendorService.remove(id);
  }
}
