import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UpsertServiceDto } from './dto/upsert-service.dto';
import { UpsertProductDto } from './dto/upsert-product.dto';

@Controller('catalog')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('services')
  @Roles('manager', 'customer')
  async listServices() {
    return this.catalogService.listServices();
  }

  @Get('products')
  @Roles('manager', 'customer')
  async listProducts() {
    return this.catalogService.listProducts();
  }

  @Post('services')
  @Roles('manager')
  async upsertService(@Body() dto: UpsertServiceDto) {
    return this.catalogService.upsertService(dto);
  }

  @Post('products')
  @Roles('manager')
  async upsertProduct(@Body() dto: UpsertProductDto) {
    return this.catalogService.upsertProduct(dto);
  }
}
