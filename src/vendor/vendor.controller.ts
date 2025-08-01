import {
  Get,
  Patch,
  Delete,
  Body,
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
import { UpdateVendorDto } from './vendor.dto';
import { VendorService } from './vendor.service';
import { AuthGuard } from '../guards/auth.guard';
import { Auth, AuthRole, Public } from '../decorators';

@ApiTags('Vendors')
@Controller('vendors')
@UseGuards(AuthGuard)
@AuthRole('VENDOR')
@ApiBearerAuth('access-token')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all vendors' })
  @ApiResponse({ status: 200, description: 'Return all vendors.' })
  findAll() {
    return this.vendorService.findAll();
  }

  @Patch()
  @ApiOperation({ summary: 'Update current vendor' })
  @ApiBody({ type: UpdateVendorDto })
  @ApiResponse({
    status: 200,
    description: 'The vendor has been successfully updated.',
  })
  update(@Body() data: UpdateVendorDto, @Auth() auth: any) {
    return this.vendorService.update(auth.userId, data);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete current vendor' })
  @ApiResponse({
    status: 200,
    description: 'The vendor has been successfully deleted.',
  })
  async remove(@Auth() auth: any) {
    return this.vendorService.remove(auth.userId);
  }
}
