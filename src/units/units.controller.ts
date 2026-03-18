import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UnitsService } from './units.service';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';

function toPlain(e: any): Record<string, unknown> {
  if (!e) return {};
  return typeof e === 'object' && e !== null ? { ...e } : {};
}

@Controller('units')
@UseGuards(JwtAuthGuard)
export class UnitsController {
  constructor(
    private readonly unitsService: UnitsService,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll() {
    return this.unitsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unitsService.findOne(id);
  }

  @Post()
  async create(
    @Req() req: { user?: { userId: string } },
    @Body() body: { name: string },
  ) {
    const unit = await this.unitsService.create(body);
    const ctx = await this.auditContext(req);
    await this.auditService.log('unit', unit.id, 'create', null, toPlain(unit), ctx);
    return unit;
  }

  @Put(':id')
  async update(
    @Req() req: { user?: { userId: string } },
    @Param('id') id: string,
    @Body() body: { name: string },
  ) {
    const before = await this.unitsService.findOne(id);
    const unit = await this.unitsService.update(id, body);
    const ctx = await this.auditContext(req);
    await this.auditService.log('unit', id, 'update', toPlain(before), toPlain(unit), ctx);
    return unit;
  }

  @Delete(':id')
  async remove(
    @Req() req: { user?: { userId: string } },
    @Param('id') id: string,
  ) {
    const before = await this.unitsService.findOne(id);
    await this.unitsService.remove(id);
    const ctx = await this.auditContext(req);
    await this.auditService.log('unit', id, 'delete', toPlain(before), null, ctx);
  }

  private async auditContext(req: { user?: { userId: string } }) {
    if (!req?.user?.userId) return {};
    const u = await this.usersService.findByIdWithRole(req.user.userId);
    return { userId: req.user.userId, userName: u?.name ?? u?.documentId ?? undefined };
  }
}
