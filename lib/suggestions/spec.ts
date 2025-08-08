export type Trend = 'up' | 'down' | 'stable' | 'unknown';
export type Focus = 'movement' | 'breathwork' | 'mindset' | 'nutrition';
export type Progression = 'base' | 'build' | 'stretch';

export type SuggestionSpec = {
  theme: Focus;
  trend: Trend;
  durationMin: number; // 5–20
  intensity: 'downregulate' | 'neutral' | 'light';
  constraints: string[]; // e.g., ["no equipment","indoors ok"]
};

export function buildSpec(
  focus: Focus | null,
  trend: Trend,
  progression: Progression = 'base'
): SuggestionSpec {
  const theme: Focus = focus ?? 'breathwork';
  const baseDur = 10;
  const bump = progression === 'stretch' ? 5 : progression === 'build' ? 3 : 0;
  const durationMin = Math.min(20, Math.max(5, baseDur + bump));

  let intensity: SuggestionSpec['intensity'] = 'neutral';
  if (trend === 'down') intensity = 'downregulate';
  else if (trend === 'up' && theme === 'movement' && progression !== 'base') intensity = 'light';
  else if (trend === 'up') intensity = theme === 'movement' ? 'light' : 'neutral';

  const constraints = ['no equipment', 'indoors ok'];

  return { theme, trend, durationMin, intensity, constraints };
}

export function decideDataUsed(
  hasWearable: boolean,
  hasOnboarding: boolean
): 'wearable' | 'onboarding' | 'both' | 'none' {
  if (hasWearable && hasOnboarding) return 'both';
  if (hasWearable) return 'wearable';
  if (hasOnboarding) return 'onboarding';
  return 'none';
}


