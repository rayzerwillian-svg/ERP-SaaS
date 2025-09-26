import { randomUUID } from "node:crypto";

const DEFAULT_TRACE_PREFIX = "trace";

type ToolDefinition = { name: string; argsSchema: any };

export type CompleteRequest = {
  model: string;
  mode: "json" | "text";
  system?: string;
  prompt: string;
  context?: {
    vector?: number[];
    embedding?: number[];
    metadata?: Record<string, any>;
  } & Record<string, unknown>;
  tools?: ToolDefinition[];
  rag?: { collections: string[]; topK?: number; filters?: any };
};

export type CompleteResponse = {
  json: Record<string, any>;
  text?: string;
  toolCalls: { name: string; arguments: any }[];
  usage: { inputTokens: number; outputTokens: number; cost: number; latencyMs: number };
  traceId: string;
  provider: string;
};

type ProviderHandler = (req: CompleteRequest, enrichedPrompt: string) => Promise<Omit<CompleteResponse, "traceId" | "provider">>;

type RagSnippet = { collection: string; score: number; payload?: Record<string, any> };

const AI_PROVIDER = (process.env.AI_PROVIDER ?? "mock").toLowerCase();

export async function complete(req: CompleteRequest): Promise<CompleteResponse> {
  const traceId = `${DEFAULT_TRACE_PREFIX}-${randomUUID()}`;
  const start = Date.now();
  const ragSnippets = await resolveRagSnippets(req);
  const enrichedPrompt = buildPromptWithContext(req, ragSnippets);

  const handler = selectProvider();
  const response = await handler(req, enrichedPrompt);

  return {
    ...response,
    traceId,
    provider: AI_PROVIDER,
    usage: {
      ...response.usage,
      latencyMs: Date.now() - start,
    },
  };
}

function selectProvider(): ProviderHandler {
  switch (AI_PROVIDER) {
    case "openai":
      return createOpenAIHandler();
    case "cohere":
      return createCohereHandler();
    case "mock":
      return mockHandler;
    default:
      return () => {
        throw new Error(`AI_PROVIDER ${AI_PROVIDER} is not supported`);
      };
  }
}

async function resolveRagSnippets(req: CompleteRequest): Promise<RagSnippet[]> {
  if (!req.rag?.collections?.length) return [];
  const baseUrl = process.env.VECTOR_DB_URL;
  if (!baseUrl) return [];

  const vector = req.context?.vector ?? req.context?.embedding;
  if (!vector) return [];

  const topK = req.rag.topK ?? 4;
  const snippets: RagSnippet[] = [];

  for (const collection of req.rag.collections) {
    try {
      const endpoint = buildQdrantUrl(baseUrl, collection);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          vector,
          limit: topK,
          with_payload: true,
          filter: req.rag.filters ?? undefined,
        }),
      });

      if (!response.ok) {
        console.warn(`RAG query failed for ${collection}: ${response.statusText}`);
        continue;
      }

      const data = (await response.json()) as {
        result?: { score: number; payload?: Record<string, any> }[];
      };
      for (const result of data.result ?? []) {
        snippets.push({ collection, score: result.score, payload: result.payload });
      }
    } catch (error) {
      console.warn(`RAG query exception for ${collection}:`, error);
    }
  }

  return snippets;
}

function buildPromptWithContext(req: CompleteRequest, ragSnippets: RagSnippet[]) {
  if (!ragSnippets.length) return req.prompt;

  const serialized = ragSnippets
    .sort((a, b) => b.score - a.score)
    .map((snippet) => `Collection: ${snippet.collection}\nScore: ${snippet.score.toFixed(3)}\nPayload: ${JSON.stringify(snippet.payload ?? {})}`)
    .join("\n\n");

  return `${req.prompt}\n\nContexto:\n${serialized}`;
}

const mockHandler: ProviderHandler = async (req, enrichedPrompt) => ({
  json: req.mode === "json" ? { status: "ok", echo: enrichedPrompt } : {},
  text: req.mode === "text" ? enrichedPrompt : undefined,
  toolCalls: req.tools?.map((tool) => ({ name: tool.name, arguments: {} })) ?? [],
  usage: { inputTokens: enrichedPrompt.length, outputTokens: 0, cost: 0, latencyMs: 0 },
});

