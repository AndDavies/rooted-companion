import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { mapTasksToTimes } from '@/lib/circadian/scheduler'

// Types
export type PlanPayload = {
  title: string;
  description?: string;
  days: DayPlan[];
};

export type DayPlan = {
  date: string; // YYYY-MM-DD format
  tasks: DayTask[];
  reflection_prompt?: string;
};

export type DayTask = {
  type: 'movement' | 'breathwork' | 'nutrition' | 'mindset' | 'sleep';
  title: string;              // concise suggestion
  rationale: string;          // short explanation of benefit
  time_suggestion?: 'morning' | 'afternoon' | 'evening' | 'flexible';
  recipe_id?: string;         // only for nutrition tasks
};

type BiometricData = {
  hrv_rmssd?: number;
  heart_rate_resting?: number;
  stress_avg?: number;
  sleep_total?: number;
  dataPoints: number;
};

type WearableDataRow = {
  metric_type: string;
  value: number;
  timestamp: string;
  wearable_connections: {
    user_id: string;
  };
};

type OnboardingData = {
  sleep_quality?: string;
  energy_level?: string;
  stress_level?: string;
  preferred_focus?: string;
  availability?: string;
};

// Load recent biometric data for a user
async function loadRecentBiometricData(userId: string, hours: number = 48): Promise<BiometricData> {
  try {
    const { data, error } = await supabaseAdmin
      .from('wearable_data')
      .select(`
        metric_type,
        value,
        timestamp,
        wearable_connections!inner(user_id)
      `)
      .eq('wearable_connections.user_id', userId)
      .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error loading biometric data:', error);
      return { dataPoints: 0 };
    }

    const biometrics: BiometricData = { dataPoints: data?.length || 0 };

    // Group by metric type and get latest values
    const latestMetrics = data?.reduce((acc, row) => {
      if (!acc[row.metric_type] || new Date(row.timestamp) > new Date(acc[row.metric_type].timestamp)) {
        acc[row.metric_type] = row;
      }
      return acc;
    }, {} as Record<string, WearableDataRow>);

    // Extract relevant metrics
    if (latestMetrics?.['hrv_rmssd']) {
      biometrics.hrv_rmssd = latestMetrics['hrv_rmssd'].value;
    }
    if (latestMetrics?.['heart_rate_resting']) {
      biometrics.heart_rate_resting = latestMetrics['heart_rate_resting'].value;
    }
    if (latestMetrics?.['stress_avg']) {
      biometrics.stress_avg = latestMetrics['stress_avg'].value;
    }
    if (latestMetrics?.['sleep_total']) {
      biometrics.sleep_total = latestMetrics['sleep_total'].value;
    }

    return biometrics;
  } catch (error) {
    console.error('Error in loadRecentBiometricData:', error);
    return { dataPoints: 0 };
  }
}

// Load user onboarding data
async function loadOnboardingData(userId: string): Promise<OnboardingData | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_onboarding')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.log(`No onboarding data found for user ${userId}`);
      return null;
    }

    return {
      sleep_quality: data.sleep_quality || undefined,
      energy_level: data.energy_level || undefined,
      stress_level: data.stress_level || undefined,
      preferred_focus: data.preferred_focus || undefined,
      availability: data.availability || undefined,
    };
  } catch (error) {
    console.error('Error loading onboarding data:', error);
    return null;
  }
}

