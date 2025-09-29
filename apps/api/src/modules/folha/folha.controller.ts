import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ColaboradorInput, ColaboradorSchema, EncargosInput, EncargosSchema } from '@erp-saas/db';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { Roles } from '../../common/decorators/roles.decorator';
import { FolhaService } from './folha.service';

@ApiTags('folha')
@Roles('admin', 'gestor', 'rh')
@Controller('folha')
export class FolhaController {
  constructor(private readonly service: FolhaService) {}

  @Get('encargos')
  getEncargos() {
    return this.service.getEncargos();
  }

  @Put('encargos')
  updateEncargos(@Body(new ZodValidationPipe(EncargosSchema)) body: EncargosInput) {
    return this.service.updateEncargos(body);
  }

  @Get('colaboradores')
  listColaboradores() {
    return this.service.listColaboradores();
  }

  @Post('colaboradores')
  createColaborador(@Body(new ZodValidationPipe(ColaboradorSchema)) body: ColaboradorInput) {
    return this.service.createColaborador(body);
  }

  @Patch('colaboradores/:id')
  updateColaborador(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ColaboradorSchema.partial())) body: Partial<ColaboradorInput>,
  ) {
    return this.service.updateColaborador(id, body);
  }

  @Delete('colaboradores/:id')
  deleteColaborador(@Param('id') id: string) {
    return this.service.deleteColaborador(id);
  }
}
