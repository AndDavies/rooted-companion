/* eslint-disable @typescript-eslint/no-unused-vars */

import { createResponseWithDefaults, getToolCalls, type ResponseLike, defaultMaxOutputTokensForLength } from "@/lib/llm/openaiClient";
import { z } from "zod";
import { zodPlanPayload } from "@/lib/llm/schemas/planTool";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { mapTasksToTimes } from '@/lib/circadian/scheduler'
import { parseTaskContent } from '@/lib/tasks/contentSchema'
import type { Json } from '@/types/supabase'

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
  time_suggestion?: 'morning' | 'midday' | 'afternoon' | 'evening' | 'flexible';
  recipe_id?: string;         // only for nutrition tasks
  duration_minutes?: number;
  evidence_ids?: string[];
  slot_hint?: string;
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

type PlanningOptions = { planLength?: 3 | 5 | 7 };

// Generate recovery plan with OpenAI Responses API
async function generatePlanWithLLM(
  biometricData: BiometricData,
  onboardingData: OnboardingData | null,
  circadian: { chronotype?: string | null; wake_time?: string | null; bedtime?: string | null; tz: string },
  opts: PlanningOptions
): Promise<{ plan: PlanPayload; requestId?: string; raw?: unknown }> {
  // Build personalized system prompt based on onboarding data
  const personalizedGuidance = buildPersonalizedGuidance(onboardingData);
  
  // Construct dynamic system prompt
  const systemPrompt = `You are ROOTED, an evidence-based wellness coach.

${personalizedGuidance}

Return a recovery plan with fully scheduled tasks.

REQUIRED STRUCTURE:
- Return exactly 3-7 days. Do not return more or fewer days.
- Every task MUST include scheduled_at as a UTC ISO timestamp (ends with Z).
- For each task, ALWAYS include evidence_ids as an array (can be empty).
- Every task MUST include duration_minutes (5–40). Movement may be up to 40; others 5–20.
- slot_hint is optional for template compatibility.

COMPACTNESS:
- Return MINIFIED JSON (no spaces or newlines).
- Titles ≤ 60 chars. Rationales ≤ 140 chars.
- 3–4 tasks per day.
- evidence_ids may be [].
- recipe_id: null unless a nutrition item truly needs it.
- Always include time_suggestion (morning/midday/afternoon/evening/flexible or null) and slot_hint (string or null).
- Keep JSON minimal; no extra fields.
- Respect availability, chronotype, wake, and bedtime when provided.
- Never schedule before wake or after bedtime.
- Morning items ≥ 30 min after wake.
- Evening/sleep-prep items 60–120 min before bedtime (avoid absurd times like 3pm screen-off).
- Keep tasks simple (5–20 minutes), safe, non-medical.
- Use warm, concise language.`;

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

  const planLength = opts.planLength ?? 3;

  const userMessage = `Create a personalized recovery plan starting ${startDate}.

${biometricContext.join('\n')}

${onboardingContext.join('\n')}

SCHEDULE GUIDANCE:
- Chronotype: ${circadian.chronotype ?? 'unknown'}
- Wake: ${circadian.wake_time ?? 'unknown'}
- Bedtime: ${circadian.bedtime ?? 'unknown'}
- User timezone: ${circadian.tz}

CONSTRAINTS:
- Exactly ${planLength} days
- Each task requires: type, title, rationale, scheduled_at (UTC Z), duration_minutes (5–40)
- evidence_ids is optional (may be empty)

Return the plan ONLY by calling the tool. Never print JSON in text. Never include code fences. Call the tool now. Do not write any additional text.`;

  const { openAIToolDefinition } = await import("@/lib/llm/schemas/planTool");
  type SchemaObj = { type?: string; properties?: Record<string, unknown> };
  const paramsObj = (openAIToolDefinition as { parameters?: SchemaObj })?.parameters;
  const rootType = paramsObj?.type;
  const props: Record<string, unknown> = paramsObj?.properties ?? {};
  const days = props['days'] as { items?: unknown } | undefined;
  const daysItems = (days?.items ?? undefined) as { properties?: Record<string, unknown> } | undefined;
  const dayProps: Record<string, unknown> | undefined = daysItems?.properties;
  const tasks = (dayProps ? (dayProps['tasks'] as { items?: unknown } | undefined) : undefined);
  const tasksItems = (tasks?.items ?? undefined) as { required?: unknown } | undefined;
  const reqUnknown = tasksItems?.required;
  const taskRequired = Array.isArray(reqUnknown) ? (reqUnknown as unknown[]).filter((k): k is string => typeof k === 'string') : [];
  console.debug("TOOL_PARAMETERS_TYPE", rootType);
  const taskKeys = Object.keys(((tasksItems as unknown as { properties?: Record<string, unknown> })?.properties) ?? {});
  console.debug("TOOL_TASK_KEYS", taskKeys);
  console.debug("TOOL_TASK_REQUIRED", taskRequired);

  const baseMax = defaultMaxOutputTokensForLength(planLength);
  console.debug('LLM_MAX_OUTPUT_TOKENS', baseMax);
  const resp = await createResponseWithDefaults({
    // Use instructions instead of system per Responses API
    instructions: systemPrompt,
    input: [{ role: "user", content: userMessage }],
    tools: [openAIToolDefinition as unknown as { type: "function"; name: string; description?: string; strict?: boolean; parameters: Record<string, unknown> }],
    // Constrain tool usage
    tool_choice: { type: "function", name: (openAIToolDefinition as { name: string }).name },
    parallel_tool_calls: false,
    //temperature: 0.4,
    max_output_tokens: baseMax,
  });

  const requestId = (resp as { id?: string }).id;
  let toolCalls = getToolCalls(resp as unknown as ResponseLike);
  if (!toolCalls.length) {
    throw new Error('NoToolCallError');
  }
  // Use the last call if multiple
  let call = toolCalls[toolCalls.length - 1];
  let rawArgs = call.arguments;
  let parsedArgs: unknown;
  try {
    parsedArgs = JSON.parse(rawArgs);
  } catch {
    // Attempt JSON repair and retry parse
    const { repairJson } = await import("@/lib/llm/jsonRepair");
    const repaired = repairJson(rawArgs);
    try {
      parsedArgs = JSON.parse(repaired);
    } catch {
      console.warn('MalformedToolArgumentsError', {
        request_id: requestId,
        arg_len: rawArgs?.length ?? 0,
        head: rawArgs?.slice(0, 200),
        tail: rawArgs?.slice(-200),
      })
      // Retry once with corrective user nudge
      const retry = await createResponseWithDefaults({
        instructions: systemPrompt,
        input: [
          { role: 'user', content: userMessage },
          { role: 'user', content: 'The previous tool call had malformed JSON. Call the same tool again. Do not include any text, only the tool call.' }
        ],
        tools: [openAIToolDefinition as unknown as { type: "function"; name: string; description?: string; strict?: boolean; parameters: Record<string, unknown> }],
        tool_choice: {
          type: 'allowed_tools',
          mode: 'required',
          tools: [{ type: 'function', name: (openAIToolDefinition as { name: string }).name }],
        },
        parallel_tool_calls: false,
        max_output_tokens: 1800,
      })
      toolCalls = getToolCalls(retry as unknown as ResponseLike)
      if (!toolCalls.length) throw new Error('NoToolCallError')
      call = toolCalls[toolCalls.length - 1]
      rawArgs = call.arguments
      parsedArgs = JSON.parse(rawArgs)
    }
  }

  try {
    const validated = zodPlanPayload.parse(parsedArgs);
    if ((validated.days?.length ?? 0) !== planLength) {
      const retry = await createResponseWithDefaults({
        instructions: systemPrompt,
        input: [
          { role: 'user', content: userMessage },
          { role: 'user', content: `Your last arguments contained ${validated.days?.length ?? 0} days but exactly ${planLength} are required. Please return a corrected tool call with exactly ${planLength} days.` }
        ],
        tools: [openAIToolDefinition as unknown as { type: "function"; name: string; description?: string; strict?: boolean; parameters: Record<string, unknown> }],
        tool_choice: { type: 'function', name: (openAIToolDefinition as { name: string }).name },
        parallel_tool_calls: false,
        max_output_tokens: baseMax + 800,
      })
      const retryCalls = getToolCalls(retry as unknown as ResponseLike)
      if (!retryCalls.length) throw new Error('NoToolCallError')
      const finalCall = retryCalls[retryCalls.length - 1]
      const finalArgs = JSON.parse(finalCall.arguments)
      const finalValidated = zodPlanPayload.parse(finalArgs)
      if ((finalValidated.days?.length ?? 0) !== planLength) throw new Error('WrongPlanLength')
      const normalized = normalizeDatesAndTimes(finalValidated, startDate);
      return { plan: normalized, requestId, raw: finalValidated };
    }
    const normalized = normalizeDatesAndTimes(validated, startDate);
    return { plan: normalized, requestId, raw: validated };
  } catch (e) {
    if (e instanceof (await import('zod')).ZodError) {
      const issues = e.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      console.warn('Zod validation errors (redacted):', issues)
      // Retry once with corrective user nudge
      const retry = await createResponseWithDefaults({
        instructions: systemPrompt,
        input: [
          { role: 'user', content: userMessage },
          { role: 'user', content: `Your last arguments failed validation for these fields: ${issues.map(i=>i.path).join(', ')}. Please return a corrected tool call that conforms exactly to the function schema. All timestamps must end with Z.` }
        ],
        tools: [openAIToolDefinition as unknown as { type: "function"; name: string; description?: string; strict?: boolean; parameters: Record<string, unknown> }],
        tool_choice: {
          type: 'allowed_tools',
          mode: 'required',
          tools: [{ type: 'function', name: (openAIToolDefinition as { name: string }).name }],
        },
        parallel_tool_calls: false,
        max_output_tokens: baseMax + 800,
      })
      const retryCalls = getToolCalls(retry as unknown as ResponseLike)
      if (!retryCalls.length) throw e
      const finalCall = retryCalls[retryCalls.length - 1]
      const finalArgs = JSON.parse(finalCall.arguments)
      const finalValidated = zodPlanPayload.parse(finalArgs)
      const normalized = normalizeDatesAndTimes(finalValidated, startDate)
      return { plan: normalized, requestId }
    }
    throw e
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
async function savePlanToDatabase(
  userId: string,
  planData: PlanPayload,
  meta?: { planLength?: number; requestId?: string; used_llm_scheduler?: boolean; agent_version?: string }
): Promise<{ planId: string }> {
  try {
    const startDate = planData.days[0]?.date;
    const endDate = planData.days[planData.days.length - 1]?.date;

    // Enforce single active plan: remove existing plans and tasks for this user
    const { data: existingPlans } = await supabaseAdmin
      .from('recovery_plans')
      .select('id')
      .eq('user_id', userId)
    const existingIds = (existingPlans ?? []).map((p: { id: string }) => p.id)
    if (existingIds.length) {
      await supabaseAdmin.from('recovery_plan_tasks').delete().in('plan_id', existingIds)
      await supabaseAdmin.from('recovery_plan_reflections').delete().in('plan_id', existingIds)
      await supabaseAdmin.from('recovery_plans').delete().in('id', existingIds)
    }

    // Insert recovery plan
    const { data: planResult, error: planError } = await supabaseAdmin
      .from('recovery_plans')
      .insert({
        user_id: userId,
        title: planData.title,
        description: planData.description || null,
        start_date: startDate,
        end_date: endDate,
        length_days: meta?.planLength ?? planData.days.length,
        metadata: {
          request_id: meta?.requestId ?? null,
          used_llm_scheduler: meta?.used_llm_scheduler ?? true,
          agent_version: meta?.agent_version ?? 'phase4',
          params: { length_days: meta?.planLength ?? planData.days.length },
          source: 'agent'
        }
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
        title: task.title,
        rationale: task.rationale,
        category: task.type,
        pillar: (task as unknown as { pillar?: string | null }).pillar ?? null,
        slug: (task as unknown as { slug?: string | null }).slug ?? null,
        time_suggestion: task.time_suggestion || null,
        recipe_id: task.recipe_id || null,
        scheduled_at: (task as unknown as { scheduled_at?: string }).scheduled_at || null,
        duration_minutes: (task as unknown as { duration_minutes?: number }).duration_minutes ?? null,
        slot_hint: (task as unknown as { slot_hint?: string }).slot_hint ?? null,
        evidence_ids: (task as unknown as { evidence_ids?: string[] }).evidence_ids ?? null,
        task_payload: {
          ...(task as unknown as Record<string, unknown>),
          content: parseTaskContent((task as unknown as { content?: unknown })?.content ?? {}) || {},
        } as unknown as Json,
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
export async function generateRecoveryPlan(userId: string, options?: PlanningOptions): Promise<PlanPayload> {
  try {
    const planLength = options?.planLength ?? 3;
    console.log(`PHASE4 Generating recovery plan for user: ${userId} planLength=${planLength}`);
    
    // Step 1: Load recent biometric data
    const biometricData = await loadRecentBiometricData(userId);
    
    // Step 2: Load onboarding data
    const onboardingData = await loadOnboardingData(userId);
    
    // Load circadian profile (used by LLM and potential fallback)
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
    const useLlmScheduler = (process.env.USE_LLM_SCHEDULER ?? 'true').toLowerCase() !== 'false'

    let planData: PlanPayload
    let requestId: string | undefined
    try {
      const { plan, requestId: rid } = await generatePlanWithLLM(biometricData, onboardingData, {
        chronotype: circ?.chronotype ?? null,
        wake_time: circ?.wake_time ?? null,
        bedtime: circ?.bedtime ?? null,
        tz,
      }, { planLength })
      planData = plan
      requestId = rid
      console.log(`LLM schedule path used${requestId ? `, request_id=${requestId}` : ''}`)
    } catch (e) {
      if (e instanceof z.ZodError) {
        console.warn('Zod validation errors (redacted):', e.issues.map(i => ({ path: i.path, message: i.message })))
      } else {
        console.warn('LLM scheduling error:', (e as Error)?.message)
      }
      const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      if (!useLlmScheduler && circ?.chronotype && circ?.wake_time && circ?.bedtime) {
        console.warn('Zod validation failed; using deterministic mapper (feature flag).')
        const basePlan = generateFallbackPlan(startDate)
        try {
          planData = mapTasksToTimes(basePlan, {
          chronotype: circ.chronotype as 'lark'|'neutral'|'owl',
          wakeTime: String(circ.wake_time),
          bedtime: String(circ.bedtime),
          tz,
          availability: (onboardingData?.availability as 'morning'|'midday'|'afternoon'|'evening'|'flexible' | undefined) || 'flexible',
        })
    } catch {
          console.warn('Deterministic scheduling failed, falling back to unscheduled plan.')
          planData = basePlan
        }
      } else {
        console.warn('LLM scheduling invalid; falling back to default plan.')
        planData = generateFallbackPlan(startDate)
      }
    }
    
    // Step 4: Save to database
    await savePlanToDatabase(userId, planData, { planLength, requestId, used_llm_scheduler: true, agent_version: 'phase4' });
    
    return planData;
  } catch (error) {
    console.error('Error in generateRecoveryPlan:', error);
    throw error;
  }
}

// Normalize: ensure sequential dates start from tomorrow and scheduled_at dates align to day.date
type RawTask = {
  type: DayTask['type'];
  title: string;
  rationale: string;
  time_suggestion?: 'morning' | 'midday' | 'afternoon' | 'evening' | 'flexible' | null;
  recipe_id?: string | null;
  scheduled_at?: string | null;
  duration_minutes?: number | null;
  evidence_ids?: string[] | null;
  slot_hint?: 'wake' | 'mid_morning' | 'midday' | 'afternoon' | 'evening' | 'pre_sleep' | null;
};
type RawDay = { date?: string; tasks: RawTask[]; reflection_prompt?: string | null };
type RawPlan = { title: string; description?: string | null; days: RawDay[] };

function normalizeDatesAndTimes(inputPlan: RawPlan, startDate: string): PlanPayload {
  const base = new Date(startDate + 'T00:00:00.000Z');

  const normalizedDays: DayPlan[] = inputPlan.days.map((rawDay, index) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + index);
    const ymd = d.toISOString().slice(0, 10);

    const tasks = rawDay.tasks.map((rawTask) => {
      const isoIn: string | undefined = rawTask?.scheduled_at ?? undefined;
      let dt: Date | undefined;
      if (isoIn) {
        const parsed = new Date(isoIn);
        dt = isNaN(parsed.getTime()) ? undefined : parsed;
      }
      // Default to 12:00Z if missing/invalid
      if (!dt) dt = new Date(`${ymd}T12:00:00.000Z`);

      // Align date to this day's date but preserve UTC time components
      const hours = dt.getUTCHours();
      const minutes = dt.getUTCMinutes();
      const seconds = dt.getUTCSeconds();
      const ms = dt.getUTCMilliseconds();
      const aligned = new Date(`${ymd}T00:00:00.000Z`);
      aligned.setUTCHours(hours, minutes, seconds, ms);
      const scheduled_at = aligned.toISOString();

      // Coerce nullable optionals to undefined to match local TS types
      const time_suggestion = (rawTask?.time_suggestion ?? null) as DayTask['time_suggestion'] | undefined;
      const recipe_id = rawTask?.recipe_id ?? undefined;
      const duration_minutes = rawTask?.duration_minutes ?? undefined;
      const evidence_ids = rawTask?.evidence_ids ?? [];
      const slot_hint = rawTask?.slot_hint ?? undefined;

      return {
        type: rawTask.type,
        title: rawTask.title,
        rationale: rawTask.rationale,
        time_suggestion,
        recipe_id,
        duration_minutes,
        evidence_ids,
        slot_hint,
        // Keep scheduled_at for DB insertion via cast in savePlanToDatabase
        scheduled_at,
      } as unknown as DayTask & { scheduled_at: string };
    });

    const reflection_prompt = rawDay?.reflection_prompt ?? undefined;
    return { date: ymd, tasks: tasks as unknown as DayTask[], reflection_prompt } as DayPlan;
  });

  const description = inputPlan?.description ?? undefined;
  return { title: inputPlan.title, description, days: normalizedDays } as PlanPayload;
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
          title,
          rationale,
          category,
          pillar,
          slug,
          time_suggestion,
          scheduled_at,
          recipe_id,
          completed,
          task_payload
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
        title,
        rationale,
        category,
        pillar,
        slug,
        time_suggestion,
        recipe_id,
        completed,
        task_payload,
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