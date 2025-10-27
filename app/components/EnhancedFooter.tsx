"use client";

import { Activity, Wifi, Code } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface StatsResponse {
  forumThreads: number;
  communityMembers: number;
  totalReplies: number;
  activeToday: number;
  lastUpdated: string;
}

export default function EnhancedFooter() {
  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ['/api/stats'],
    refetchInterval: 60000, // Update every 60 seconds
    staleTime: 50000,
  });

  const version = "v1.2.3";
  const serverStatus = "stable";
  
  const getStatusText = () => {
    if (serverStatus === "stable") return { text: "✓ Stable", color: "text-chart-3" };
    if (serverStatus === "degraded") return { text: "⚠ Degraded", color: "text-chart-4" };
    return { text: "✗ Down", color: "text-destructive" };
  };

  const status = getStatusText();
  const onlineUsers = stats?.activeToday ?? 0;

  return (
    <footer className="border-t py-8 mt-16 bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div>
            <h4 className="font-semibold mb-3 text-sm">About YoForex</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Professional EA forum for algorithmic trading. Share strategies, EAs, and earn gold coins for quality contributions.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground" data-testid="link-terms">Terms</a>
              <a href="#" className="hover:text-foreground" data-testid="link-privacy">Privacy</a>
              <a href="#" className="hover:text-foreground" data-testid="link-guidelines">Guidelines</a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-sm">Community</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a 
                href="https://t.me/+AIByvTkkIwM3MjFl" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block hover:text-foreground" 
                data-testid="link-telegram"
              >
                Join Our Telegram
              </a>
              <Link href="/feedback" className="block hover:text-foreground" data-testid="link-feedback">
                Submit Feedback
              </Link>
              <Link href="/api-docs" className="block hover:text-foreground" data-testid="link-api">
                API Documentation
              </Link>
              <Link href="/support" className="block hover:text-foreground" data-testid="link-support">
                Contact Support
              </Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 text-sm">Live Stats</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-chart-3" />
                <span className="text-muted-foreground">Active Today:</span>
                <span className="font-semibold" data-testid="text-online-users">{onlineUsers}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Wifi className="h-4 w-4 text-chart-3" />
                <span className="text-muted-foreground">Server Status:</span>
                <span className={`font-semibold ${status.color}`} data-testid="text-server-status">
                  {status.text}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Code className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Latest Build:</span>
                <span className="font-mono text-xs" data-testid="text-version">{version}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-6 border-t text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 YoForex. All rights reserved. Made for Traders.
          </p>
        </div>
      </div>
    </footer>
  );
}
