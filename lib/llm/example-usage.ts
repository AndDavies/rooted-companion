// Example usage file for the ROOTED suggestion agent
// This demonstrates how to integrate the suggestion agent into your app

import { generateDailySuggestion, getLatestBiometrics, markSuggestionCompleted } from './suggestionAgent';

/**
 * Example: Generate a daily suggestion for a user
 * This would typically be called from an API route or server action
 */
export async function exampleGenerateSuggestion(userId: string) {
  try {
    console.log(`Generating daily suggestion for user: ${userId}`);
    
    const suggestion = await generateDailySuggestion(userId);
    
    console.log('Generated suggestion:', {
      action: suggestion.action,
      category: suggestion.category,
      recoveryScore: suggestion.recoveryScore,
      wearableUsed: suggestion.wearableUsed
    });
    
    return suggestion;
  } catch (error) {
    console.error('Error generating suggestion:', error);
    throw error;
  }
}

/**
 * Example: Get latest HRV reading for a user
 */
export async function exampleGetLatestHRV(userId: string) {
  try {
    const latestHRV = await getLatestBiometrics(userId, 'hrv_rmssd');
    
    if (latestHRV !== null) {
      console.log(`Latest HRV for user ${userId}: ${latestHRV}ms`);
    } else {
      console.log(`No HRV data found for user ${userId}`);
    }
    
    return latestHRV;
  } catch (error) {
    console.error('Error getting latest HRV:', error);
    return null;
  }
}

/**
 * Example: Mark a suggestion as completed
 * This would be called when a user confirms they've done the suggested action
 */
export async function exampleMarkCompleted(suggestionId: string) {
  try {
    await markSuggestionCompleted(suggestionId);
    console.log(`Marked suggestion ${suggestionId} as completed`);
  } catch (error) {
    console.error('Error marking suggestion as completed:', error);
  }
}

/**
 * Example: Daily suggestion workflow
 * This simulates a complete daily suggestion flow
 */
export async function exampleDailyWorkflow(userId: string) {
  try {
    // 1. Generate the daily suggestion
    console.log('=== ROOTED Daily Suggestion Workflow ===');
    const suggestion = await generateDailySuggestion(userId);
    
    // 2. Display the suggestion (in a real app, this would be shown in the UI)
    console.log('\n📋 Today\'s Suggestion:');
    console.log(`Action: ${suggestion.action}`);
    console.log(`Category: ${suggestion.category}`);
    console.log(`Rationale: ${suggestion.rationale}`);
    console.log(`Recovery Score: ${suggestion.recoveryScore}/100`);
    console.log(`Used Wearable Data: ${suggestion.wearableUsed ? 'Yes' : 'No'}`);
    
    // 3. Simulate user completing the action (after some time)
    // In a real app, this would happen when the user taps "Mark as Done"
    console.log('\n✅ Simulating user completion...');
    
    // Note: In real usage, you'd get the suggestion ID from the database
    // For this example, we'd need to query the most recent suggestion
    
    return suggestion;
  } catch (error) {
    console.error('Error in daily workflow:', error);
    throw error;
  }
}

/**
 * Example API route handler (Next.js App Router)
 * Save this to: app/api/suggestions/daily/route.ts
 */
export async function exampleAPIRoute() {
  const apiRouteExample = `
// app/api/suggestions/daily/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateDailySuggestion } from '@/lib/llm/suggestionAgent';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get the current user from Supabase auth
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Generate the daily suggestion
    const suggestion = await generateDailySuggestion(user.id);
    
    return NextResponse.json({ suggestion }, { status: 200 });
  } catch (error) {
    console.error('Error generating daily suggestion:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestion' }, 
      { status: 500 }
    );
  }
}
`;
  
  console.log('Example API Route:');
  console.log(apiRouteExample);
}

/**
 * Example React component usage
 * Save this to: components/widgets/DailySuggestionWidget.tsx
 */
export async function exampleReactComponent() {
  const componentExample = `
// components/widgets/DailySuggestionWidget.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SuggestionPayload } from '@/lib/llm/suggestionAgent';

export function DailySuggestionWidget() {
  const [suggestion, setSuggestion] = useState<SuggestionPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const generateSuggestion = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/suggestions/daily', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestion(data.suggestion);
      } else {
        console.error('Failed to generate suggestion');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markCompleted = () => {
    setCompleted(true);
    // Here you would also call your API to mark as completed in the database
  };

  useEffect(() => {
    generateSuggestion();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Generating your daily suggestion...</div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestion) {
    return (
      <Card>
        <CardContent className="p-6">
          <Button onClick={generateSuggestion}>Get Daily Suggestion</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Today's Wellness Suggestion
          <span className="text-sm font-normal">
            Recovery: {suggestion.recoveryScore}/100
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="font-medium text-lg">{suggestion.action}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Category: {suggestion.category}
            </div>
          </div>
          
          <div className="text-sm">
            {suggestion.rationale}
          </div>
          
          {!completed && (
            <Button onClick={markCompleted} className="w-full">
              Mark as Done ✓
            </Button>
          )}
          
          {completed && (
            <div className="text-center text-green-600 font-medium">
              Great job! ✨ See you tomorrow for another suggestion.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
`;
  
  console.log('Example React Component:');
  console.log(componentExample);
}