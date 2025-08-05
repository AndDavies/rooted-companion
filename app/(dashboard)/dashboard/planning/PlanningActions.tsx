'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, RefreshCw, Calendar, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlanningActionsProps {
  taskId?: string;
  isGenerateButton?: boolean;
  isRegenerateButton?: boolean;
}

export default function PlanningActions({ 
  taskId, 
  isGenerateButton = false, 
  isRegenerateButton = false 
}: PlanningActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const router = useRouter();

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
      });

      if (response.ok) {
        // Refresh the page to show the new plan
        router.refresh();
      } else {
        console.error('Failed to generate plan');
      }
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isGenerateButton) {
    return (
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
    );
  }

  if (isRegenerateButton) {
    return (
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

  return null;
}