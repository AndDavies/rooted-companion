import { NextResponse } from 'next/server';
import { createClientForActions } from '@/utils/supabase/server';
import { 
  generateRecoveryPlan, 
  getCurrentPlan, 
  getTodaysTask,
  markTaskCompleted 
} from '@/lib/llm/planAgent';

// GET: returns current active plan + today's task
export async function GET() {
  try {
    // Get the current user from Supabase auth
    const supabase = await createClientForActions();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get current plan and today's task in parallel
    const [currentPlan, todaysTask] = await Promise.all([
      getCurrentPlan(user.id),
      getTodaysTask(user.id)
    ]);
    
    return NextResponse.json({ 
      currentPlan,
      todaysTask,
      message: 'Planning data retrieved successfully',
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving planning data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve planning data',
        message: 'An error occurred while fetching your recovery plan. Please try again later.'
      }, 
      { status: 500 }
    );
  }
}

// POST: triggers the generateRecoveryPlan() function
export async function POST(request: Request) {
  try {
    // Get the current user from Supabase auth
    const supabase = await createClientForActions();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse body for plan parameters
    const body = await request.json().catch(() => ({}));
    const planLength = ([3,5,7] as const).includes(body?.planLength) ? body.planLength as 3|5|7 : 3;
    // Generate the recovery plan
    const plan = await generateRecoveryPlan(user.id, { planLength });
    
    return NextResponse.json({ 
      plan,
      message: 'Recovery plan generated successfully',
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error('Error generating recovery plan:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate recovery plan',
        message: 'An error occurred while generating your recovery plan. Please try again later.'
      }, 
      { status: 500 }
    );
  }
}

// PATCH: mark task as completed or save reflection
export async function PATCH(request: Request) {
  try {
    // Get the current user from Supabase auth
    const supabase = await createClientForActions();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { taskId, reflectionId, reflectionText } = body;
    
    // Handle task completion
    if (taskId) {
      const success = await markTaskCompleted(taskId, user.id);
      
      if (!success) {
        return NextResponse.json({ error: 'Failed to mark task as completed' }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true,
        message: 'Task marked as completed',
        timestamp: new Date().toISOString()
      }, { status: 200 });
    }
    
    // Handle reflection update
    if (reflectionId && reflectionText !== undefined) {
      const { error: reflectionError } = await supabase
        .from('recovery_plan_reflections')
        .update({ reflection_text: reflectionText })
        .eq('id', reflectionId)
        .eq('user_id', user.id);
      
      if (reflectionError) {
        console.error('Error updating reflection:', reflectionError);
        return NextResponse.json({ error: 'Failed to save reflection' }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true,
        message: 'Reflection saved successfully',
        timestamp: new Date().toISOString()
      }, { status: 200 });
    }
    
    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error in PATCH request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update',
        message: 'An error occurred while updating. Please try again later.'
      }, 
      { status: 500 }
    );
  }
}