// Build personalized guidance based on onboarding data
function buildPersonalizedGuidance(onboardingData: OnboardingData | null): string {
  if (!onboardingData) {
    return "Since no personal preferences are available, create a balanced plan using general wellness principles.";
  }

  const guidance: string[] = [];
  
  // Sleep quality personalization
  if (onboardingData.sleep_quality) {
    switch (onboardingData.sleep_quality) {
      case 'poor':
      case 'very_poor':
        guidance.push("This user struggles with sleep quality. Prioritize sleep hygiene, evening routines, and calming practices that prepare the nervous system for rest.");
        break;
      case 'excellent':
      case 'good':
        guidance.push("This user has good sleep quality. You can include more varied activities without heavily focusing on sleep preparation.");
        break;
      case 'fair':
        guidance.push("This user has moderate sleep quality. Include some sleep-supporting practices while maintaining variety.");
        break;
    }
  }

  // Energy level personalization
  if (onboardingData.energy_level) {
    switch (onboardingData.energy_level) {
      case 'very_low':
      case 'low':
        guidance.push("This user has low energy levels. Focus on gentle, restorative practices rather than energizing activities. Emphasize nervous system recovery and gradual energy building.");
        break;
      case 'high':
        guidance.push("This user has high energy. You can include more active recovery practices and movement-based activities.");
        break;
      case 'fluctuates':
        guidance.push("This user's energy fluctuates. Provide adaptable practices that can be modified based on daily energy levels.");
        break;
    }
  }

  // Stress level personalization
  if (onboardingData.stress_level) {
    switch (onboardingData.stress_level) {
      case 'very_often':
      case 'constantly':
        guidance.push("This user experiences high stress frequently. Prioritize stress-reduction techniques like breathwork, mindfulness, and nervous system regulation. Make the plan feel achievable, not overwhelming.");
        break;
      case 'often':
        guidance.push("This user deals with regular stress. Include stress management techniques and calming practices in the plan.");
        break;
      case 'rarely':
        guidance.push("This user has low stress levels. You can focus on general wellness and performance optimization rather than stress reduction.");
        break;
    }
  }

  // Preferred focus personalization
  if (onboardingData.preferred_focus) {
    switch (onboardingData.preferred_focus) {
      case 'sleep':
        guidance.push("This user wants to focus on sleep improvement. Weight the plan heavily toward sleep hygiene, evening routines, and practices that improve sleep quality.");
        break;
      case 'stress':
        guidance.push("This user wants to focus on stress management. Emphasize breathwork, mindfulness, and stress-reduction techniques throughout the plan.");
        break;
      case 'energy':
        guidance.push("This user wants to focus on energy and vitality. Include practices that naturally boost energy through nervous system balance, gentle movement, and nutrition.");
        break;
      case 'recovery':
        guidance.push("This user wants to focus on recovery and rest. Emphasize restorative practices, gentle movement, and activities that support physical and mental recovery.");
        break;
      case 'mindfulness':
        guidance.push("This user wants to focus on mindfulness. Weight the plan toward mindset practices, meditation, and contemplative activities while supporting overall wellness.");
        break;
    }
  }

  // Availability-based timing suggestions
  if (onboardingData.availability) {
    switch (onboardingData.availability) {
      case 'morning':
        guidance.push("This user is most available in the morning (6-10 AM). Suggest activities that work well in the morning and mention timing in action descriptions when relevant.");
        break;
      case 'evening':
        guidance.push("This user is most available in the evening (6-10 PM). Focus on evening-appropriate activities and mention timing in action descriptions. Avoid overly energizing practices late in the day.");
        break;
      case 'midday':
        guidance.push("This user is most available midday (10 AM-2 PM). Suggest activities that work well during midday breaks and mention timing when relevant.");
        break;
      case 'afternoon':
        guidance.push("This user is most available in the afternoon (2-6 PM). Suggest activities suitable for afternoon timing and mention this in action descriptions when relevant.");
        break;
      case 'flexible':
        guidance.push("This user has flexible availability. You can suggest activities for any time of day, but provide timing options in your recommendations.");
        break;
    }
  }

  return guidance.length > 0 ? 
    `PERSONALIZATION CONTEXT:\n${guidance.join('\n\n')}` : 
    "No specific personalization data available. Create a balanced, general wellness plan.";
}

