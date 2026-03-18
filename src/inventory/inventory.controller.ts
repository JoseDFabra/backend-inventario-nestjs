import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('movements')
  findAll() {
    return this.inventoryService.findAll();
  }

  @Get('movements/product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.inventoryService.findByProduct(productId);
  }

  @Post('movements')
  addMovement(
    @Body() body: { productId: string; type: 'in' | 'out' | 'adjust'; quantity: number; reason?: string },
  ) {
    return this.inventoryService.addMovement(
      body.productId,
      body.type,
      body.quantity,
      body.reason,
    );
  }
}
