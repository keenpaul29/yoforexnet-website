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
  Code,
  CheckCircle
} from "lucide-react";
import { EARNING_REWARDS, DAILY_LIMITS, calculateMonthlyPotential } from "../../shared/coinUtils";

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
      coinsRange: `${EARNING_REWARDS.PUBLISH_EA_INDICATOR} coins reward + sales revenue`,
      icon: Upload,
      color: "bg-primary",
      action: "Upload EA",
      actionLink: "/upload-ea"
    },
    {
      title: "Share Set Files",
      description: "Publish optimized .set configuration files for popular EAs. Help traders get started quickly.",
      coinsRange: `${EARNING_REWARDS.PUBLISH_SET_FILE} coins reward + sales revenue`,
      icon: Code,
      color: "bg-chart-2",
      action: "Share Set File",
      actionLink: "/upload-setfile"
    },
    {
      title: "Write Quality Articles",
      description: "Create tutorials, strategies, or EA reviews. Set as paid content and earn when others view.",
      coinsRange: `${EARNING_REWARDS.PUBLISH_ARTICLE} coins reward + sales revenue`,
      icon: FileText,
      color: "bg-chart-3",
      action: "Write Article",
      actionLink: "/write-article"
    },
    {
      title: "Help Community",
      description: `Answer questions, provide solutions, and mark helpful replies. Earn ${EARNING_REWARDS.HELPFUL_REPLY} coin per helpful reply.`,
      coinsRange: `${EARNING_REWARDS.HELPFUL_REPLY} coin/reply (max ${DAILY_LIMITS.MAX_REPLIES}/day)`,
      icon: MessageSquare,
      color: "bg-chart-4",
      action: "Browse Questions",
      actionLink: "/qa-help"
    },
    {
      title: "Share Backtest Reports",
      description: `Post detailed performance reports with verified data. Earn ${EARNING_REWARDS.SUBMIT_BACKTEST} coins per submission.`,
      coinsRange: `${EARNING_REWARDS.SUBMIT_BACKTEST} coins (max ${DAILY_LIMITS.MAX_BACKTESTS}/day)`,
      icon: TrendingUp,
      color: "bg-chart-1",
      action: "Share Report",
      actionLink: "/performance-reports"
    },
    {
      title: "Report Violations",
      description: `Help keep the community safe by reporting spam, scams, or malicious marketing. Earn ${EARNING_REWARDS.REPORT_VIOLATION} coin per verified report.`,
      coinsRange: `${EARNING_REWARDS.REPORT_VIOLATION} coin/report (max ${DAILY_LIMITS.MAX_REPORTS}/day)`,
      icon: Flag,
      color: "bg-chart-5",
      action: "Report Issue",
      actionLink: "/report"
    },
    {
      title: "Daily Activity Bonus",
      description: `Check in daily to earn ${EARNING_REWARDS.DAILY_CHECKIN} coin. Maintain streaks for bonus rewards!`,
      coinsRange: `${EARNING_REWARDS.DAILY_CHECKIN} coin/day + ${EARNING_REWARDS.WEEKLY_STREAK} at 7 days + ${EARNING_REWARDS.MONTHLY_PERFECT} at 30 days`,
      icon: Award,
      color: "bg-primary",
      action: "Daily Check-in",
      actionLink: "/earn-coins"
    },
    {
      title: "Referral Program",
      description: "Invite traders to join YoForex. Earn coins when your referrals are active and contribute.",
      coinsRange: "Coming soon",
      icon: Gift,
      color: "bg-chart-2",
      action: "Get Referral Link",
      actionLink: "/referrals"
    }
  ];

  const monthlyPotential = calculateMonthlyPotential();

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