// Generate recovery plan with LangChain
async function generatePlanWithLLM(
  biometricData: BiometricData,
  onboardingData: OnboardingData | null
): Promise<PlanPayload> {
  // Set up LangChain with OpenAI
  const model = new ChatOpenAI({
    modelName: "gpt-4.1-mini",
    temperature: 0.7,
    maxTokens: 1200,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Build personalized system prompt based on onboarding data
  const personalizedGuidance = buildPersonalizedGuidance(onboardingData);
  
  // Construct dynamic system prompt
  const systemPrompt = `You are ROOTED, a gentle, evidence-based wellness coach. Generate a 3- to 5-day recovery plan based on the user's biometric data and their personal wellness preferences.

${personalizedGuidance}

Your goal is to help them restore nervous system balance through simple, actionable daily practices that align with their lifestyle and preferences. Each day should include one focused action and a clear rationale explaining why it will help them specifically.

IMPORTANT: Include a brief description that mentions this plan is personalized based on their wellness profile and any available biometric data.

Guidelines:
- Plans should be 3-5 days long
- Each day should have 2-4 tasks from different wellness domains
- Keep tasks simple and achievable (5-20 minutes each)
- Focus on evidence-based practices for recovery
- Tailor to their current biometric state and preferences
- Use warm, encouraging language that acknowledges their specific situation
- Task types: movement, breathwork, mindset, sleep, nutrition
- Include time_suggestion based on their availability and task type
- Weight activities toward their preferred focus area
- Include optional reflection_prompt for deeper engagement
- Never suggest anything medical or dangerous
- Ensure tasks complement each other within each day

You must respond with a valid JSON object with this exact structure:
{
  "title": "3-Day Nervous System Reset",
  "description": "A personalized plan based on your wellness profile and biometric insights",
  "days": [
    {
      "date": "2025-01-15",
      "tasks": [
        {
          "type": "breathwork",
          "title": "Box breathing 5 minutes",
          "rationale": "Activates parasympathetic nervous system and reduces cortisol",
          "time_suggestion": "evening"
        },
        {
          "type": "sleep",
          "title": "Wind-down routine with dim lights",
          "rationale": "Supports natural melatonin production for better sleep quality",
          "time_suggestion": "evening"
        }
      ],
      "reflection_prompt": "What helped you feel most grounded today?"
    }
  ]
}`;

  // Create context from biometric data
  const biometricContext = [];
  if (biometricData.dataPoints > 0) {
    biometricContext.push(`Recent biometric data (${biometricData.dataPoints} data points):`);
    if (biometricData.hrv_rmssd !== undefined) {
      biometricContext.push(`- HRV (RMSSD): ${biometricData.hrv_rmssd}ms`);
    }
    if (biometricData.heart_rate_resting !== undefined) {
      biometricContext.push(`- Resting Heart Rate: ${biometricData.heart_rate_resting} bpm`);
    }
    if (biometricData.stress_avg !== undefined) {
      biometricContext.push(`- Stress Level: ${biometricData.stress_avg}/100`);
    }
    if (biometricData.sleep_total !== undefined) {
      biometricContext.push(`- Sleep Duration: ${(biometricData.sleep_total / 60).toFixed(1)} hours`);
    }
  } else {
    biometricContext.push("No recent biometric data available.");
  }

  // Create rich context from onboarding data
  const onboardingContext = [];
  if (onboardingData) {
    onboardingContext.push("USER WELLNESS PROFILE:");
    
    if (onboardingData.sleep_quality) {
      const sleepDescriptions: Record<string, string> = {
        'excellent': 'sleeps very well consistently',
        'good': 'generally sleeps well', 
        'fair': 'has moderate sleep quality with room for improvement',
        'poor': 'struggles with sleep quality regularly',
        'very_poor': 'has significant sleep challenges'
      };
      onboardingContext.push(`- Sleep: Currently ${sleepDescriptions[onboardingData.sleep_quality] || onboardingData.sleep_quality}`);
    }
    
    if (onboardingData.energy_level) {
      const energyDescriptions: Record<string, string> = {
        'high': 'maintains high energy throughout the day',
        'moderate': 'has steady, moderate energy levels',
        'low': 'experiences low energy during the day',
        'very_low': 'struggles with very low energy levels',
        'fluctuates': 'has energy that varies significantly throughout the day'
      };
      onboardingContext.push(`- Energy: ${energyDescriptions[onboardingData.energy_level] || onboardingData.energy_level}`);
    }
    
    if (onboardingData.stress_level) {
      const stressDescriptions: Record<string, string> = {
        'rarely': 'rarely feels stressed',
        'sometimes': 'occasionally experiences stress',
        'often': 'deals with stress regularly',
        'very_often': 'frequently feels stressed',
        'constantly': 'experiences chronic stress levels'
      };
      onboardingContext.push(`- Stress: ${stressDescriptions[onboardingData.stress_level] || onboardingData.stress_level}`);
    }
    
    if (onboardingData.preferred_focus) {
      const focusDescriptions: Record<string, string> = {
        'sleep': 'wants to prioritize better sleep quality and rest',
        'stress': 'wants to focus on stress management and nervous system regulation',
        'energy': 'wants to focus on improving energy and vitality',
        'recovery': 'wants to prioritize physical and mental recovery',
        'mindfulness': 'wants to focus on mindfulness and mental clarity'
      };
      onboardingContext.push(`- Primary Goal: ${focusDescriptions[onboardingData.preferred_focus] || onboardingData.preferred_focus}`);
    }
    
    if (onboardingData.availability) {
      const availabilityDescriptions: Record<string, string> = {
        'morning': 'is most available in the morning (6-10 AM) for wellness activities',
        'midday': 'is most available during midday (10 AM-2 PM) for wellness practices',
        'afternoon': 'is most available in the afternoon (2-6 PM) for recovery activities',
        'evening': 'is most available in the evening (6-10 PM) for wellness practices',
        'flexible': 'has flexible availability and can adapt to different times'
      };
      onboardingContext.push(`- Schedule: ${availabilityDescriptions[onboardingData.availability] || onboardingData.availability}`);
    }
  } else {
    onboardingContext.push("No personal wellness profile available - create a balanced general plan.");
  }

  // Calculate start date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startDate = tomorrow.toISOString().split('T')[0];

  const userMessage = `Create a personalized recovery plan starting ${startDate}.

${biometricContext.join('\n')}

${onboardingContext.join('\n')}

Based on this information, create a focused recovery plan to help restore balance and improve wellbeing. Include the start date in your day entries.`;

  try {
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage)
    ];

    const response = await model.invoke(messages);
    const content = response.content as string;

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in LLM response');
    }

    const planData = JSON.parse(jsonMatch[0]) as PlanPayload;

    // Validate the response structure
    if (!planData.title || !planData.days || !Array.isArray(planData.days)) {
      throw new Error('Invalid plan structure from LLM');
    }

    // Ensure dates are properly formatted and sequential
    planData.days = planData.days.map((day, index) => {
      const planDate = new Date(tomorrow);
      planDate.setDate(planDate.getDate() + index);
      return {
        ...day,
        date: planDate.toISOString().split('T')[0]
      };
    });

    return planData;
  } catch (error) {
    console.error('Error generating plan with LLM:', error);
    // Return fallback plan
    return generateFallbackPlan(startDate);
  }
}

