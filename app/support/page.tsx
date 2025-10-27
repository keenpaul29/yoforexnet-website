import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Send, HelpCircle, Mail, Clock, MessageSquarePlus } from 'lucide-react';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'YoForex Support - Contact Us',
    description: 'Get help from the YoForex community and support team. Join our Telegram group for instant help, browse the community forum, or check our FAQ for common questions.',
    openGraph: {
      title: 'YoForex Support - Contact Us',
      description: 'Get instant support from our trading community on Telegram or browse our comprehensive FAQ and forum.',
      type: 'website',
      url: '/support',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'YoForex Support',
      description: 'Get help from our community and support team',
    },
  };
}

export default function SupportPage() {
  const faqs = [
    {
      question: "How do I report a bug?",
      answer: "Use our feedback form to report bugs with detailed steps to reproduce. Include your browser, operating system, and any error messages you see.",
      link: "/feedback",
      linkText: "Submit Bug Report"
    },
    {
      question: "How do I earn gold coins?",
      answer: "Visit the Earn Coins page to learn about all the ways to earn rewards on YoForex by publishing content, helping others, and contributing to the community.",
      link: "/earn-coins",
      linkText: "Learn More"
    },
    {
      question: "Where can I find API documentation?",
      answer: "Check out our API Documentation for public endpoints, authentication methods, and integration guides with code examples.",
      link: "/api-docs",
      linkText: "View API Docs"
    },
    {
      question: "How do I become a verified contributor?",
      answer: "Build your reputation by posting quality content, helping others with technical questions, and contributing valuable EAs. Your trust level will automatically increase based on community engagement.",
      link: "/leaderboard",
      linkText: "View Leaderboard"
    },
    {
      question: "Can I withdraw my gold coins?",
      answer: "Gold coins are used within the YoForex platform to access premium content, download EAs, and unlock exclusive features. They cannot be withdrawn for cash.",
      link: "/earn-coins",
      linkText: "About Coins"
    },
    {
      question: "How do I upload an EA or indicator?",
      answer: "Click the 'Publish EA' button in the header navigation. You'll need to provide details about your EA, upload the file, and set a price in gold coins.",
      link: `${process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000'}/publish`,
      linkText: "Publish Now"
    }
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: 'YoForex Support',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <main className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <Card className="mb-8" data-testid="card-hero">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <HelpCircle className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl" data-testid="heading-main">Contact Support</CardTitle>
              </div>
              <CardDescription className="text-base" data-testid="text-intro">
                Get help from our community and support team. We're here to help you succeed with YoForex.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Support Channels */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <Card className="hover-elevate active-elevate-2" data-testid="card-telegram">
              <CardHeader>
                <Send className="h-12 w-12 text-primary mb-3" />
                <CardTitle data-testid="heading-telegram">Join Our Telegram Community</CardTitle>
                <CardDescription data-testid="text-telegram-description">
                  Get instant help from thousands of traders and the YoForex team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6" data-testid="list-telegram-benefits">
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

            <Card className="hover-elevate active-elevate-2" data-testid="card-forum">
              <CardHeader>
                <MessageCircle className="h-12 w-12 text-chart-3 mb-3" />
                <CardTitle data-testid="heading-forum">Community Forum</CardTitle>
                <CardDescription data-testid="text-forum-description">
                  Search existing threads or create a new support topic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6" data-testid="list-forum-benefits">
                  <li>• Browse thousands of resolved issues</li>
                  <li>• Get help from experienced traders</li>
                  <li>• Contribute solutions and earn coins</li>
                  <li>• Detailed troubleshooting guides</li>
                </ul>
                <a href="/discussions" data-testid="link-support-forum">
                  <Button variant="outline" className="w-full" data-testid="button-visit-forum">
                    <MessageSquarePlus className="w-4 h-4 mr-2" />
                    Visit Support Forum
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Support Info */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card data-testid="card-hours">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Support Hours</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground" data-testid="text-support-hours">
                  Community support available 24/7 on Telegram. Official team support: Mon-Fri, 9AM-6PM GMT
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-response-time">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-5 w-5 text-chart-3" />
                  <CardTitle className="text-lg">Response Time</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground" data-testid="text-response-time">
                  Telegram: Usually instant. Forum: Within 24 hours. Critical issues are prioritized.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-email">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5 text-chart-4" />
                  <CardTitle className="text-lg">Email Support</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground" data-testid="text-email-support">
                  For sensitive issues, email us at support@yoforex.com (48hr response time)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <Card className="mb-8" data-testid="card-faq">
            <CardHeader>
              <CardTitle className="text-2xl" data-testid="heading-faq">Frequently Asked Questions</CardTitle>
              <CardDescription data-testid="text-faq-description">
                Find quick answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b pb-6 last:border-b-0 last:pb-0" data-testid={`faq-item-${index}`}>
                    <h4 className="font-semibold mb-2" data-testid={`faq-question-${index}`}>
                      {faq.question}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3" data-testid={`faq-answer-${index}`}>
                      {faq.answer}
                    </p>
                    <a 
                      href={faq.link} 
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1" 
                      data-testid={`link-faq-${index}`}
                    >
                      {faq.linkText} →
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Resources */}
          <Card data-testid="card-resources">
            <CardHeader>
              <CardTitle data-testid="heading-resources">Additional Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <a href="/api-docs" data-testid="link-api-docs">
                  <Button variant="outline" className="w-full justify-start">
                    API Documentation
                  </Button>
                </a>
                <a href="/earn-coins" data-testid="link-earn-coins">
                  <Button variant="outline" className="w-full justify-start">
                    How to Earn Coins
                  </Button>
                </a>
                <a href="/feedback" data-testid="link-feedback">
                  <Button variant="outline" className="w-full justify-start">
                    Submit Feedback
                  </Button>
                </a>
                <a href="/leaderboard" data-testid="link-leaderboard">
                  <Button variant="outline" className="w-full justify-start">
                    Community Leaderboard
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </>
  );
}
