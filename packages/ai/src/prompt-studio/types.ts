export type PromptDefinition = {
  id: string;
  name: string;
  scope: "global" | "modulo" | "role";
  entities: string[];
  inputs: Record<string, string>;
  output: "text" | "json";
  llmPreset: { model: string; mode: "json" | "text"; temperature: number };
  ragCollections?: string[];
  tools?: string[];
  policy?: Record<string, any>;
  version: string;
  ownerRole: string;
  reviewers: string[];
  status: "draft" | "approved" | "published";
};
