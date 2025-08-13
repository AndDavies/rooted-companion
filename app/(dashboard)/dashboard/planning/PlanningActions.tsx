'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { CheckCircle2, RefreshCw, Calendar, Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlanningActionsProps {
  taskId?: string;
  isGenerateButton?: boolean;
  isRegenerateButton?: boolean;
  reflectionId?: string;
  currentReflection?: string | null;
  reflectionPrompt?: string;
}

export default function PlanningActions({ 
  taskId, 
  isGenerateButton = false, 
  isRegenerateButton = false,
  reflectionId,
  currentReflection,
  reflectionPrompt
}: PlanningActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [planLength, setPlanLength] = useState<3|5|7>(3);
  const [isCompleted, setIsCompleted] = useState(false);
  const [reflectionText, setReflectionText] = useState(currentReflection || '');
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const router = useRouter();
  // Local notify fallback to avoid provider requirement during testing
  const notify = (opts: { title: string; description?: string; variant?: 'destructive' | 'default' }) => {
    // If a global toast is available, use it; otherwise console.log
    try {
      // @ts-expect-error optional global
      if (typeof window !== 'undefined' && window.toast) window.toast(opts)
      else console.log(`[${opts.variant ?? 'default'}] ${opts.title}: ${opts.description ?? ''}`)
    } catch {
      console.log(`[${opts.variant ?? 'default'}] ${opts.title}: ${opts.description ?? ''}`)
    }
  }

  // Persist selections in localStorage
  React.useEffect(() => {
    try {
      const savedRaw = localStorage.getItem('planGenOpts') || '{}';
      const saved: { planLength?: 3|5|7 } = JSON.parse(savedRaw);
      if (saved.planLength && [3,5,7].includes(saved.planLength)) setPlanLength(saved.planLength);
    } catch {}
  }, []);
  React.useEffect(() => {
    try {
      localStorage.setItem('planGenOpts', JSON.stringify({ planLength }));
    } catch {}
  }, [planLength]);

  const handleMarkComplete = async () => {
    if (!taskId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/planning', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId }),
      });

      if (response.ok) {
        setIsCompleted(true);
        // Refresh the page to show updated state
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        console.error('Failed to mark task as completed');
      }
    } catch (error) {
      console.error('Error marking task as completed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/planning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planLength }),
      });

      if (response.ok) {
        // Refresh the page to show the new plan
        router.refresh();
        notify({ title: 'Plan generated', description: 'Your recovery plan was created successfully.' });
      } else {
        notify({ title: 'Failed to generate plan', description: 'Please try again in a moment.', variant: 'destructive' });
      }
  } catch {
      notify({ title: 'Error generating plan', description: 'Please try again in a moment.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReflection = async () => {
    if (!reflectionId) return;
    
    setIsSavingReflection(true);
    try {
      const response = await fetch('/api/planning', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          reflectionId, 
          reflectionText: reflectionText.trim() 
        }),
      });

      if (response.ok) {
        setReflectionSaved(true);
        // Refresh the page to show updated reflection
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        console.error('Failed to save reflection');
      }
    } catch (error) {
      console.error('Error saving reflection:', error);
    } finally {
      setIsSavingReflection(false);
    }
  };

  if (isGenerateButton) {
    return (
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <Select aria-labelledby="length-label" disabled={isLoading} value={planLength} onChange={(e) => setPlanLength(Number(e.target.value) as 3|5|7)} label="Plan length">
          <option value={3}>3 days</option>
          <option value={5}>5 days</option>
          <option value={7}>7 days</option>
        </Select>
        {/* Mode removed per Phase 4 polish; defaults to working behavior */}
        <Button 
          onClick={handleGeneratePlan}
          disabled={isLoading}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Plan...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              Generate My Recovery Plan
            </>
          )}
        </Button>
      </div>
    );
  }

  if (isRegenerateButton) {
    return (
      <div className="flex items-center gap-3">
        <Select aria-labelledby="length-label" disabled={isLoading} value={planLength} onChange={(e) => setPlanLength(Number(e.target.value) as 3|5|7)} label="Plan length">
          <option value={3}>3 days</option>
          <option value={5}>5 days</option>
          <option value={7}>7 days</option>
        </Select>
        <Button 
          onClick={handleGeneratePlan}
          disabled={isLoading}
          variant="outline"
          className="border-green-600 text-green-600 hover:bg-green-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate Plan
            </>
          )}
        </Button>
      </div>
    );
  }

  // Mark complete button for today's task
  if (taskId) {
    return (
      <Button 
        onClick={handleMarkComplete}
        disabled={isLoading || isCompleted}
        className={`
          transition-all duration-200
          ${isCompleted 
            ? 'bg-green-600 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
        `}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : isCompleted ? (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Completed!
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark as Done
          </>
        )}
      </Button>
    );
  }

  // Reflection input component
  if (reflectionId) {
    return (
      <div className="space-y-3">
        <textarea
          value={reflectionText}
          onChange={(e) => setReflectionText(e.target.value)}
          placeholder={`Share your thoughts about "${reflectionPrompt}"...`}
          className="w-full p-3 border border-neutral-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          disabled={isSavingReflection || reflectionSaved}
        />
        <Button 
          onClick={handleSaveReflection}
          disabled={isSavingReflection || reflectionSaved || reflectionText.trim() === currentReflection}
          size="sm"
          className={`
            transition-all duration-200
            ${reflectionSaved 
              ? 'bg-green-600 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          {isSavingReflection ? (
            <>
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              Saving...
            </>
          ) : reflectionSaved ? (
            <>
              <CheckCircle2 className="w-3 h-3 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-3 h-3 mr-2" />
              Save Reflection
            </>
          )}
        </Button>
      </div>
    );
  }

  return null;
}