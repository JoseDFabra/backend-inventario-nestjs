import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryMovement, type MovementType } from './movement.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly repo: Repository<InventoryMovement>,
    private readonly productsService: ProductsService,
  ) {}

  async findAll(): Promise<InventoryMovement[]> {
    return this.repo.find({
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByProduct(productId: string): Promise<InventoryMovement[]> {
    return this.repo.find({
      where: { productId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async addMovement(
    productId: string,
    type: MovementType,
    quantity: number,
    reason?: string,
  ): Promise<InventoryMovement> {
    const product = await this.productsService.findOne(productId);
    if (!product) throw new Error('Producto no encontrado');
    const movement = this.repo.create({ productId, type, quantity, reason });
    await this.repo.save(movement);
    return this.repo.findOneOrFail({
      where: { id: movement.id },
      relations: ['product'],
    });
  }
}
