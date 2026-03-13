import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UpsertServiceDto } from './dto/upsert-service.dto';
import { UpsertProductDto } from './dto/upsert-product.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';

@Controller('catalog')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('services')
  @Roles('manager', 'customer')
  async listServices(@CurrentUser() user: AuthUser | null) {
    if (!user) {
      return [];
    }
    return this.catalogService.listServices(user);
  }

  @Get('products')
  @Roles('manager', 'customer')
  async listProducts(@CurrentUser() user: AuthUser | null) {
    if (!user) {
      return [];
    }
    return this.catalogService.listProducts(user);
  }

  @Post('services')
  @Roles('manager')
  async upsertService(@CurrentUser() user: AuthUser | null, @Body() dto: UpsertServiceDto) {
    if (!user) {
      return null;
    }
    return this.catalogService.upsertService(user, dto);
  }

  @Post('products')
  @Roles('manager')
  async upsertProduct(@CurrentUser() user: AuthUser | null, @Body() dto: UpsertProductDto) {
    if (!user) {
      return null;
    }
    return this.catalogService.upsertProduct(user, dto);
  }
}
