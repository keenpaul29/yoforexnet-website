'use client';

import { Header } from "@/components/Header";
import { EnhancedFooter } from "@/components/EnhancedFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, HelpCircle } from "lucide-react";

export default function ContactSupportClient() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <HelpCircle className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">Contact Support</CardTitle>
            </div>
            <CardDescription>
              Get help from our community and support team
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover-elevate active-elevate-2">
            <CardHeader>
              <MessageCircle className="h-12 w-12 text-primary mb-3" />
              <CardTitle>Join Our Telegram Community</CardTitle>
              <CardDescription>
                Get instant help from thousands of traders and the YoForex team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>• Instant responses from community members</li>
                <li>• Direct support from YoForex team</li>
                <li>• Trading discussions and tips</li>
                <li>• Platform updates and announcements</li>
              </ul>
              <a 
                href="https://t.me/+AIByvTkkIwM3MjFl" 
                target="_blank" 
                rel="noopener noreferrer"
                data-testid="link-telegram-external"
              >
                <Button className="w-full" data-testid="button-join-telegram">
                  <Send className="w-4 h-4 mr-2" />
                  Join Telegram Group
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="hover-elevate active-elevate-2">
            <CardHeader>
              <MessageCircle className="h-12 w-12 text-chart-3 mb-3" />
              <CardTitle>Community Forum</CardTitle>
              <CardDescription>
                Search existing threads or create a new support topic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>• Browse thousands of resolved issues</li>
                <li>• Get help from experienced traders</li>
                <li>• Contribute solutions and earn coins</li>
                <li>• Detailed troubleshooting guides</li>
              </ul>
              <a href="/category/technical-support" data-testid="link-support-forum">
                <Button variant="outline" className="w-full" data-testid="button-visit-forum">
                  Visit Support Forum
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">How do I report a bug?</h4>
                <p className="text-sm text-muted-foreground">
                  Use our <a href="/feedback" className="text-primary hover:underline" data-testid="link-feedback-faq">feedback form</a> to report bugs with detailed steps to reproduce.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">How do I earn gold coins?</h4>
                <p className="text-sm text-muted-foreground">
                  Visit the <a href="/earn-coins" className="text-primary hover:underline" data-testid="link-earn-coins-faq">Earn Coins</a> page to learn about all the ways to earn rewards on YoForex.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Where can I find API documentation?</h4>
                <p className="text-sm text-muted-foreground">
                  Check out our <a href="/api-docs" className="text-primary hover:underline" data-testid="link-api-docs-faq">API Documentation</a> for public endpoints and integration guides.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">How do I become a verified contributor?</h4>
                <p className="text-sm text-muted-foreground">
                  Build your reputation by posting quality content, helping others, and contributing valuable EAs. Your trust level will automatically increase.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <EnhancedFooter />
    </div>
  );
}
