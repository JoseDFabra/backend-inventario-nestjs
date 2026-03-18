import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';
import { VIEW_METADATA_KEY } from '../decorators/require-view.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.userId;
    if (!userId) throw new ForbiddenException('No autorizado');
    const user = await this.usersService.findByIdWithRole(userId);
    if (!user) throw new ForbiddenException('Usuario no encontrado');
    if (user.isSuperAdmin) return true;
    const requiredView = this.reflector.get<string>(VIEW_METADATA_KEY, context.getHandler())
      ?? this.reflector.get<string>(VIEW_METADATA_KEY, context.getClass())
      ?? 'usuarios';
    const perms = user.role?.viewPermissions as Record<string, boolean> | undefined;
    if (perms?.[requiredView]) return true;
    throw new ForbiddenException('No tienes permiso para esta acción');
  }
}
