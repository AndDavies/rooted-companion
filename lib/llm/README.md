# ROOTED LLM Suggestion Agent

This module contains the LangChain-powered AI suggestion agent that generates personalized wellness recommendations based on biometric data.

## Overview

The `suggestionAgent.ts` file implements the core function `generateDailySuggestion()` which:

1. **Loads recent biometric data** (24-48h) from the `wearable_data` table
2. **Calculates a recovery score** (0-100) based on HRV, RHR, sleep, and stress metrics
3. **Uses LangChain + OpenAI GPT-4o-mini** to generate personalized suggestions
4. **Logs suggestions** to the `suggestion_logs` table
5. **Handles fallbacks** gracefully when no data is available

## Function Signature

```typescript
export async function generateDailySuggestion(userId: string): Promise<SuggestionPayload>
```

### Input
- `userId`: The user's UUID from auth.users table

### Output
```typescript
type SuggestionPayload = {
  action: string;                    // The specific action to take
  category: 'movement' | 'breathwork' | 'mindset' | 'sleep' | 'nutrition';
  rationale: string;                 // Why this suggestion is beneficial
  recoveryScore: number;             // Calculated recovery score (0-100)
  wearableUsed: boolean;            // Whether biometric data was used
};
```

## Usage Example

```typescript
import { generateDailySuggestion } from '@/lib/llm/suggestionAgent';

// Generate a suggestion for a user
const suggestion = await generateDailySuggestion('user-uuid-here');

console.log(suggestion);
// {
//   action: "Take a 10-minute forest walk",
//   category: "movement",
//   rationale: "Your HRV has dipped below baseline and your sleep is disrupted. Gentle movement outdoors will rebalance your nervous system.",
//   recoveryScore: 65,
//   wearableUsed: true
// }
```

## Recovery Score Calculation

The recovery score is calculated based on:

- **HRV (30% weight)**: Higher values indicate better recovery
  - Excellent: >50ms (+15 points)
  - Good: 30-50ms (+8 points)  
  - Fair: 20-30ms (+3 points)
  - Poor: <20ms (-10 points)

- **Resting Heart Rate (25% weight)**: Lower values are generally better
  - Excellent: <60 bpm (+12 points)
  - Good: 60-70 bpm (+6 points)
  - Average: 70-80 bpm (+2 points)
  - Poor: >80 bpm (-8 points)

- **Sleep Duration (30% weight)**: 7-9 hours is optimal
  - Optimal: 7-9 hours (+15 points)
  - Good: 6-10 hours (+8 points)
  - Fair: 5-11 hours (+3 points)
  - Poor: <5 or >11 hours (-10 points)

- **Stress Level (15% weight)**: Lower stress is better
  - Low: 0-20 (+8 points)
  - Moderate: 20-40 (+4 points)
  - High: 40-60 (+1 point)
  - Very High: >60 (-5 points)

## Environment Variables Required

Make sure these are set in your `.env.local`:

```bash
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Fallback Behavior

When no biometric data is available, the system returns a default breathwork suggestion:

```typescript
{
  action: "Take 5 minutes for 4-7-8 breathing: Inhale for 4 counts, hold for 7, exhale for 8. Repeat 4 cycles.",
  category: "breathwork",
  rationale: "Without biometric data to guide us today, let's focus on proven stress-reduction techniques...",
  recoveryScore: 50,
  wearableUsed: false
}
```

## Helper Functions

- `getLatestBiometrics(userId, metricType)`: Get the most recent value for a specific metric
- `markSuggestionCompleted(suggestionId)`: Mark a suggestion as completed
- `getHRVTrend(userId, days)`: Analyze HRV trend over time

## Database Integration

The agent automatically:
- Queries `wearable_data` joined with `wearable_connections` to get user's biometric data
- Inserts generated suggestions into `suggestion_logs` table
- Handles all database errors gracefully with fallbacks

## AI Coaching Persona

ROOTED is designed to be:
- **Soft-spoken and supportive**: Never overwhelming or pushy
- **Evidence-based**: Grounded in wellness research
- **Actionable**: Provides specific, time-bound suggestions (5-20 minutes)
- **Personalized**: Tailored to individual biometric patterns
- **Safe**: Never provides medical advice or dangerous suggestions