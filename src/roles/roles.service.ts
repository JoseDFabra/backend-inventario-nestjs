import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, ViewPermissions, defaultPermissions } from './role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly repo: Repository<Role>,
  ) {}

  findAll(): Promise<Role[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findOne(id: string): Promise<Role | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: { name: string; viewPermissions?: ViewPermissions }): Promise<Role> {
    const permissions = { ...defaultPermissions(), ...(data.viewPermissions || {}) };
    const role = this.repo.create({ name: data.name.trim(), viewPermissions: permissions });
    return this.repo.save(role);
  }

  async update(
    id: string,
    data: { name?: string; viewPermissions?: ViewPermissions },
  ): Promise<Role> {
    const role = await this.repo.findOne({ where: { id } });
    if (!role) throw new Error('Rol no encontrado');
    if (data.name !== undefined) role.name = data.name.trim();
    if (data.viewPermissions !== undefined) role.viewPermissions = { ...role.viewPermissions, ...data.viewPermissions };
    return this.repo.save(role);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
