import { Body, Controller, Post, NotFoundException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CompanyConfigService } from '../config/company-config.service';

@Controller('public/invoices')
export class InvoicesPublicController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly companyConfig: CompanyConfigService,
  ) {}

  /** Verificación con doble factor: UUID (del enlace/QR) + código de 6 dígitos (de la factura). */
  @Post('verify')
  async verify(@Body() body: { verificationUuid?: string; code?: string }) {
    const verificationUuid = body?.verificationUuid?.trim();
    const code = body?.code?.trim();
    if (!verificationUuid || !code) {
      throw new NotFoundException('Se requiere el enlace de la factura y el código de verificación.');
    }
    const invoice = await this.invoicesService.verifyByUuidAndCode(verificationUuid, code);
    if (!invoice) throw new NotFoundException('Factura no encontrada o código inválido.');
    const company = await this.companyConfig.getSettings();
    return { invoice, company };
  }
}
