import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SalesService } from './sales.service';
import { UsersService } from '../users/users.service';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Post()
  async create(
    @Req() req: { user?: { userId: string } },
    @Body() body: { productId: string; quantity: number },
  ) {
    const soldBy = req?.user?.userId
      ? await this.usersService.findByIdWithRole(req.user.userId).then((u) =>
          u ? { userId: u.id, userName: u.name || u.documentId || 'Usuario' } : undefined,
        )
      : undefined;
    return this.salesService.create(body.productId, body.quantity ?? 1, soldBy);
  }
}
