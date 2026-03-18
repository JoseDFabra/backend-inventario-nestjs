import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';

const DOC_PHONE_MAX = 10;
const DOC_PHONE_REGEX = /^\d{1,10}$/;

function validateDocumentOrPhone(value: string | null | undefined, fieldName: string): void {
  if (value == null || value === '') return;
  const v = String(value).trim();
  if (!v) return;
  if (!DOC_PHONE_REGEX.test(v) || v.length > DOC_PHONE_MAX) {
    throw new BadRequestException(`${fieldName} debe ser solo números y máximo ${DOC_PHONE_MAX} dígitos.`);
  }
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly repo: Repository<Client>,
  ) {}

  findAll(): Promise<Client[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findOne(id: string): Promise<Client | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<Client>): Promise<Client> {
    const doc = data.documentId != null ? String(data.documentId).trim() : '';
    if (!doc) {
      throw new BadRequestException('El documento (NIT/cédula) del cliente es obligatorio.');
    }
    validateDocumentOrPhone(doc, 'El documento');
    if (data.phone != null && String(data.phone).trim()) {
      validateDocumentOrPhone(String(data.phone).trim(), 'El teléfono');
    }
    const client = this.repo.create(data);
    return this.repo.save(client);
  }

  async update(id: string, data: Partial<Client>): Promise<Client> {
    if (data.documentId !== undefined) {
      const doc = data.documentId != null ? String(data.documentId).trim() : '';
      if (!doc) {
        throw new BadRequestException('El documento (NIT/cédula) del cliente es obligatorio.');
      }
      validateDocumentOrPhone(doc, 'El documento');
    }
    if (data.phone !== undefined && data.phone != null && String(data.phone).trim()) {
      validateDocumentOrPhone(String(data.phone).trim(), 'El teléfono');
    }
    await this.repo.update(id, data as object);
    const updated = await this.repo.findOne({ where: { id } });
    if (!updated) throw new Error('Cliente no encontrado');
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
