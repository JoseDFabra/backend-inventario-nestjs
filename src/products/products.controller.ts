import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductsService } from './products.service';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';

function toPlain(e: any): Record<string, unknown> {
  if (!e) return {};
  return typeof e === 'object' && e !== null ? { ...e } : {};
}

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const hasPagination = limit != null || offset != null;
    if (hasPagination) {
      return this.productsService.findAllPaginated(
        limit ? parseInt(limit, 10) : 30,
        offset ? parseInt(offset, 10) : 0,
      );
    }
    return this.productsService.findAll();
  }

  @Get('search')
  search(
    @Query('q') q: string,
    @Query('limit') limit: string,
    @Query('offset') offset: string,
  ) {
    return this.productsService.findSearch(
      q || '',
      limit ? parseInt(limit, 10) : 20,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  async create(
    @Req() req: { user?: { userId: string } },
    @Body() body: { name: string; code?: string; price?: number; quantity?: number; unit?: string },
  ) {
    const product = await this.productsService.create(body);
    const ctx = await this.auditContext(req);
    await this.auditService.log('product', product.id, 'create', null, toPlain(product), ctx);
    return product;
  }

  @Put(':id')
  async update(
    @Req() req: { user?: { userId: string } },
    @Param('id') id: string,
    @Body() body: { name?: string; code?: string; price?: number; quantity?: number; unit?: string },
  ) {
    const before = await this.productsService.findOne(id);
    const product = await this.productsService.update(id, body);
    const ctx = await this.auditContext(req);
    await this.auditService.log('product', id, 'update', toPlain(before), toPlain(product), ctx);
    return product;
  }

  @Delete(':id')
  async remove(
    @Req() req: { user?: { userId: string } },
    @Param('id') id: string,
  ) {
    const before = await this.productsService.findOne(id);
    await this.productsService.remove(id);
    const ctx = await this.auditContext(req);
    await this.auditService.log('product', id, 'delete', toPlain(before), null, ctx);
  }

  private async auditContext(req: { user?: { userId: string } }) {
    if (!req?.user?.userId) return {};
    const u = await this.usersService.findByIdWithRole(req.user.userId);
    return { userId: req.user.userId, userName: u?.name ?? u?.documentId ?? undefined };
  }
}
