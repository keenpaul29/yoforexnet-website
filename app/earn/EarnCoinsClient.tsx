"use client";

import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  MessageSquare, 
  Flag,
  Gift,
  TrendingUp,
  Award,
  Code
} from "lucide-react";

interface EarnMethod {
  title: string;
  description: string;
  coinsRange: string;
  icon: any;
  color: string;
  action: string;
  actionLink: string;
}

export default function EarnCoinsClient() {
  const earnMethods: EarnMethod[] = [
    {
      title: "Publish EA/Indicator",
      description: "Upload quality EAs or indicators and set a gold coin price. Earn coins when others download your work.",
      coinsRange: "10-100 coins per download",
      icon: Upload,
      color: "bg-primary",
      action: "Upload EA",
      actionLink: "/upload-ea"
    },
    {
      title: "Share Set Files",
      description: "Publish optimized .set configuration files for popular EAs. Help traders get started quickly.",
      coinsRange: "5-30 coins per download",
      icon: Code,
      color: "bg-chart-2",
      action: "Share Set File",
      actionLink: "/upload-setfile"
    },
    {
      title: "Write Quality Articles",
      description: "Create tutorials, strategies, or EA reviews. Set as paid content and earn when others view.",
      coinsRange: "20-200 coins per article",
      icon: FileText,
      color: "bg-chart-3",
      action: "Write Article",
      actionLink: "/write-article"
    },
    {
      title: "Help Community",
      description: "Answer questions, provide solutions, and mark helpful replies. Earn coins for accepted solutions.",
      coinsRange: "5-50 coins per solution",
      icon: MessageSquare,
      color: "bg-chart-4",
      action: "Browse Questions",
      actionLink: "/qa-help"
    },
    {
      title: "Share Backtest Reports",
      description: "Post detailed performance reports with verified data. Premium reports earn more coins.",
      coinsRange: "15-75 coins per report",
      icon: TrendingUp,
      color: "bg-chart-1",
      action: "Share Report",
      actionLink: "/performance-reports"
    },
    {
      title: "Report Violations",
      description: "Help keep the community safe by reporting spam, scams, or malicious marketing. First reporter gets rewarded.",
      coinsRange: "1-100 coins per report",
      icon: Flag,
      color: "bg-chart-5",
      action: "Report Issue",
      actionLink: "/report"
    },
    {
      title: "Daily Activity Bonus",
      description: "Log in daily, participate in discussions, and maintain activity streaks to earn bonus coins.",
      coinsRange: "1-10 coins daily",
      icon: Award,
      color: "bg-primary",
      action: "View Missions",
      actionLink: "/missions"
    },
    {
      title: "Referral Program",
      description: "Invite traders to join YoForex. Earn coins when your referrals are active and contribute.",
      coinsRange: "10-50 coins per referral",
      icon: Gift,
      color: "bg-chart-2",
      action: "Get Referral Link",
      actionLink: "/referrals"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-6xl mx-auto px-4 py-8" data-testid="container-earn-coins">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Earn Gold Coins</h1>
          <p className="text-muted-foreground">
            Multiple ways to earn coins by contributing quality content and helping the community grow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {earnMethods.map((method, index) => (
            <Card key={index} className="hover-elevate" data-testid={`earn-method-${index}`}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`${method.color} rounded-lg p-3 flex-shrink-0`}>
                    <method.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{method.title}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {method.coinsRange}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {method.description}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  data-testid={`button-${method.action.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {method.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Gift className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Pro Tip: Quality Over Quantity</h3>
                <p className="text-sm text-muted-foreground">
                  High-quality contributions earn more coins and build your reputation. Focus on sharing well-tested EAs, 
                  detailed backtests, and helpful tutorials. The community rewards valuable content with more downloads and upvotes!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <EnhancedFooter />
    </div>
  );
}
