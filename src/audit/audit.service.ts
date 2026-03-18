import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

export interface AuditContext {
  userId?: string | null;
  userName?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async log(
    entityType: string,
    entityId: string,
    action: AuditAction,
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
    ctx?: AuditContext,
  ): Promise<AuditLog> {
    const entry = this.repo.create({
      userId: ctx?.userId ?? null,
      userName: ctx?.userName ?? 'Sistema',
      entityType,
      entityId,
      action,
      before: before ? this.sanitize(before) : null,
      after: after ? this.sanitize(after) : null,
    });
    return this.repo.save(entry);
  }

  private sanitize(obj: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'passwordHash') continue;
      if (v !== undefined && v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
        out[k] = this.sanitize(v as Record<string, unknown>);
      } else {
        out[k] = v;
      }
    }
    return out;
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<{ items: AuditLog[]; total: number }> {
    const [items, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(1, limit), 100),
      skip: Math.max(0, offset),
    });
    return { items, total };
  }

  async findOne(id: string): Promise<AuditLog | null> {
    return this.repo.findOne({ where: { id } });
  }
}
