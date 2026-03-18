import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Client } from '../clients/client.entity';
import { InvoiceItem } from './invoice-item.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  clientId: string | null;

  @ManyToOne(() => Client, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clientId' })
  client: Client | null;

  @Column({ type: 'varchar', default: '' })
  numero: string;

  /** 'venta' | 'extra' | 'cotizacion' */
  @Column({ type: 'varchar', length: 12, default: 'venta' })
  invoiceType: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  total: number;

  /** Código de 6 dígitos que el usuario ingresa (clave en la factura). */
  @Column({ type: 'varchar', length: 6, unique: true, nullable: true })
  verificationCode: string | null;

  /** UUID único para verificación pública (en QR/enlace). No se puede adivinar. Doble factor con verificationCode. */
  @Column({ type: 'varchar', length: 36, unique: true, nullable: true })
  verificationUuid: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => InvoiceItem, (item) => item.invoice)
  items: InvoiceItem[];
}