function createOpenAIHandler(): ProviderHandler {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY not configured, falling back to mock handler");
    return mockHandler;
  }

  return async (req, enrichedPrompt) => {
    const body: Record<string, any> = {
      model: req.model,
      messages: buildMessages(req, enrichedPrompt),
      temperature: req.mode === "json" ? 0 : 0.7,
    };

    if (req.mode === "json") {
      body.response_format = { type: "json_object" };
    }

    if (req.tools?.length) {
      body.tools = req.tools.map((tool) => ({
        type: "function",
        function: { name: tool.name, parameters: tool.argsSchema },
      }));
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as any;
    const choice = data.choices?.[0]?.message;
    const text = choice?.content?.[0]?.text ?? choice?.content ?? "";
    const json = req.mode === "json" && text ? safeJson(text) : {};
    const toolCalls =
      choice?.tool_calls?.map((call: any) => ({
        name: call.function?.name ?? "",
        arguments: safeJson(call.function?.arguments ?? "{}"),
      })) ?? [];

    return {
      json,
      text: req.mode === "text" ? text : undefined,
      toolCalls,
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        cost: estimateOpenAICost(req.model, data.usage?.prompt_tokens ?? 0, data.usage?.completion_tokens ?? 0),
        latencyMs: 0,
      },
    };
  };
}

function createCohereHandler(): ProviderHandler {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    console.warn("COHERE_API_KEY not configured, falling back to mock handler");
    return mockHandler;
  }

  return async (req, enrichedPrompt) => {
    const response = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "x-client-name": "erp-saas",
      },
      body: JSON.stringify({
        model: req.model,
        message: enrichedPrompt,
        chat_history: req.system ? [{ role: "SYSTEM", message: req.system }] : undefined,
        response_format: req.mode === "json" ? { type: "json_object" } : undefined,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cohere request failed: ${response.status} ${errorText}`);
    }

    const data = (await response.json()) as any;
    const text = data.text ?? data.generations?.[0]?.text ?? "";
    return {
      json: req.mode === "json" && text ? safeJson(text) : {},
      text: req.mode === "text" ? text : undefined,
      toolCalls: [],
      usage: {
        inputTokens: data.meta?.tokens?.input_tokens ?? 0,
        outputTokens: data.meta?.tokens?.output_tokens ?? 0,
        cost: 0,
        latencyMs: 0,
      },
    };
  };
}

function buildMessages(req: CompleteRequest, enrichedPrompt: string) {
  const messages: any[] = [];
  if (req.system) {
    messages.push({ role: "system", content: req.system });
  }

  if (req.context?.metadata) {
    messages.push({
      role: "system",
      content: `Contexto adicional: ${JSON.stringify(req.context.metadata)}`,
    });
  }

  messages.push({ role: "user", content: enrichedPrompt });
  return messages;
}

function safeJson(payload: string) {
  try {
    return JSON.parse(payload);
  } catch (error) {
    console.warn("Falha ao parsear JSON do provedor de IA", error);
    return {};
  }
}

function estimateOpenAICost(model: string, promptTokens: number, completionTokens: number) {
  // Reference pricing for gpt-4o-mini like models (USD per 1M tokens)
  const pricing: Record<string, { in: number; out: number }> = {
    "gpt-4o-mini": { in: 0.15, out: 0.6 },
    "gpt-4o-mini-1": { in: 0.15, out: 0.6 },
    "gpt-4o-mini-1.5": { in: 0.15, out: 0.6 },
    "gpt-3.5-turbo": { in: 0.5, out: 1.5 },
  };

  const price = pricing[model];
  if (!price) return 0;

  const promptCost = (promptTokens / 1_000_000) * price.in;
  const completionCost = (completionTokens / 1_000_000) * price.out;
  return Number((promptCost + completionCost).toFixed(6));
}

function buildQdrantUrl(baseUrl: string, collection: string) {
  if (baseUrl.startsWith("http")) {
    return `${baseUrl.replace(/\/$/, "")}/collections/${collection}/points/search`;
  }

  if (baseUrl.startsWith("qdrant://")) {
    const url = new URL(baseUrl.replace("qdrant://", "http://"));
    return `${url.toString().replace(/\/$/, "")}/collections/${collection}/points/search`;
  }

  throw new Error(`VECTOR_DB_URL scheme not supported: ${baseUrl}`);
}
