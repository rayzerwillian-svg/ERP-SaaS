import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FichaTecnicaInput, FichaTecnicaSchema, FichaTecnicaItemSchema } from '@erp-saas/db';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { Roles } from '../../common/decorators/roles.decorator';
import { FichasService } from './fichas.service';

@ApiTags('fichas')
@Roles('admin', 'gestor', 'estoque')
@Controller('fichas')
export class FichasController {
  constructor(private readonly service: FichasService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(@Body(new ZodValidationPipe(FichaTecnicaSchema)) body: FichaTecnicaInput) {
    return this.service.create(body);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(FichaTecnicaSchema.partial())) body: Partial<FichaTecnicaInput>,
  ) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Post(':id/itens')
  addItem(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(FichaTecnicaItemSchema)) body: z.infer<typeof FichaTecnicaItemSchema>,
  ) {
    return this.service.addItem(id, body);
  }

  @Patch(':id/itens')
  updateItem(
    @Param('id') id: string,
    @Query('itemId') itemId: string,
    @Body(new ZodValidationPipe(FichaTecnicaItemSchema)) body: z.infer<typeof FichaTecnicaItemSchema>,
  ) {
    if (!itemId) {
      throw new BadRequestException('itemId é obrigatório');
    }
    return this.service.updateItem(id, itemId, body);
  }

  @Delete(':id/itens')
  removeItem(@Param('id') id: string, @Query('itemId') itemId: string) {
    if (!itemId) {
      throw new BadRequestException('itemId é obrigatório');
    }
    return this.service.removeItem(id, itemId);
  }

  @Post(':id/recalcular-custos')
  recalcular(@Param('id') id: string) {
    return this.service.recalcular(id);
  }
}
