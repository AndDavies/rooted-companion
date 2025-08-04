import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { supabaseAdmin } from "@/utils/supabase/admin";

// Types
export type SuggestionPayload = {
  action: string;
  category: 'movement' | 'breathwork' | 'mindset' | 'sleep' | 'nutrition';
  rationale: string;
  recoveryScore: number;
  wearableUsed: boolean;
};

type BiometricData = {
  hrv_rmssd?: number;
  heart_rate_resting?: number;
  sleep_total?: number;
  stress_avg?: number;
  dataPoints: number;
  timeRange: string;
};

// Helper function to calculate recovery score based on biometric data
function calculateRecoveryScore(data: BiometricData): number {
  if (data.dataPoints === 0) return 50; // Default score when no data

  let score = 50; // Start with baseline
  
  // HRV contribution (30% weight) - higher is better
  if (data.hrv_rmssd !== undefined) {
    // Typical ranges: Poor: <20, Good: 20-50, Excellent: >50
    if (data.hrv_rmssd > 50) score += 15;
    else if (data.hrv_rmssd > 30) score += 8;
    else if (data.hrv_rmssd > 20) score += 3;
    else score -= 10;
  }

  // Resting Heart Rate contribution (25% weight) - lower is generally better
  if (data.heart_rate_resting !== undefined) {
    // Typical ranges: Excellent: <60, Good: 60-70, Average: 70-80, Poor: >80
    if (data.heart_rate_resting < 60) score += 12;
    else if (data.heart_rate_resting < 70) score += 6;
    else if (data.heart_rate_resting < 80) score += 2;
    else score -= 8;
  }

  // Sleep contribution (30% weight) - more is generally better (6-9 hours optimal)
  if (data.sleep_total !== undefined) {
    const sleepHours = data.sleep_total / 3600; // Convert seconds to hours
    if (sleepHours >= 7 && sleepHours <= 9) score += 15;
    else if (sleepHours >= 6 && sleepHours <= 10) score += 8;
    else if (sleepHours >= 5 && sleepHours <= 11) score += 3;
    else score -= 10;
  }

  // Stress contribution (15% weight) - lower is better
  if (data.stress_avg !== undefined) {
    // Assuming stress scale 0-100, lower is better
    if (data.stress_avg < 20) score += 8;
    else if (data.stress_avg < 40) score += 4;
    else if (data.stress_avg < 60) score += 1;
    else score -= 5;
  }

  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Helper function to load recent biometric data
async function loadRecentBiometricData(userId: string): Promise<BiometricData> {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Query wearable data through the connection relationship
    const { data: wearableData, error } = await supabaseAdmin
      .from('wearable_data')
      .select(`
        metric_type,
        value,
        timestamp,
        wearable_connections!inner(user_id)
      `)
      .eq('wearable_connections.user_id', userId)
      .in('metric_type', ['hrv_rmssd', 'heart_rate_resting', 'sleep_total', 'stress_avg'])
      .gte('timestamp', fortyEightHoursAgo.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error loading biometric data:', error);
      return { dataPoints: 0, timeRange: '48h' };
    }

    if (!wearableData || wearableData.length === 0) {
      return { dataPoints: 0, timeRange: '48h' };
    }

    // Group data by metric type and get the most recent values
    const metricData: Record<string, number[]> = {};

    wearableData.forEach((row) => {
      if (!metricData[row.metric_type]) {
        metricData[row.metric_type] = [];
      }
      metricData[row.metric_type].push(Number(row.value));
    });

    // Calculate averages for each metric
    const result: BiometricData = {
      dataPoints: wearableData.length,
      timeRange: '48h'
    };

    // Calculate averages for each metric using all available 48h data

    Object.entries(metricData).forEach(([metricType, values]) => {
      if (values.length > 0) {
        // For sleep, use the latest value rather than average
        if (metricType === 'sleep_total') {
          result.sleep_total = values[0];
        } else if (metricType === 'hrv_rmssd') {
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          result.hrv_rmssd = avg;
        } else if (metricType === 'heart_rate_resting') {
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          result.heart_rate_resting = avg;
        } else if (metricType === 'stress_avg') {
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          result.stress_avg = avg;
        }
      }
    });

    return result;
  } catch (error) {
    console.error('Error in loadRecentBiometricData:', error);
    return { dataPoints: 0, timeRange: '48h' };
  }
}

// Fallback suggestion when no biometric data is available
function suggestBreathwork(): SuggestionPayload {
  return {
    action: "Take 5 minutes for 4-7-8 breathing: Inhale for 4 counts, hold for 7, exhale for 8. Repeat 4 cycles.",
    category: "breathwork",
    rationale: "Without biometric data to guide us today, let's focus on proven stress-reduction techniques. The 4-7-8 breathing pattern activates your parasympathetic nervous system, helping to naturally calm your mind and body.",
    recoveryScore: 50,
    wearableUsed: false
  };
}

// Helper function to get HRV trend (optional enhancement)
async function getHRVTrend(userId: string, days: number = 7): Promise<string> {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const { data, error } = await supabaseAdmin
      .from('wearable_data')
      .select(`
        value,
        timestamp,
        wearable_connections!inner(user_id)
      `)
      .eq('wearable_connections.user_id', userId)
      .eq('metric_type', 'hrv_rmssd')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true })
      .limit(days);

    if (error || !data || data.length < 2) {
      return 'stable';
    }

    const values = data.map(d => Number(d.value));
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (changePercent > 10) return 'improving';
    if (changePercent < -10) return 'declining';
    return 'stable';
  } catch (error) {
    console.error('Error getting HRV trend:', error);
    return 'stable';
  }
}

