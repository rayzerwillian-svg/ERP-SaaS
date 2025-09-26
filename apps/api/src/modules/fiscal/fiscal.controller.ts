import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import {
  FiscalEmissionSchema,
  FiscalNfseConfigSchema,
  FiscalSpedSchema,
  FiscalXmlSchema,
} from '@erp-saas/db';
import { FiscalService } from './fiscal.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';

type XmlDto = z.infer<typeof FiscalXmlSchema>;
type EmissionDto = z.infer<typeof FiscalEmissionSchema>;
type SpedDto = z.infer<typeof FiscalSpedSchema>;
type NfseDto = z.infer<typeof FiscalNfseConfigSchema>;

@ApiTags('fiscal')
@Roles('admin', 'gestor', 'fiscal')
@Controller('fiscal')
export class FiscalController {
  constructor(private readonly service: FiscalService) {}

  @Get('xml')
  listXml() {
    return this.service.listXml();
  }

  @Post('xml')
  addXml(@Body(new ZodValidationPipe(FiscalXmlSchema)) body: XmlDto) {
    return this.service.addXml(body);
  }

  @Post('emissao')
  emitir(@Body(new ZodValidationPipe(FiscalEmissionSchema)) body: EmissionDto) {
    return this.service.emitirDocumento(body);
  }

  @Post('sped/efd-contribuicoes')
  gerarSped(@Body(new ZodValidationPipe(FiscalSpedSchema)) body: SpedDto) {
    return this.service.gerarSped(body);
  }

  @Get('nfse-nacional/config')
  getConfig() {
    return this.service.getNfseConfig();
  }

  @Put('nfse-nacional/config')
  updateConfig(@Body(new ZodValidationPipe(FiscalNfseConfigSchema)) body: NfseDto) {
    return this.service.updateNfseConfig(body);
  }
}