// Fallback plan when LLM fails
function generateFallbackPlan(startDate: string): PlanPayload {
  const plans = [
    {
      title: "3-Day Nervous System Recovery",
      description: "A personalized plan crafted from your wellness preferences to restore nervous system balance",
      days: [
        {
          date: startDate,
          tasks: [
            {
              type: "breathwork" as const,
              title: "Box breathing for 5 minutes",
              rationale: "Activates the parasympathetic nervous system and reduces cortisol levels",
              time_suggestion: "evening" as const
            },
            {
              type: "mindset" as const,
              title: "Write down 3 things you're grateful for",
              rationale: "Gratitude practice shifts nervous system toward calm and supports emotional regulation",
              time_suggestion: "evening" as const
            }
          ],
          reflection_prompt: "What felt most calming to you today?"
        },
        {
          date: new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          tasks: [
            {
              type: "movement" as const,
              title: "10-minute gentle walk outdoors",
              rationale: "Light movement and natural light help regulate circadian rhythms and reduce stress hormones",
              time_suggestion: "morning" as const
            },
            {
              type: "nutrition" as const,
              title: "Drink a glass of water with lemon",
              rationale: "Hydration and vitamin C support cortisol regulation and energy levels",
              time_suggestion: "morning" as const
            }
          ],
          reflection_prompt: "How did movement affect your energy today?"
        },
        {
          date: new Date(new Date(startDate).getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
          tasks: [
            {
              type: "sleep" as const,
              title: "Dim lights 1 hour before bed",
              rationale: "Light regulation supports natural melatonin production for better sleep quality",
              time_suggestion: "evening" as const
            },
            {
              type: "breathwork" as const,
              title: "4-7-8 breathing before sleep",
              rationale: "This technique activates the relaxation response and prepares your body for rest",
              time_suggestion: "evening" as const
            }
          ],
          reflection_prompt: "What changes did you notice in your sleep quality?"
        }
      ]
    }
  ];

  return plans[0];
}

// Save plan to database
async function savePlanToDatabase(userId: string, planData: PlanPayload): Promise<{ planId: string }> {
  try {
    const startDate = planData.days[0]?.date;
    const endDate = planData.days[planData.days.length - 1]?.date;

    // Insert recovery plan
    const { data: planResult, error: planError } = await supabaseAdmin
      .from('recovery_plans')
      .insert({
        user_id: userId,
        title: planData.title,
        description: planData.description || null,
        start_date: startDate,
        end_date: endDate
      })
      .select('id')
      .single();

    if (planError) {
      throw planError;
    }

    const planId = planResult.id;

    // Insert recovery plan tasks (flattened from multi-task days)
    const tasks = planData.days.flatMap(day => 
      day.tasks.map(task => ({
        plan_id: planId,
        user_id: userId,
        date: day.date,
        action: task.title,
        rationale: task.rationale,
        category: task.type,
        time_suggestion: task.time_suggestion || null,
        recipe_id: task.recipe_id || null,
        scheduled_at: (task as unknown as { scheduled_at?: string }).scheduled_at || null,
      }))
    );

    const { error: tasksError } = await supabaseAdmin
      .from('recovery_plan_tasks')
      .insert(tasks);

    if (tasksError) {
      throw tasksError;
    }

    // Insert reflection prompts if provided
    const reflections = planData.days
      .filter(day => day.reflection_prompt)
      .map(day => ({
        user_id: userId,
        plan_id: planId,
        day: day.date,
        prompt: day.reflection_prompt!,
        reflection_text: null
      }));

    if (reflections.length > 0) {
      const { error: reflectionsError } = await supabaseAdmin
        .from('recovery_plan_reflections')
        .insert(reflections);

      if (reflectionsError) {
        console.warn('Error saving reflections:', reflectionsError);
        // Don't fail the entire operation if reflections fail
      }
    }

    console.log(`Recovery plan created successfully for user ${userId}: ${planId}`);
    return { planId };
  } catch (error) {
    console.error('Error saving plan to database:', error);
    throw error;
  }
}

// Main function to generate recovery plan
export async function generateRecoveryPlan(userId: string): Promise<PlanPayload> {
  try {
    console.log(`Generating recovery plan for user: ${userId}`);
    
    // Step 1: Load recent biometric data
    const biometricData = await loadRecentBiometricData(userId);
    
    // Step 2: Load onboarding data
    const onboardingData = await loadOnboardingData(userId);
    
    // Step 3: Generate plan with LLM
    let planData = await generatePlanWithLLM(biometricData, onboardingData);

    // Step 3.1: Deterministic scheduling using circadian + availability + tz
    // Load circadian profile
    const { data: circ } = await supabaseAdmin
      .from('user_circadian_profiles')
      .select('chronotype, wake_time, bedtime')
      .eq('user_id', userId)
      .maybeSingle()
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('timezone')
      .eq('id', userId)
      .maybeSingle()
    const tz = userRow?.timezone || 'UTC'
    if (circ?.chronotype && circ?.wake_time && circ?.bedtime) {
      try {
        planData = mapTasksToTimes(planData, {
          chronotype: circ.chronotype as 'lark'|'neutral'|'owl',
          wakeTime: String(circ.wake_time),
          bedtime: String(circ.bedtime),
          tz,
          availability: (onboardingData?.availability as 'morning'|'midday'|'afternoon'|'evening'|'flexible' | undefined) || 'flexible',
        })
      } catch (e) {
        console.warn('Scheduling failed; proceeding without scheduled_at:', e)
      }
    }
    
    // Step 4: Save to database
    await savePlanToDatabase(userId, planData);
    
    return planData;
  } catch (error) {
    console.error('Error in generateRecoveryPlan:', error);
    throw error;
  }
}

// Helper function to get user's current active plan
export async function getCurrentPlan(userId: string) {
  try {
    const { data: plan, error } = await supabaseAdmin
      .from('recovery_plans')
      .select(`
        id,
        title,
        description,
        start_date,
        end_date,
        created_at,
        recovery_plan_tasks (
          id,
          date,
          action,
          rationale,
          category,
          time_suggestion,
          scheduled_at,
          recipe_id,
          completed
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !plan) {
      return null;
    }

    // Also get reflections for this plan
    const { data: reflections } = await supabaseAdmin
      .from('recovery_plan_reflections')
      .select('*')
      .eq('plan_id', plan.id)
      .eq('user_id', userId);

    return {
      ...plan,
      recovery_plan_reflections: reflections || []
    };
  } catch (error) {
    console.error('Error getting current plan:', error);
    return null;
  }
}

// Helper function to get today's task
export async function getTodaysTask(userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: task, error } = await supabaseAdmin
      .from('recovery_plan_tasks')
      .select(`
        id,
        date,
        action,
        rationale,
        category,
        time_suggestion,
        recipe_id,
        completed,
        recovery_plans!inner(id, title)
      `)
      .eq('user_id', userId)
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !task) {
      return null;
    }

    return task;
  } catch (error) {
    console.error('Error getting today\'s task:', error);
    return null;
  }
}

// Helper function to mark task as completed
export async function markTaskCompleted(taskId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('recovery_plan_tasks')
      .update({ completed: true })
      .eq('id', taskId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error marking task completed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markTaskCompleted:', error);
    return false;
  }
}