// Main function to generate daily suggestion
export async function generateDailySuggestion(userId: string): Promise<SuggestionPayload> {
  try {
    // Step 1: Load recent biometric data
    const biometricData = await loadRecentBiometricData(userId);
    
    // Step 2: If no biometric data, return fallback
    if (biometricData.dataPoints === 0) {
      console.log(`No biometric data found for user ${userId}, using fallback suggestion`);
      return suggestBreathwork();
    }

    // Step 3: Calculate recovery score
    const recoveryScore = calculateRecoveryScore(biometricData);

    // Step 4: Get HRV trend for additional context
    const hrvTrend = await getHRVTrend(userId);

    // Step 5: Set up LangChain with OpenAI
    const model = new ChatOpenAI({
      modelName: "gpt-4.1-mini",
      temperature: 0.7,
      maxTokens: 500,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Step 6: Construct system prompt
    const systemPrompt = `You are ROOTED, a soft-spoken, evidence-based wellness coach. Your job is to give one helpful action per day to reduce stress, improve recovery, and promote emotional resilience. 

Base your suggestions on biometric patterns and always be supportive, never overwhelming. Just one thing, clearly explained.

Guidelines:
- Keep suggestions simple and actionable (5-20 minutes)
- Focus on evidence-based practices
- Be encouraging and non-judgmental
- Tailor advice to the person's current recovery state
- Use warm, human language
- Never suggest anything dangerous or medical

You must respond with a valid JSON object with this exact structure:
{
  "action": "specific actionable suggestion",
  "category": "movement|breathwork|mindset|sleep|nutrition",
  "rationale": "explanation based on their data"
}`;

    // Step 7: Create user message with biometric context
    const biometricSummary = [];
    if (biometricData.hrv_rmssd !== undefined) {
      biometricSummary.push(`HRV: ${biometricData.hrv_rmssd.toFixed(1)}ms (trend: ${hrvTrend})`);
    }
    if (biometricData.heart_rate_resting !== undefined) {
      biometricSummary.push(`Resting HR: ${biometricData.heart_rate_resting.toFixed(0)} bpm`);
    }
    if (biometricData.sleep_total !== undefined) {
      const sleepHours = (biometricData.sleep_total / 3600).toFixed(1);
      biometricSummary.push(`Sleep: ${sleepHours} hours`);
    }
    if (biometricData.stress_avg !== undefined) {
      biometricSummary.push(`Stress level: ${biometricData.stress_avg.toFixed(0)}/100`);
    }

    const userMessage = `Current recovery score: ${recoveryScore}/100

Recent biometric data (${biometricData.timeRange}):
${biometricSummary.join('\n')}

Please provide one personalized wellness suggestion for today. Focus on what would be most beneficial given these metrics.`;

    // Step 8: Generate suggestion using LangChain
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage)
    ];

    const response = await model.invoke(messages);
    const responseText = response.content as string;

    // Step 9: Parse JSON response
    let suggestionData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing LLM response:', parseError);
      console.error('Raw response:', responseText);
      
      // Fallback suggestion if parsing fails
      return {
        action: "Take a 10-minute mindful walk outdoors, focusing on your breath and surroundings",
        category: "movement",
        rationale: `Your recovery score is ${recoveryScore}/100. Gentle movement and fresh air can help reset your nervous system.`,
        recoveryScore,
        wearableUsed: true
      };
    }

    // Step 10: Validate and construct final payload
    const suggestion: SuggestionPayload = {
      action: suggestionData.action || "Take 5 deep breaths and stretch gently",
      category: suggestionData.category || "breathwork",
      rationale: suggestionData.rationale || `Based on your recovery score of ${recoveryScore}/100, this will help support your wellness today.`,
      recoveryScore,
      wearableUsed: true
    };

    // Step 11: Insert into suggestion_logs table
    const { error: insertError } = await supabaseAdmin
      .from('suggestion_logs')
      .insert({
        user_id: userId,
        recovery_score: recoveryScore,
        wearable_data: biometricData,
        suggestion: {
          action: suggestion.action,
          category: suggestion.category,
          rationale: suggestion.rationale
        },
        completed: false
      });

    if (insertError) {
      console.error('Error inserting suggestion log:', insertError);
      // Continue anyway - don't fail the whole function for logging issues
    }

    return suggestion;

  } catch (error) {
    console.error('Error in generateDailySuggestion:', error);
    
    // Return fallback suggestion on any error
    const fallback = suggestBreathwork();
    
    // Try to log the fallback suggestion
    try {
      await supabaseAdmin
        .from('suggestion_logs')
        .insert({
          user_id: userId,
          recovery_score: fallback.recoveryScore,
          suggestion: {
            action: fallback.action,
            category: fallback.category,
            rationale: fallback.rationale
          },
          completed: false
        });
    } catch (logError) {
      console.error('Error logging fallback suggestion:', logError);
    }
    
    return fallback;
  }
}

// Additional helper functions for future use

export async function getLatestBiometrics(userId: string, metricType: string): Promise<number | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('wearable_data')
      .select(`
        value,
        wearable_connections!inner(user_id)
      `)
      .eq('wearable_connections.user_id', userId)
      .eq('metric_type', metricType)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return Number(data.value);
  } catch (error) {
    console.error(`Error getting latest ${metricType}:`, error);
    return null;
  }
}

export async function markSuggestionCompleted(suggestionId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('suggestion_logs')
      .update({ completed: true })
      .eq('id', suggestionId);

    if (error) {
      console.error('Error marking suggestion as completed:', error);
    }
  } catch (error) {
    console.error('Error in markSuggestionCompleted:', error);
  }
}