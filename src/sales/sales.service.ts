import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from '../products/products.service';
import { Sale } from './sale.entity';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly repo: Repository<Sale>,
    private readonly productsService: ProductsService,
  ) {}

  async findAll(): Promise<Sale[]> {
    return this.repo.find({
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  findOne(id: string): Promise<Sale | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['product'],
    });
  }

  async create(
    productId: string,
    quantity: number,
    soldBy?: { userId: string; userName: string },
  ): Promise<Sale> {
    const product = await this.productsService.findOne(productId);
    if (!product) throw new Error('Producto no encontrado');
    const total = Number(product.price) * quantity;
    const sale = this.repo.create({
      productId,
      quantity,
      total,
      soldByUserId: soldBy?.userId ?? null,
      soldByUserName: soldBy?.userName ?? null,
    });
    await this.repo.save(sale);
    return this.repo.findOneOrFail({
      where: { id: sale.id },
      relations: ['product'],
    });
  }
}
