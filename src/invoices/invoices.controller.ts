import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  findAll(@Query('fecha') fecha?: string) {
    return this.invoicesService.findAll(fecha);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: {
      clientId?: string | null;
      numero?: string;
      fecha: string;
      invoiceType?: 'venta' | 'extra' | 'cotizacion';
      items: { productId?: string; description?: string; quantity: number; unitPrice?: number }[];
    },
  ) {
    return this.invoicesService.create(body);
  }
}
