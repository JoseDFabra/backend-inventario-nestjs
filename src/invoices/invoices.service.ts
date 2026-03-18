import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Invoice } from './invoice.entity';
import { InvoiceItem } from './invoice-item.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private readonly itemRepo: Repository<InvoiceItem>,
    private readonly productsService: ProductsService,
  ) {}

  async findAll(fecha?: string): Promise<Invoice[]> {
    const where: { fecha?: string } = {};
    if (fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      where.fecha = fecha;
    }
    return this.invoiceRepo.find({
      where,
      relations: ['client', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Invoice | null> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['client', 'items', 'items.product'],
    });
    if (invoice && !invoice.verificationUuid) {
      invoice.verificationUuid = randomUUID();
      await this.invoiceRepo.save(invoice);
    }
    return invoice;
  }

  async findByVerificationCode(code: string): Promise<Invoice | null> {
    if (!code || code.length !== 6) return null;
    return this.invoiceRepo.findOne({
      where: { verificationCode: code.trim() },
      relations: ['client', 'items', 'items.product'],
    });
  }

  /** Verificación pública con doble factor: UUID (de QR/enlace) + código de 6 dígitos (de la factura). */
  async verifyByUuidAndCode(verificationUuid: string, code: string): Promise<Invoice | null> {
    if (!verificationUuid || !code || code.length !== 6) return null;
    const invoice = await this.invoiceRepo.findOne({
      where: { verificationUuid: verificationUuid.trim(), verificationCode: code.trim() },
      relations: ['client', 'items', 'items.product'],
    });
    return invoice;
  }

  private async generateVerificationCode(): Promise<string> {
    const digits = '0123456789';
    for (let attempt = 0; attempt < 20; attempt++) {
      let code = '';
      for (let i = 0; i < 6; i++) code += digits[Math.floor(Math.random() * digits.length)];
      const existing = await this.invoiceRepo.findOne({ where: { verificationCode: code } });
      if (!existing) return code;
    }
    return Date.now().toString().slice(-6);
  }

  private async getNextInvoiceNumero(): Promise<string> {
    const count = await this.invoiceRepo.count();
    return String(count + 1).padStart(6, '0');
  }

  async create(data: {
    clientId?: string | null;
    numero?: string;
    fecha: string;
    invoiceType?: 'venta' | 'extra' | 'cotizacion';
    items: { productId?: string; description?: string; quantity: number; unitPrice?: number }[];
  }): Promise<Invoice> {
    const fecha = data.fecha || new Date().toISOString().slice(0, 10);
    const verificationCode = await this.generateVerificationCode();
    const verificationUuid = randomUUID();
    const invoiceType =
      data.invoiceType === 'extra' ? 'extra' : data.invoiceType === 'cotizacion' ? 'cotizacion' : 'venta';
    let total = 0;
    const numero =
      data.numero != null && String(data.numero).trim() !== ''
        ? String(data.numero).trim()
        : await this.getNextInvoiceNumero();
    const invoice = this.invoiceRepo.create({
      clientId: data.clientId ?? null,
      numero,
      fecha,
      invoiceType,
      total: 0,
      verificationCode,
      verificationUuid,
    });
    await this.invoiceRepo.save(invoice);

    for (const row of data.items) {
      const qty = Math.max(1, Math.round(Number(row.quantity) || 1));
      let unitPrice = 0;
      let productId: string | null = null;
      let description: string | null = null;

      if (row.productId) {
        const product = await this.productsService.findOne(row.productId);
        if (!product) continue;
        unitPrice = row.unitPrice != null ? Math.round(Number(row.unitPrice)) : Math.round(Number(product.price));
        productId = row.productId;
      } else if (row.description != null && String(row.description).trim()) {
        unitPrice = row.unitPrice != null ? Math.round(Number(row.unitPrice)) : 0;
        description = String(row.description).trim();
      } else {
        continue;
      }

      const subtotal = qty * unitPrice;
      total += subtotal;
      const item = this.itemRepo.create({
        invoiceId: invoice.id,
        productId,
        description,
        quantity: qty,
        unitPrice,
        subtotal,
      });
      await this.itemRepo.save(item);
    }

    invoice.total = total;
    await this.invoiceRepo.save(invoice);
    return this.findOne(invoice.id) as Promise<Invoice>;
  }
}
