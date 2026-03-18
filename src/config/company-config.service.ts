import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanySettings } from './company-settings.entity';

@Injectable()
export class CompanyConfigService {
  constructor(
    @InjectRepository(CompanySettings)
    private readonly repo: Repository<CompanySettings>,
  ) {}

  async getSettings(): Promise<{ companyName: string; nit: string; address: string }> {
    let row = await this.repo.findOne({ where: { key: 'default' } });
    if (!row) {
      row = this.repo.create({
        key: 'default',
        companyName: '',
        nit: '',
        address: '',
      });
      await this.repo.save(row);
    }
    return {
      companyName: row.companyName ?? '',
      nit: row.nit ?? '',
      address: row.address ?? '',
    };
  }

  async updateSettings(dto: {
    companyName?: string;
    nit?: string;
    address?: string;
  }): Promise<{ companyName: string; nit: string; address: string }> {
    let row = await this.repo.findOne({ where: { key: 'default' } });
    if (!row) {
      row = this.repo.create({
        key: 'default',
        companyName: dto.companyName ?? '',
        nit: dto.nit ?? '',
        address: dto.address ?? '',
      });
    } else {
      if (dto.companyName !== undefined) row.companyName = dto.companyName;
      if (dto.nit !== undefined) row.nit = dto.nit;
      if (dto.address !== undefined) row.address = dto.address;
    }
    await this.repo.save(row);
    return this.getSettings();
  }
}
