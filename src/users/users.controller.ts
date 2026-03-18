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
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequireView } from '../auth/decorators/require-view.decorator';
import { UsersService } from './users.service';
import { AuditService } from '../audit/audit.service';

function sanitizeUser(user: any) {
  if (!user) return user;
  const { passwordHash, ...rest } = user;
  return rest;
}

function toPlain(obj: any): Record<string, unknown> {
  if (!obj) return {};
  const { passwordHash, ...rest } = obj;
  return typeof rest === 'object' && rest !== null ? (rest as Record<string, unknown>) : {};
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireView('usuarios')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return users.map(sanitizeUser);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findByIdWithRole(id);
    return sanitizeUser(user);
  }

  @Post()
  async create(
    @Req() req: { user: { userId: string } },
    @Body() body: { documentId: string; password: string; name?: string; roleId?: string | null },
  ) {
    const user = await this.usersService.create(body.documentId, body.password, {
      name: body.name,
      roleId: body.roleId ?? null,
    });
    const current = await this.usersService.findByIdWithRole(req.user.userId);
    await this.auditService.log('user', user.id, 'create', null, toPlain(sanitizeUser(user)), {
      userId: req.user.userId,
      userName: current?.name ?? current?.documentId ?? undefined,
    });
    return sanitizeUser(user);
  }

  @Put(':id')
  async update(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() body: { name?: string; roleId?: string | null; active?: boolean },
  ) {
    const before = await this.usersService.findByIdWithRole(id);
    const user = await this.usersService.update(id, body);
    const current = await this.usersService.findByIdWithRole(req.user.userId);
    await this.auditService.log('user', id, 'update', toPlain(sanitizeUser(before)), toPlain(sanitizeUser(user)), {
      userId: req.user.userId,
      userName: current?.name ?? current?.documentId ?? undefined,
    });
    return sanitizeUser(user);
  }

  @Delete(':id')
  async remove(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    const before = await this.usersService.findByIdWithRole(id);
    await this.usersService.remove(id);
    const current = await this.usersService.findByIdWithRole(req.user.userId);
    await this.auditService.log('user', id, 'delete', toPlain(sanitizeUser(before)), null, {
      userId: req.user.userId,
      userName: current?.name ?? current?.documentId ?? undefined,
    });
  }
}
