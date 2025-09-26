import { Injectable, NotFoundException } from '@nestjs/common';
import { complete } from '@erp-saas/ai';
import {
  PromptDefinitionInput,
  PromptDefinitionSchema,
  PromptDefinitionUpdateInput,
  PromptDefinitionUpdateSchema,
  RagCollectionInput,
  RagCollectionSchema,
} from '@erp-saas/db';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toPlain } from '../../prisma/prisma.utils';

export type AiCompletePayload = Parameters<typeof complete>[0] & {
  promptId?: string;
  createdByRole?: string;
};

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async listPrompts() {
    const prompts = await this.prisma.aiPrompt.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return prompts.map((prompt) => this.mapPrompt(prompt));
  }

  async createPrompt(definition: PromptDefinitionInput) {
    const data = PromptDefinitionSchema.parse(definition);
    const prompt = await this.prisma.aiPrompt.create({
      data: this.toPromptPersistence(data) as Prisma.AiPromptUncheckedCreateInput,
    });
    return this.mapPrompt(prompt);
  }

  async updatePrompt(id: string, partial: PromptDefinitionUpdateInput) {
    const data = PromptDefinitionUpdateSchema.parse(partial);
    try {
      const prompt = await this.prisma.aiPrompt.update({
        where: { id },
        data: this.toPromptPersistence(data),
      });
      return this.mapPrompt(prompt);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Prompt não encontrado');
      }
      throw error;
    }
  }

  async deletePrompt(id: string) {
    try {
      await this.prisma.aiPrompt.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Prompt não encontrado');
      }
      throw error;
    }
  }

  async listExecutions(limit = 50) {
    const executions = await this.prisma.aiExecution.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { prompt: true },
    });

    return toPlain(
      executions.map((execution) => ({
        id: execution.id,
        prompt: execution.prompt
          ? { id: execution.prompt.id, name: execution.prompt.name, scope: execution.prompt.scope }
          : null,
        model: execution.model,
        mode: execution.mode,
        provider: execution.provider,
        usage: {
          inputTokens: execution.usageInputTokens,
          outputTokens: execution.usageOutputTokens,
          cost: execution.usageCost,
        },
        latencyMs: execution.latencyMs,
        createdAt: execution.createdAt.toISOString(),
        createdByRole: execution.createdByRole,
      })),
    );
  }

  async listRagCollections() {
    const collections = await this.prisma.ragCollection.findMany({
      orderBy: { name: 'asc' },
    });
    return toPlain(collections);
  }

  async createRagCollection(payload: RagCollectionInput) {
    const data = RagCollectionSchema.parse(payload);
    const collection = await this.prisma.ragCollection.create({
      data: { ...data, slug: data.slug.trim().toLowerCase() },
    });
    return toPlain(collection);
  }

  async complete(body: AiCompletePayload) {
    const { promptId, createdByRole, ...rest } = body;
    const request = rest as Parameters<typeof complete>[0];
    const response = await complete(request);

    await this.prisma.aiExecution.create({
      data: {
        promptId: promptId ?? null,
        model: request.model,
        mode: request.mode,
        provider: response.provider,
        input: request,
        outputJson: response.json,
        outputText: response.text,
        toolCalls: response.toolCalls,
        usageInputTokens: response.usage?.inputTokens ?? 0,
        usageOutputTokens: response.usage?.outputTokens ?? 0,
        usageCost: response.usage?.cost ?? 0,
        latencyMs: response.usage?.latencyMs ?? 0,
        createdByRole: createdByRole ?? null,
      },
    });

    return response;
  }

  private toPromptPersistence(data: Partial<PromptDefinitionInput>): Prisma.AiPromptUncheckedUpdateInput {
    const persistence: Prisma.AiPromptUncheckedUpdateInput = {} as Prisma.AiPromptUncheckedUpdateInput;

    if (data.name !== undefined) persistence.name = data.name;
    if (data.scope !== undefined) persistence.scope = data.scope;
    if (data.entities !== undefined) persistence.entities = data.entities;
    if (data.inputs !== undefined) persistence.inputs = data.inputs;
    if (data.output !== undefined) persistence.output = data.output;
    if (data.llmPreset?.model !== undefined) persistence.llmModel = data.llmPreset.model;
    if (data.llmPreset?.mode !== undefined) persistence.llmMode = data.llmPreset.mode;
    if (data.llmPreset?.temperature !== undefined) persistence.temperature = data.llmPreset.temperature;
    if (data.ragCollections !== undefined) persistence.ragCollections = data.ragCollections;
    if (data.tools !== undefined) persistence.tools = data.tools;
    if (data.policy !== undefined) persistence.policy = data.policy as Prisma.InputJsonValue;
    if (data.version !== undefined) persistence.version = data.version;
    if (data.ownerRole !== undefined) persistence.ownerRole = data.ownerRole;
    if (data.reviewers !== undefined) persistence.reviewers = data.reviewers;
    if (data.status !== undefined) persistence.status = data.status;

    return persistence;
  }

  private mapPrompt(prompt: Prisma.AiPrompt) {
    return toPlain({
      id: prompt.id,
      name: prompt.name,
      scope: prompt.scope,
      entities: prompt.entities ?? [],
      inputs: prompt.inputs ?? {},
      output: prompt.output,
      llmPreset: {
        model: prompt.llmModel,
        mode: prompt.llmMode,
        temperature: prompt.temperature,
      },
      ragCollections: prompt.ragCollections ?? [],
      tools: prompt.tools ?? [],
      policy: prompt.policy ?? undefined,
      version: prompt.version,
      ownerRole: prompt.ownerRole,
      reviewers: prompt.reviewers ?? [],
      status: prompt.status,
      createdAt: prompt.createdAt.toISOString(),
      updatedAt: prompt.updatedAt.toISOString(),
    });
  }
}
