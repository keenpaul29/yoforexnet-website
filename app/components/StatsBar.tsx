"use client";

import { MessageSquare, Users, MessagesSquare, Activity } from "lucide-react";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";

interface StatsData {
  totalThreads: number;
  totalMembers: number;
  totalPosts: number;
  todayActivity: {
    threads: number;
    content: number;
  };
}

export default function StatsBar() {
  // Auto-refresh stats every 30 seconds
  const { data, isLoading } = useRealtimeUpdates<StatsData>('/api/stats', { interval: 30000 });

  const stats = [
    { 
      label: "Forum Threads", 
      value: data?.totalThreads?.toLocaleString() || "0", 
      icon: MessageSquare, 
      key: "threads" 
    },
    { 
      label: "Community Members", 
      value: data?.totalMembers?.toLocaleString() || "0", 
      icon: Users, 
      key: "members" 
    },
    { 
      label: "Total Replies", 
      value: data?.totalPosts?.toLocaleString() || "0", 
      icon: MessagesSquare, 
      key: "replies" 
    },
    { 
      label: "Active Today", 
      value: data?.todayActivity?.threads ? `+${data.todayActivity.threads}` : "+0", 
      icon: Activity, 
      key: "activity" 
    }
  ];

  if (isLoading && !data) {
    return (
      <div className="border-y bg-muted/30">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="bg-muted rounded-lg h-11 w-11" />
                <div className="space-y-2">
                  <div className="h-8 w-20 bg-muted rounded" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-y bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div key={stat.key} className="flex items-center gap-3">
              <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-2.5">
                <stat.icon className="h-5 w-5 text-primary dark:text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid={`text-stat-${stat.key}`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
