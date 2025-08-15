import { z } from 'zod'

// Media and alternative items
const mediaItem = z.object({
  type: z.enum(['video', 'audio']),
  url: z.string().url(),
  caption: z.string().optional(),
  start_time: z.string().optional(),
  transcript_url: z.string().url().optional(),
})

const alternativeItem = z.object({
  slug: z.string(),
  note: z.string().optional()
})

// Canonical task content schema
export const TaskContentSchema = z.object({
  description: z.string().optional(),
  how_to: z.array(z.string()).optional(),
  cues: z.array(z.string()).optional(),
  modifications: z.array(z.string()).optional(),
  common_mistakes: z.array(z.string()).optional(),
  media: z.array(mediaItem).optional(),
  alternatives: z.array(alternativeItem).optional(),
  contraindications: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  location: z.enum(['home', 'gym', 'outdoor']).or(z.string()).optional(),
  intensity_step: z.number().int().min(1).max(5).nullable().optional(),
  effort_rpe: z.number().int().min(1).max(10).nullable().optional(),
}).partial(); // All fields are optional for flexibility

export type TaskContent = z.infer<typeof TaskContentSchema>;

export function parseTaskContent(input: unknown): TaskContent | null {
  const result = TaskContentSchema.safeParse(input);
  if (result.success) {
    return result.data;
  } else {
    console.warn('Invalid task content payload, sanitizing:', result.error.flatten());
    // Return a sanitized, empty object or a subset of valid data
    // For now, return an empty object to prevent UI crashes
    return {};
  }
}


