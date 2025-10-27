import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  FileText, 
  MessageSquare, 
  Flag,
  Gift,
  TrendingUp,
  Award,
  Code,
  Coins,
  ShoppingCart,
  Sparkles
} from 'lucide-react';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'How to Earn Coins on YoForex - YoForex Coin System',
    description: 'Discover multiple ways to earn gold coins on YoForex by publishing EAs, helping the community, sharing strategies, and contributing quality content. Join our reward system today.',
    openGraph: {
      title: 'How to Earn Coins on YoForex - YoForex Coin System',
      description: 'Earn gold coins by publishing EAs, helping traders, and sharing expertise on YoForex trading platform.',
      type: 'website',
      url: '/earn-coins',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'How to Earn Coins on YoForex',
      description: 'Multiple ways to earn rewards by contributing to the YoForex community',
    },
  };
}

interface EarnMethod {
  title: string;
  description: string;
  coinsRange: string;
  icon: any;
  color: string;
  action: string;
  actionLink: string;
}

export default function EarnCoinsPage() {
  const earnMethods: EarnMethod[] = [
    {
      title: "Publish EA/Indicator",
      description: "Upload quality EAs or indicators and set a gold coin price. Earn coins when others download your work.",
      coinsRange: "10-100 coins per download",
      icon: Upload,
      color: "bg-primary",
      action: "Upload EA",
      actionLink: "/publish"
    },
    {
      title: "Share Set Files",
      description: "Publish optimized .set configuration files for popular EAs. Help traders get started quickly.",
      coinsRange: "5-30 coins per download",
      icon: Code,
      color: "bg-chart-2",
      action: "Share Set File",
      actionLink: "/publish"
    },
    {
      title: "Write Quality Articles",
      description: "Create tutorials, strategies, or EA reviews. Set as paid content and earn when others view.",
      coinsRange: "20-200 coins per article",
      icon: FileText,
      color: "bg-chart-3",
      action: "Write Article",
      actionLink: "/publish"
    },
    {
      title: "Help Community",
      description: "Answer questions, provide solutions, and mark helpful replies. Earn coins for accepted solutions.",
      coinsRange: "5-50 coins per solution",
      icon: MessageSquare,
      color: "bg-chart-4",
      action: "Browse Questions",
      actionLink: "/discussions"
    },
    {
      title: "Share Backtest Reports",
      description: "Post detailed performance reports with verified data. Premium reports earn more coins.",
      coinsRange: "15-75 coins per report",
      icon: TrendingUp,
      color: "bg-chart-1",
      action: "Share Report",
      actionLink: "/publish"
    },
    {
      title: "Report Violations",
      description: "Help keep the community safe by reporting spam, scams, or malicious marketing. First reporter gets rewarded.",
      coinsRange: "1-100 coins per report",
      icon: Flag,
      color: "bg-chart-5",
      action: "Report Issue",
      actionLink: "/discussions"
    },
    {
      title: "Daily Activity Bonus",
      description: "Log in daily, participate in discussions, and maintain activity streaks to earn bonus coins.",
      coinsRange: "1-10 coins daily",
      icon: Award,
      color: "bg-primary",
      action: "View Missions",
      actionLink: `${process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000'}/dashboard`
    },
    {
      title: "Referral Program",
      description: "Invite traders to join YoForex. Earn coins when your referrals are active and contribute.",
      coinsRange: "10-50 coins per referral",
      icon: Gift,
      color: "bg-chart-2",
      action: "Get Referral Link",
      actionLink: `${process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000'}/dashboard`
    }
  ];

  const spendingOptions = [
    {
      title: "Download Premium EAs",
      description: "Access exclusive trading robots and indicators from top developers",
      icon: Upload
    },
    {
      title: "Unlock Pro Content",
      description: "View premium strategies, tutorials, and trading guides",
      icon: FileText
    },
    {
      title: "Boost Your Posts",
      description: "Promote your content to reach more traders",
      icon: TrendingUp
    }
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Earn Coins on YoForex',
    description: 'Multiple ways to earn gold coins on YoForex by contributing quality content and helping the community',
    url: '/earn-coins',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      
      <main className="min-h-screen bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12" data-testid="section-hero">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 rounded-full p-4">
                <Coins className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4" data-testid="heading-main">
              Earn Gold Coins on YoForex
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6" data-testid="text-description">
              Multiple ways to earn coins by contributing quality content and helping the community grow. 
              Turn your expertise into rewards!
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a href={`${process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000'}/dashboard`}>
                <Button size="lg" data-testid="button-start-earning">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Earning Now
                </Button>
              </a>
              <a href="/marketplace">
                <Button variant="outline" size="lg" data-testid="button-browse-marketplace">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Browse Marketplace
                </Button>
              </a>
            </div>
          </div>

          {/* Ways to Earn Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6" data-testid="heading-ways-to-earn">
              Ways to Earn Coins
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {earnMethods.map((method, index) => (
                <Card key={index} className="hover-elevate" data-testid={`card-earn-method-${index}`}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`${method.color} rounded-lg p-3 flex-shrink-0`}>
                        <method.icon className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1" data-testid={`text-method-title-${index}`}>
                          {method.title}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs" data-testid={`badge-coins-${index}`}>
                          {method.coinsRange}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4" data-testid={`text-method-description-${index}`}>
                      {method.description}
                    </p>
                    <a href={method.actionLink}>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        data-testid={`button-${method.action.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {method.action}
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Spending Coins Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6" data-testid="heading-spending-coins">
              What Can You Do With Coins?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {spendingOptions.map((option, index) => (
                <Card key={index} className="hover-elevate" data-testid={`card-spending-${index}`}>
                  <CardHeader>
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="bg-primary/10 rounded-full p-4">
                        <option.icon className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg" data-testid={`text-spending-title-${index}`}>
                        {option.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center" data-testid={`text-spending-description-${index}`}>
                      {option.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Pro Tip Section */}
          <Card className="border-primary/50 bg-primary/5" data-testid="card-pro-tip">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Gift className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2" data-testid="text-pro-tip-heading">
                    Pro Tip: Quality Over Quantity
                  </h3>
                  <p className="text-sm text-muted-foreground" data-testid="text-pro-tip-description">
                    High-quality contributions earn more coins and build your reputation. Focus on sharing well-tested EAs, 
                    detailed backtests, and helpful tutorials. The community rewards valuable content with more downloads and upvotes!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </>
  );
}
