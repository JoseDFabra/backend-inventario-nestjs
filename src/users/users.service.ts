import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByIdWithRole(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id }, relations: ['role'] });
  }

  async findByDocumentId(documentId: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { documentId, active: true },
      relations: ['role'],
    });
  }

  async findAll(): Promise<User[]> {
    return this.userRepo.find({
      relations: ['role'],
      order: { name: 'ASC' },
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user?.passwordHash) return false;
    try {
      return await bcrypt.compare(password, user.passwordHash);
    } catch {
      return false;
    }
  }

  async create(
    documentId: string,
    password: string,
    options?: { name?: string; isSuperAdmin?: boolean; roleId?: string | null },
  ): Promise<User> {
    const doc = (documentId || '').trim();
    if (!/^\d{1,10}$/.test(doc)) {
      throw new BadRequestException('El documento debe ser solo números y máximo 10 dígitos.');
    }
    const existing = await this.userRepo.findOne({ where: { documentId: doc } });
    if (existing) throw new Error('Ya existe un usuario con ese documento');
    const hash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({
      documentId: doc,
      passwordHash: hash,
      name: options?.name ?? '',
      isSuperAdmin: options?.isSuperAdmin ?? false,
      roleId: options?.roleId ?? null,
    });
    return this.userRepo.save(user);
  }

  async update(
    id: string,
    data: { name?: string; roleId?: string | null; active?: boolean },
  ): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new Error('Usuario no encontrado');
    if (data.name !== undefined) user.name = data.name;
    if (data.roleId !== undefined) user.roleId = data.roleId;
    if (data.active !== undefined) user.active = data.active;
    await this.userRepo.save(user);
    return this.findByIdWithRole(id) as Promise<User>;
  }

  async remove(id: string): Promise<void> {
    await this.userRepo.delete(id);
  }

  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');
    const valid = await this.validatePassword(user, currentPassword);
    if (!valid) throw new Error('Contraseña actual incorrecta');
    const hash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(userId, { passwordHash: hash });
  }

  async ensureAdminExists(): Promise<void> {
    const existing = await this.userRepo.findOne({
      where: { documentId: '12345' },
    });
    if (existing) return;
    await this.create('12345', 'Admin123!', {
      name: 'Super Admin',
      isSuperAdmin: true,
    });
  }
}
