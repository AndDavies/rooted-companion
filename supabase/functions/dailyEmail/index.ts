// @ts-nocheck

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.5';
import { format } from 'https://deno.land/std@0.168.0/datetime/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const EMAIL_FROM = Deno.env.get('EMAIL_FROM');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');


const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);


function getTodayISO(timezone = 'UTC') {
  const date = new Date().toLocaleString('en-US', { timeZone: timezone });
  return format(new Date(date), 'yyyy-MM-dd');
}

serve(async (req) => {
  console.log('📬 Starting dailyEmail edge function');
  console.log('✅ EMAIL_FROM from env:', EMAIL_FROM);

  // Step 1: Fetch users who have opted into daily emails
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('receive_daily_email', true);

  if (error) {
    console.error('❌ Error fetching users:', error);
    return new Response('Error fetching users', { status: 500 });
  }

  if (!users || users.length === 0) {
    console.log('📭 No users found for daily emails.');
    return new Response(JSON.stringify({ message: 'No users found for daily emails.' }), {
      status: 200,
      headers: corsHeaders,
    });
  }

  console.log(`📧 Found ${users.length} users to email`);
  users.forEach((u) => console.log('→', u.email));

  // Step 2: Email each user
  const today = getTodayISO('UTC');
  const { data: dailyResource } = await supabase
    .from('email_resources')
    .select('title, link')
    .eq('date', today)
    .maybeSingle();

  const resource = dailyResource || null;

  for (const user of users) {
    const userToday = getTodayISO(user.timezone || 'UTC');

    const { data: tasks, error: tasksError } = await supabase
      .from('recovery_plan_tasks')
      .select('action, category, time_suggestion')
      .eq('user_id', user.id)
      .eq('date', userToday);

    if (tasksError) console.error('❌ Error fetching today’s tasks:', tasksError);

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: connections, error: connError } = await supabase
      .from('wearable_connections')
      .select('id')
      .eq('user_id', user.id);

    const connectionIds = connections?.map((c) => c.id) || [];

    const { data: biometrics, error: biometricsError } = await supabase
      .from('wearable_data')
      .select('metric_type, value, timestamp')
      .in('connection_id', connectionIds)
      .in('metric_type', ['hrv_rmssd', 'heart_rate_resting', 'deep_sleep'])
      .gte('timestamp', threeDaysAgo);

    if (biometricsError) console.error('❌ Error fetching biometrics:', biometricsError);

    const trendMap = new Map();
    for (const m of biometrics || []) {
      if (!trendMap.has(m.metric_type)) trendMap.set(m.metric_type, []);
      trendMap.get(m.metric_type).push(m.value);
    }

    const biometricLines = [...trendMap.entries()]
      .map(([type, values]) => {
        const avg = values.reduce((sum, v) => sum + Number(v), 0) / values.length;
        return `• ${type.toUpperCase()}: ${avg.toFixed(1)} (3-day avg)`;
      })
      .join('<br>') || 'No recent biometrics found.';

    const { count: streakCount } = await supabase
      .from('suggestion_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const { data: onboarding } = await supabase
      .from('user_onboarding')
      .select('preferred_focus')
      .eq('user_id', user.id)
      .maybeSingle();

    const focus = onboarding?.preferred_focus;

    const taskLines = tasks?.length
      ? tasks.map((t) => `• ${t.action} (${t.category}, ${t.time_suggestion})`).join('<br>')
      : 'No tasks found in your plan today.';

    const motivationalLine = streakCount && streakCount > 0
      ? `You're on a ${streakCount}-day streak of completing your actions! 🔥`
      : `Every day is a fresh start. 🌱`;

    const html = `
      <div style="font-family: sans-serif; line-height: 1.4;">
        <h2 style="color: #224;">🌿 Your Daily ROOTED Pulse</h2>
        <p>Hi ${user.full_name || 'there'} (${user.id}),</p>
        <p>Here’s your check-in for <strong>${userToday}</strong>.</p>

        <h3>🧠 Today’s Plan</h3>
        <p>${taskLines}</p>

        <h3>📊 Biometrics</h3>
        <p>${biometricLines}</p>

        <h3>🔥 Motivation</h3>
        <p>${motivationalLine}</p>

        ${
          resource
            ? `<h3>📘 Daily Resource</h3><p><a href="${resource.link}">${resource.title}</a></p>`
            : ''
        }

        <p style="margin-top: 16px;">
          👉 <a href="https://app.therootedway.co/dashboard" style="color: #2c7be5;">Go to your dashboard</a>
        </p>

        <p style="margin-top: 24px; font-size: 0.9em; color: #666;">
          You’re doing great. Keep showing up for yourself. 💙
        </p>
      </div>
    `;

    const emailPayload = {
      from: EMAIL_FROM,
      to: user.email,
      subject: 'Your Daily ROOTED Pulse',
      html,
    };

    console.log(`📨 Sending email to: ${user.email}`);
    console.log('📤 Email payload:', emailPayload);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    console.log(`📬 Resend status for ${user.email}:`, response.status);
    const responseText = await response.text();
    console.log(`📨 Resend response for ${user.email}:`, responseText);
  }

  // Step 3: Allow logs to flush
  await new Promise((resolve) => setTimeout(resolve, 500));

  return new Response(JSON.stringify({ status: 'Emails processed' }), {
    status: 200,
    headers: corsHeaders,
  });
});