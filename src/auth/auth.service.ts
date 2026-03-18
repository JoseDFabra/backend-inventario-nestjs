import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { User } from '../users/user.entity';
import { VIEW_KEYS } from '../roles/role.entity';

export interface LoginMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  getPermissions(user: User): string[] {
    if (user.isSuperAdmin) return [...VIEW_KEYS];
    const perms = user.role?.viewPermissions;
    if (!perms) return [];
    return VIEW_KEYS.filter((k) => perms[k as keyof typeof perms]);
  }

  async login(
    documentId: string,
    password: string,
    meta?: LoginMeta,
  ): Promise<{
    access_token: string;
    user: { name: string; isSuperAdmin: boolean; permissions: string[] };
  }> {
    try {
      if (!documentId?.trim() || !password) {
        throw new UnauthorizedException('Credenciales inválidas');
      }
      const doc = documentId.trim();
      if (!/^\d{1,10}$/.test(doc)) {
        throw new BadRequestException('El documento debe ser solo números y máximo 10 dígitos.');
      }
      const user = await this.usersService.findByDocumentId(doc);
      if (!user) {
        throw new UnauthorizedException('Credenciales inválidas');
      }
      const valid = await this.usersService.validatePassword(user, password);
      if (!valid) {
        throw new UnauthorizedException('Credenciales inválidas');
      }
      const payload = { sub: user.id, documentId: user.documentId };
      const access_token = this.jwtService.sign(payload);
      const permissions = this.getPermissions(user);
      const userName = user.name || user.documentId || 'Usuario';
      await this.auditService.log(
        'login',
        user.id,
        'login',
        null,
        {
          ip: meta?.ip ?? null,
          userAgent: meta?.userAgent ?? null,
        },
        { userId: user.id, userName },
      );
      return {
        access_token,
        user: {
          name: userName,
          isSuperAdmin: !!user.isSuperAdmin,
          permissions,
        },
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      console.error('[AuthService.login]', err);
      throw err;
    }
  }

  async me(userId: string): Promise<{ name: string; isSuperAdmin: boolean; permissions: string[] }> {
    const user = await this.usersService.findByIdWithRole(userId);
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    return {
      name: user.name || user.documentId || 'Usuario',
      isSuperAdmin: !!user.isSuperAdmin,
      permissions: this.getPermissions(user),
    };
  }
}
