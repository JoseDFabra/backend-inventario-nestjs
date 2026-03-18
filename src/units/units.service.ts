import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from './unit.entity';

const DEFAULT_UNITS = ['Unidad', 'Caja de 10', 'Caja de 12', 'kg', 'g', 'Litro', 'ml', 'Paquete', 'Metro', 'm²'];

@Injectable()
export class UnitsService implements OnModuleInit {
  constructor(
    @InjectRepository(Unit)
    private readonly repo: Repository<Unit>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count > 0) return;
    for (const name of DEFAULT_UNITS) {
      await this.repo.save(this.repo.create({ name }));
    }
  }

  findAll(): Promise<Unit[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findOne(id: string): Promise<Unit | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: { name: string }): Promise<Unit> {
    const name = (data.name || '').trim();
    if (!name) throw new Error('El nombre de la unidad es obligatorio');
    const existing = await this.repo.findOne({ where: { name } });
    if (existing) throw new Error('Ya existe una unidad con ese nombre');
    const unit = this.repo.create({ name });
    return this.repo.save(unit);
  }

  async update(id: string, data: { name: string }): Promise<Unit> {
    const name = (data.name || '').trim();
    if (!name) throw new Error('El nombre de la unidad es obligatorio');
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new Error('Unidad no encontrada');
    const duplicate = await this.repo.findOne({ where: { name } });
    if (duplicate && duplicate.id !== id) throw new Error('Ya existe una unidad con ese nombre');
    await this.repo.update(id, { name });
    const updated = await this.repo.findOne({ where: { id } });
    if (!updated) throw new Error('Unidad no encontrada');
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
