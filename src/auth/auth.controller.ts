import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpStatus,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: { user: { userId: string } }) {
    return this.authService.me(req.user.userId);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(
    @Body() dto: LoginDto,
    @Req() req: { ip?: string; headers?: { [key: string]: string }; socket?: { remoteAddress?: string } },
  ) {
    const ip = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers?.['x-real-ip']
      || req.ip
      || req.socket?.remoteAddress
      || null;
    const userAgent = req.headers?.['user-agent'] ?? null;
    try {
      return await this.authService.login(dto.documentId, dto.password, { ip: ip ?? undefined, userAgent: userAgent ?? undefined });
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      console.error('[AuthController.login]', err?.message ?? err);
      throw new HttpException(
        'Error al iniciar sesión. Revisa la consola del backend.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async changePassword(@Req() req: { user: { userId: string } }, @Body() dto: ChangePasswordDto) {
    try {
      await this.usersService.updatePassword(
        req.user.userId,
        dto.currentPassword,
        dto.newPassword,
      );
      return { message: 'Contraseña actualizada' };
    } catch (err) {
      if (err?.message === 'Contraseña actual incorrecta') {
        throw new HttpException('Contraseña actual incorrecta', HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(err?.message ?? 'Error al cambiar contraseña', HttpStatus.BAD_REQUEST);
    }
  }
}
