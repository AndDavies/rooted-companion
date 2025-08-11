// Minimal JSON repair utility. Conservative fixes only.
export function repairJson(input: string): string {
  let s = input.trim();
  // Strip code fences/backticks if present
  if (s.startsWith('```')) {
    s = s.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
  }
  s = s.replace(/[\u2018\u2019\u201A\u201B]/g, "'");
  s = s.replace(/[\u201C\u201D\u201E\u201F]/g, '"');
  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1');
  // Balance braces/brackets if clearly short by 1-2
  const opens = (s.match(/\{/g) || []).length;
  const closes = (s.match(/\}/g) || []).length;
  if (opens > closes) s += '}'.repeat(opens - closes);
  const aOpens = (s.match(/\[/g) || []).length;
  const aCloses = (s.match(/\]/g) || []).length;
  if (aOpens > aCloses) s += ']'.repeat(aOpens - aCloses);
  return s;
}


