export type Emoji = 'sad' | 'neutral' | 'smile' | 'grin';
export type Progression = 'base' | 'build' | 'stretch';

export interface HistoryPoint {
  completed: boolean;
  mood?: Emoji | null;
}

const EMOJI_SCORE: Record<Emoji, number> = {
  sad: -1,
  neutral: 0,
  smile: 1,
  grin: 2,
};

export interface ProgressionParams {
  windowSize?: number; // default 10
  stretchAdherence?: number; // default 0.8
  stretchMood?: number; // default +0.5
  buildAdherence?: number; // default 0.6
  buildMood?: number; // default 0.0
}

export function computeProgression(
  history: HistoryPoint[],
  params: ProgressionParams = {}
): { progression: Progression; adherence: number; moodAvg: number } {
  const {
    windowSize = 10,
    stretchAdherence = 0.8,
    stretchMood = 0.5,
    buildAdherence = 0.6,
    buildMood = 0.0,
  } = params;

  const sample = history.slice(0, windowSize);
  if (sample.length === 0) {
    return { progression: 'base', adherence: 0, moodAvg: 0 };
    }

  const completedCount = sample.filter((h) => h.completed).length;
  const adherence = completedCount / sample.length;

  const moodVals = sample
    .map((h) => (h.mood !== undefined && h.mood !== null ? EMOJI_SCORE[h.mood] : null))
    .filter((v): v is number => v !== null);
  const moodAvg = moodVals.length ? moodVals.reduce((a, b) => a + b, 0) / moodVals.length : 0;

  let progression: Progression = 'base';
  if (adherence >= stretchAdherence && moodAvg >= stretchMood) progression = 'stretch';
  else if (adherence >= buildAdherence && moodAvg >= buildMood) progression = 'build';

  return { progression, adherence, moodAvg };
}


