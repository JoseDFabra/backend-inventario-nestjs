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
import { ClientsService } from './clients.service';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';

function toPlain(e: any): Record<string, unknown> {
  if (!e) return {};
  return typeof e === 'object' && e !== null ? { ...e } : {};
}

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  async create(
    @Req() req: { user?: { userId: string } },
    @Body()
    body: { name: string; documentId?: string; email?: string; phone?: string; address?: string },
  ) {
    const client = await this.clientsService.create(body);
    const ctx = await this.auditContext(req);
    await this.auditService.log('client', client.id, 'create', null, toPlain(client), ctx);
    return client;
  }

  @Put(':id')
  async update(
    @Req() req: { user?: { userId: string } },
    @Param('id') id: string,
    @Body()
    body: { name?: string; documentId?: string; email?: string; phone?: string; address?: string },
  ) {
    const before = await this.clientsService.findOne(id);
    const client = await this.clientsService.update(id, body);
    const ctx = await this.auditContext(req);
    await this.auditService.log('client', id, 'update', toPlain(before), toPlain(client), ctx);
    return client;
  }

  @Delete(':id')
  async remove(
    @Req() req: { user?: { userId: string } },
    @Param('id') id: string,
  ) {
    const before = await this.clientsService.findOne(id);
    await this.clientsService.remove(id);
    const ctx = await this.auditContext(req);
    await this.auditService.log('client', id, 'delete', toPlain(before), null, ctx);
  }

  private async auditContext(req: { user?: { userId: string } }) {
    if (!req?.user?.userId) return {};
    const u = await this.usersService.findByIdWithRole(req.user.userId);
    return { userId: req.user.userId, userName: u?.name ?? u?.documentId ?? undefined };
  }
}
