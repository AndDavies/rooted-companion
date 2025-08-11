/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai";

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export function defaultMaxOutputTokensForLength(lengthDays?: number): number {
    if (lengthDays === 7) return 10000;  // was 3400
    if (lengthDays === 5) return 3000;  // was 2600
    return 2000;                        // was 1800
  }

type CreateArgs = {
  model?: string;
  instructions?: string;
  input?: Array<string | { role: string; content: string }>;
  tools?: Array<
    | { type: "function"; name: string; description?: string; strict?: boolean; parameters: Record<string, unknown> }
    | { type: "custom"; name: string; description?: string; format?: Record<string, unknown> }
  >;
  tool_choice?: { type: "function" | "allowed_tools" | "auto" | "required"; name?: string; mode?: "auto" | "required"; tools?: Array<{ type: string; name?: string }> };
  parallel_tool_calls?: boolean;
  //temperature?: number;
  max_output_tokens?: number;
};

export async function createResponseWithDefaults(args: CreateArgs) {
  const body = {
    model: args.model ?? "gpt-5-mini",
    // The SDK typing may not yet include these vendor options; keep them to satisfy API contract
    reasoning: { effort: "minimal" },
    text: { verbosity: "low" },
    max_output_tokens: args.max_output_tokens ?? 1400,
    ...args,
  } as unknown as Parameters<typeof openai.responses.create>[0];
  return openai.responses.create(body);
}

// Minimal shape we rely on from Responses API
export type ResponseLike = {
  id?: string;
  output?: Array<
    | { type: "output_text"; text: string }
    | { type: "function_call"; name: string; arguments: string; call_id?: string }
  >;
};

export function getOutputText(resp: ResponseLike): string {
  const chunks = resp.output ?? [];
  return chunks
    .filter((c) => c.type === "output_text")
    .map((c) => (c as { type: "output_text"; text: string }).text)
    .join("");
}

export type ToolCall = { name: string; arguments: string; call_id?: string };

export function getToolCalls(resp: ResponseLike): ToolCall[] {
  const chunks = resp.output ?? [];
  const calls: ToolCall[] = [];
  for (const c of chunks) {
    if (c.type === "function_call") {
      const tc = c as { type: "function_call"; name: string; arguments: string; call_id?: string };
      calls.push({ name: tc.name, arguments: tc.arguments, call_id: tc.call_id });
    }
  }
  return calls;
}

export function getCompletionMeta(resp: { finish_reason?: string; incomplete_details?: { reason?: string } } | unknown): { finish_reason?: string; incomplete_reason?: string } {
  const r = resp as { finish_reason?: string; incomplete_details?: { reason?: string } } | undefined;
  const finish = r?.finish_reason ?? undefined;
  const incomplete = r?.incomplete_details?.reason ?? undefined;
  return { finish_reason: finish, incomplete_reason: incomplete };
}


