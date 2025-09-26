import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  PromptDefinitionInput,
  PromptDefinitionSchema,
  PromptDefinitionUpdateInput,
  PromptDefinitionUpdateSchema,
  RagCollectionInput,
  RagCollectionSchema,
} from '@erp-saas/db';
import { AiService, AiCompletePayload } from './ai.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';

@ApiTags('ai')
@Roles('admin', 'gestor', 'atendimento')
@Controller('ai')
export class AiController {
  constructor(private readonly service: AiService) {}

  @Get('prompt-studio')
  listPrompts() {
    return this.service.listPrompts();
  }

  @Post('prompt-studio')
  createPrompt(@Body(new ZodValidationPipe(PromptDefinitionSchema)) body: PromptDefinitionInput) {
    return this.service.createPrompt(body);
  }

  @Patch('prompt-studio/:id')
  updatePrompt(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(PromptDefinitionUpdateSchema)) body: PromptDefinitionUpdateInput,
  ) {
    return this.service.updatePrompt(id, body);
  }

  @Delete('prompt-studio/:id')
  deletePrompt(@Param('id') id: string) {
    return this.service.deletePrompt(id);
  }

  @Get('execucoes')
  listExecutions() {
    return this.service.listExecutions();
  }

  @Get('rag/collections')
  listRagCollections() {
    return this.service.listRagCollections();
  }

  @Post('rag/collections')
  createRagCollection(@Body(new ZodValidationPipe(RagCollectionSchema)) body: RagCollectionInput) {
    return this.service.createRagCollection(body);
  }

  @Post('complete')
  complete(@Body() body: AiCompletePayload) {
    return this.service.complete(body);
  }
}
