"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, X, ChevronRight } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

type OnboardingProgress = {
  completed: boolean;
  dismissed: boolean;
  progress: {
    profileCreated: boolean;
    firstReply: boolean;
    firstReport: boolean;
    firstUpload: boolean;
    socialLinked: boolean;
  };
};

const ONBOARDING_TASKS = [
  { key: 'profileCreated', label: 'Complete your profile', coins: 10, link: '/settings' },
  { key: 'firstReply', label: 'Post your first reply', coins: 15, link: '/forum' },
  { key: 'firstReport', label: 'Submit your first review', coins: 20, link: '/marketplace' },
  { key: 'firstUpload', label: 'Upload your first EA', coins: 50, link: '/publish' },
  { key: 'socialLinked', label: 'Link a social account', coins: 30, link: '/settings' },
];

export function OnboardingChecklist() {
  const { data, isLoading } = useQuery<OnboardingProgress>({
    queryKey: ['/api/me/onboarding'],
  });

  const dismiss = useMutation({
    mutationFn: () => apiRequest('/api/me/onboarding/dismiss', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me/onboarding'] });
    },
  });

  if (isLoading || !data || data.dismissed || data.completed) {
    return null;
  }

  const completedCount = Object.values(data.progress).filter(Boolean).length;
  const totalCount = Object.keys(data.progress).length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <Card className="mb-6" data-testid="card-onboarding">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Get Started</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dismiss.mutate()}
            data-testid="button-dismiss-onboarding"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete these tasks to earn coins and unlock features
        </p>
      </CardHeader>
      <CardContent>
        <Progress value={progressPercent} className="mb-4" data-testid="progress-onboarding" />
        
        <div className="space-y-2">
          {ONBOARDING_TASKS.map(task => {
            const isComplete = data.progress[task.key as keyof typeof data.progress];
            return (
              <Link
                key={task.key}
                href={task.link}
                className={`flex items-center justify-between p-3 rounded-md transition-all ${
                  isComplete 
                    ? 'bg-muted/50 cursor-default' 
                    : 'hover-elevate active-elevate-2 cursor-pointer'
                }`}
                data-testid={`task-${task.key}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" data-testid={`icon-complete-${task.key}`} />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground shrink-0" data-testid={`icon-incomplete-${task.key}`} />
                  )}
                  <span className={isComplete ? 'text-muted-foreground line-through' : ''}>
                    {task.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium text-yellow-600" data-testid={`coins-${task.key}`}>
                    +{task.coins} coins
                  </span>
                  {!isComplete && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
