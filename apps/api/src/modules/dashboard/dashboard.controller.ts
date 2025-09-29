import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
@Roles('admin', 'gestor', 'financeiro', 'fiscal', 'estoque', 'rh', 'atendimento', 'viewer')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get()
  overview() {
    return this.service.overview();
  }
}
