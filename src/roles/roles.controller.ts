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
import { RolesService } from './roles.service';
import { ViewPermissions } from './role.entity';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireView('usuarios')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  async create(
    @Req() req: { user: { userId: string } },
    @Body() body: { name: string; viewPermissions?: ViewPermissions },
  ) {
    const role = await this.rolesService.create(body);
    const current = await this.usersService.findByIdWithRole(req.user.userId);
    await this.auditService.log('role', role.id, 'create', null, { id: role.id, name: role.name, viewPermissions: role.viewPermissions }, {
      userId: req.user.userId,
      userName: current?.name ?? current?.documentId ?? undefined,
    });
    return role;
  }

  @Put(':id')
  async update(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() body: { name?: string; viewPermissions?: ViewPermissions },
  ) {
    const before = await this.rolesService.findOne(id);
    const role = await this.rolesService.update(id, body);
    const current = await this.usersService.findByIdWithRole(req.user.userId);
    await this.auditService.log('role', id, 'update',
      before ? { id: before.id, name: before.name, viewPermissions: before.viewPermissions } : null,
      { id: role.id, name: role.name, viewPermissions: role.viewPermissions },
      { userId: req.user.userId, userName: current?.name ?? current?.documentId ?? undefined },
    );
    return role;
  }

  @Delete(':id')
  async remove(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
  ) {
    const before = await this.rolesService.findOne(id);
    await this.rolesService.remove(id);
    const current = await this.usersService.findByIdWithRole(req.user.userId);
    await this.auditService.log('role', id, 'delete',
      before ? { id: before.id, name: before.name, viewPermissions: before.viewPermissions } : null,
      null,
      { userId: req.user.userId, userName: current?.name ?? current?.documentId ?? undefined },
    );
  }
}
