import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  findAll(): Promise<Product[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findAllPaginated(
    limit: number = 30,
    offset: number = 0,
  ): Promise<{
    items: Product[];
    total: number;
    totalQuantity: number;
    totalValue: number;
  }> {
    const take = Math.min(Math.max(1, limit), 100);
    const skip = Math.max(0, offset);
    const [items, total] = await this.repo.findAndCount({
      order: { name: 'ASC' },
      take,
      skip,
    });
    const agg = await this.repo
      .createQueryBuilder('product')
      .select('COALESCE(SUM(product.stock), 0)', 'totalQuantity')
      .addSelect('COALESCE(SUM(product.stock * product.price), 0)', 'totalValue')
      .getRawOne<{ totalQuantity: string; totalValue: string }>();
    const totalQuantity = Number(agg?.totalQuantity ?? 0) || 0;
    const totalValue = Number(agg?.totalValue ?? 0) || 0;
    return { items, total, totalQuantity, totalValue };
  }

  async findSearch(
    search: string,
    limit: number = DEFAULT_PAGE_SIZE,
    offset: number = 0,
  ): Promise<{ items: Product[]; total: number }> {
    const term = (search || '').trim();
    const take = Math.min(Math.max(1, limit), 50);
    const skip = Math.max(0, offset);

    if (!term) {
      return { items: [], total: 0 };
    }

    const qb = this.repo
      .createQueryBuilder('product')
      .where('product.name ILIKE :term OR product.code ILIKE :term', { term: `%${term}%` })
      .orderBy('product.name', 'ASC')
      .take(take)
      .skip(skip);
    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  findOne(id: string): Promise<Product | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<Product>): Promise<Product> {
    const product = this.repo.create(data);
    return this.repo.save(product);
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    await this.repo.update(id, data as object);
    const updated = await this.repo.findOne({ where: { id } });
    if (!updated) throw new Error('Product not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
