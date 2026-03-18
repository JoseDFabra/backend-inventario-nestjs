import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanySettings } from './company-settings.entity';
import { CompanyConfigService } from './company-config.service';
import { ConfigController } from './config.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CompanySettings])],
  controllers: [ConfigController],
  providers: [CompanyConfigService],
  exports: [CompanyConfigService],
})
export class ConfigModule {}
