import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export const zodDayTask = z
  .object({
    type: z.enum(["movement", "breathwork", "nutrition", "mindset", "sleep"]),
    title: z.string().min(3).max(60),
    rationale: z.string().min(8).max(140),
    // Nullable-but-present fields for strict mode
    time_suggestion: z.enum(["morning", "midday", "afternoon", "evening", "flexible"]).nullable().default(null),
    recipe_id: z.string().nullable().default(null),
    slot_hint: z.enum(["wake","mid_morning","midday","afternoon","evening","pre_sleep"]).nullable().default(null),
    // Accept any ISO date-time; we'll coerce to UTC Z in normalization.
    scheduled_at: z.string().datetime().describe("UTC ISO 8601, MUST end with Z"),
    duration_minutes: z.number().int().min(5).max(40),
    evidence_ids: z.array(z.string()).min(0).max(2).default([]),
  })
  .strict();

export const zodDayPlan = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    tasks: z.array(zodDayTask).min(3).max(4),
    reflection_prompt: z.string().nullable(),
  })
  .strict();

export const zodPlanPayload = z
  .object({
    title: z.string().min(1).max(160),
    description: z.string().nullable(),
    days: z.array(zodDayPlan).min(3).max(7),
  })
  .strict();

export type ZodPlanPayload = z.infer<typeof zodPlanPayload>;

// Build inline JSON Schema (no $ref)
const json: unknown = zodToJsonSchema(zodPlanPayload, {
  target: "jsonSchema7",
  $refStrategy: "none",
});

// Ensure root is an object schema with additionalProperties: false
type JsonSchema = { type?: string; properties?: Record<string, unknown>; required?: string[]; additionalProperties?: boolean };
const schema = (json ?? {}) as JsonSchema;
const parameters =
  schema && schema.type === "object"
    ? { ...schema, additionalProperties: false }
    : {
        type: "object",
        additionalProperties: false,
        ...(schema.properties ? { properties: schema.properties } : {}),
        ...(schema.required ? { required: schema.required } : {}),
      };

// Ensure every object node lists all keys in required (strict mode requirement)
type JsonObject = Record<string, unknown>;
type SchemaNode = { type?: string; properties?: JsonObject; items?: unknown; required?: string[]; additionalProperties?: boolean };
function enforceRequiredEverywhere(node: unknown): void {
  const n = node as SchemaNode | undefined;
  if (!n || typeof n !== 'object') return;
  if (n.type === 'object' && n.properties && typeof n.properties === 'object') {
    n.required = Object.keys(n.properties);
    n.additionalProperties = false;
    for (const key of Object.keys(n.properties)) {
      enforceRequiredEverywhere((n.properties as JsonObject)[key]);
    }
  }
  if (n.type === 'array' && (n as { items?: unknown }).items) {
    enforceRequiredEverywhere((n as { items?: unknown }).items);
  }
}

enforceRequiredEverywhere(parameters as unknown);

// Final tool definition for Responses API
export const openAIToolDefinition = {
  type: "function" as const,
  name: "create_recovery_plan",
  description:
    "Create a 3–7 day plan. Each day contains 3–4 tasks. Each task MUST include scheduled_at (UTC Z), duration_minutes, and evidence_ids (array, can be empty).",
  strict: true,
  parameters,
} as const;


