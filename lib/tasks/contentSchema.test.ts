import { parseTaskContent, TaskContentSchema } from './contentSchema'

// Minimal ad-hoc test runner to avoid jest typings
function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message)
}

// Valid object passes
{
  const input = {
    description: 'A short practice',
    how_to: ['Step 1', 'Step 2'],
    cues: ['Relax shoulders'],
    modifications: ['Do seated'],
    common_mistakes: ['Holding breath'],
    media: [{ type: 'video', url: 'https://example.com/v1.mp4', caption: 'Demo' }],
    alternatives: [{ slug: 'box-breathing', note: 'Shorter option' }],
    contraindications: ['Dizziness'],
    equipment: ['Mat'],
    location: 'home',
    intensity_step: 1,
    effort_rpe: 3,
  }
  const parsed = parseTaskContent(input)
  const result = TaskContentSchema.safeParse(parsed)
  assert(result.success, 'Expected valid content to pass schema after parsing')
}

// Malformed object returns sanitized structure
{
  const input = {
    description: 123,
    how_to: [1, 2, 3],
    media: [{ type: 'video', url: 'invalid-url' }, { type: 'audio', url: 'https://ok.com/a.mp3' }],
    alternatives: [{ slug: 42 }, { slug: 'valid-alt', note: 7 }],
    intensity_step: '5',
    effort_rpe: 'bad',
  } as unknown
  const parsed = parseTaskContent(input)
  const res = TaskContentSchema.safeParse(parsed)
  if (!res.success) throw new Error('Sanitized malformed content should conform to schema')
  const out = res.data!
  if (!((out.media?.length ?? 0) === 1)) throw new Error('Invalid media items should be dropped')
  if (!(out.alternatives?.[0]?.slug === 'valid-alt')) throw new Error('Alternative slug should be coerced to string and filtered')
  if (!(out.intensity_step === 5)) throw new Error('intensity_step should coerce numeric strings')
  if (!(!('description' in out) || typeof out.description === 'string')) throw new Error('description should be string or omitted')
}


