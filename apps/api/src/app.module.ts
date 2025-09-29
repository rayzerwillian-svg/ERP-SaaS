import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { CadastrosModule } from './modules/cadastros/cadastros.module';
import { FichasModule } from './modules/fichas/fichas.module';
import { PrecificacaoModule } from './modules/precificacao/precificacao.module';
import { SimulacoesModule } from './modules/simulacoes/simulacoes.module';
import { AnalisesModule } from './modules/analises/analises.module';
import { DespesasFixasModule } from './modules/despesas-fixas/despesas-fixas.module';
import { FolhaModule } from './modules/folha/folha.module';
import { DreModule } from './modules/dre/dre.module';
import { EntradasModule } from './modules/entradas/entradas.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { AiModule } from './modules/ai/ai.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { EventsModule } from './events/events.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { SecurityModule } from './modules/security/security.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EventsModule,
    AuthModule,
    CadastrosModule,
    FichasModule,
    PrecificacaoModule,
    SimulacoesModule,
    AnalisesModule,
    DespesasFixasModule,
    FolhaModule,
    DreModule,
    EntradasModule,
    FiscalModule,
    AiModule,
    DashboardModule,
    ComplianceModule,
    SecurityModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
