import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs } from './config/envs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { InventoryModule } from './inventory/inventory.module';
import { ClientsModule } from './clients/clients.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ConfigModule } from './config/config.module';
import { UnitsModule } from './units/units.module';
import { RolesModule } from './roles/roles.module';
import { User } from './users/user.entity';
import { Product } from './products/product.entity';
import { Sale } from './sales/sale.entity';
import { InventoryMovement } from './inventory/movement.entity';
import { Client } from './clients/client.entity';
import { Invoice } from './invoices/invoice.entity';
import { InvoiceItem } from './invoices/invoice-item.entity';
import { CompanySettings } from './config/company-settings.entity';
import { Unit } from './units/unit.entity';
import { Role } from './roles/role.entity';
import { AuditModule } from './audit/audit.module';
import { AuditLog } from './audit/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: envs.database.url,
      entities: [User, Product, Sale, InventoryMovement, Client, Invoice, InvoiceItem, CompanySettings, Unit, Role, AuditLog],
      synchronize: envs.isDev,
      logging: envs.isDev,
      extra: {
        max: envs.database.poolSize,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: envs.database.connectTimeoutMs,
        ...(envs.database.ssl && { ssl: { rejectUnauthorized: envs.database.sslRejectUnauthorized } }),
      },
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    SalesModule,
    InventoryModule,
    ClientsModule,
    InvoicesModule,
    ConfigModule,
    UnitsModule,
    RolesModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
