import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyConfigService } from './company-config.service';

@Controller('config')
@UseGuards(JwtAuthGuard)
export class ConfigController {
  constructor(private readonly configService: CompanyConfigService) {}

  @Get()
  get() {
    return this.configService.getSettings();
  }

  @Put()
  update(
    @Body()
    body: { companyName?: string; nit?: string; address?: string },
  ) {
    return this.configService.updateSettings(body);
  }
}
