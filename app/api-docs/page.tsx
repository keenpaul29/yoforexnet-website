import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Lock, Code, Zap, Shield, Globe } from 'lucide-react';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'YoForex API Documentation - Trading Platform API',
    description: 'Complete API documentation for YoForex trading platform. Access forum threads, marketplace content, user data, broker information, and more via our public REST API.',
    openGraph: {
      title: 'YoForex API Documentation - Trading Platform API',
      description: 'Public API endpoints for accessing YoForex trading community data, forum threads, and marketplace content.',
      type: 'website',
      url: '/api-docs',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'YoForex API Documentation',
      description: 'Complete REST API documentation for YoForex trading platform',
    },
  };
}

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  public: boolean;
  params?: string[];
  category: string;
}

export default function APIDocsPage() {
  const endpoints: Endpoint[] = [
    // Forum Endpoints
    {
      method: "GET",
      path: "/api/threads",
      description: "Get all forum threads with optional filters (category, sort, limit)",
      public: true,
      params: ["limit", "categorySlug", "sort"],
      category: "Forum"
    },
    {
      method: "GET",
      path: "/api/threads/:slug",
      description: "Get a single thread by slug including replies and author info",
      public: true,
      params: [],
      category: "Forum"
    },
    {
      method: "POST",
      path: "/api/threads",
      description: "Create a new forum thread (requires authentication)",
      public: false,
      params: [],
      category: "Forum"
    },
    {
      method: "GET",
      path: "/api/categories",
      description: "Get all forum categories with thread counts",
      public: true,
      params: [],
      category: "Forum"
    },
    {
      method: "POST",
      path: "/api/replies",
      description: "Post a reply to a thread (requires authentication)",
      public: false,
      params: [],
      category: "Forum"
    },
    // Marketplace Endpoints
    {
      method: "GET",
      path: "/api/content",
      description: "Get marketplace content with filters (type, platform, limit)",
      public: true,
      params: ["type", "platform", "limit", "sort"],
      category: "Marketplace"
    },
    {
      method: "GET",
      path: "/api/content/:slug",
      description: "Get detailed information about a specific marketplace item",
      public: true,
      params: [],
      category: "Marketplace"
    },
    {
      method: "POST",
      path: "/api/content",
      description: "Publish new marketplace content (requires authentication)",
      public: false,
      params: [],
      category: "Marketplace"
    },
    {
      method: "POST",
      path: "/api/purchases",
      description: "Purchase content with gold coins (requires authentication)",
      public: false,
      params: [],
      category: "Marketplace"
    },
    // User Endpoints
    {
      method: "GET",
      path: "/api/users",
      description: "Get list of users with pagination and filters",
      public: true,
      params: ["limit", "sort"],
      category: "User"
    },
    {
      method: "GET",
      path: "/api/me",
      description: "Get authenticated user's profile and stats",
      public: false,
      params: [],
      category: "User"
    },
    {
      method: "GET",
      path: "/api/users/:username",
      description: "Get public profile of a specific user",
      public: true,
      params: [],
      category: "User"
    },
    {
      method: "GET",
      path: "/api/leaderboard",
      description: "Get top contributors leaderboard",
      public: true,
      params: [],
      category: "User"
    },
    // Broker Endpoints
    {
      method: "GET",
      path: "/api/brokers",
      description: "Get list of brokers with ratings and filters",
      public: true,
      params: ["regulation", "minDeposit", "sort"],
      category: "Broker"
    },
    {
      method: "GET",
      path: "/api/brokers/:slug",
      description: "Get detailed broker information and reviews",
      public: true,
      params: [],
      category: "Broker"
    },
    {
      method: "POST",
      path: "/api/brokers/:slug/reviews",
      description: "Submit a broker review (requires authentication)",
      public: false,
      params: [],
      category: "Broker"
    },
    // Stats Endpoints
    {
      method: "GET",
      path: "/api/stats",
      description: "Get platform statistics (threads, users, content)",
      public: true,
      params: [],
      category: "Stats"
    },
    {
      method: "GET",
      path: "/api/threads/hot",
      description: "Get trending/hot threads based on engagement",
      public: true,
      params: [],
      category: "Stats"
    }
  ];

  const categories = Array.from(new Set(endpoints.map(e => e.category)));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'YoForex API Documentation',
    description: 'Complete API documentation for YoForex trading platform with public REST endpoints',
    url: '/api-docs',
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
          <Card className="mb-8" data-testid="card-hero">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl" data-testid="heading-main">API Documentation</CardTitle>
              </div>
              <CardDescription className="text-base" data-testid="text-intro">
                Public API endpoints for accessing YoForex data. Build integrations, analyze trends, 
                or create custom tools using our REST API. Authentication required for write operations.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Quick Info */}
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card data-testid="card-base-url">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Base URL</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <code className="bg-muted px-3 py-2 rounded text-sm block overflow-x-auto" data-testid="text-base-url">
                  {process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000'}
                </code>
              </CardContent>
            </Card>

            <Card data-testid="card-authentication">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-chart-3" />
                  <CardTitle className="text-lg">Authentication</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground" data-testid="text-auth-info">
                  Protected endpoints require session-based authentication. 
                  Public endpoints are accessible without auth.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-rate-limits">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-chart-4" />
                  <CardTitle className="text-lg">Rate Limits</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1" data-testid="list-rate-limits">
                  <li>• General: 100 req/15min</li>
                  <li>• Write Ops: 30 req/15min</li>
                  <li>• Content: 5 posts/hour</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Endpoints by Category */}
          {categories.map((category, catIndex) => (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-semibold mb-4" data-testid={`heading-category-${catIndex}`}>
                {category} Endpoints
              </h2>
              <div className="space-y-4">
                {endpoints
                  .filter(e => e.category === category)
                  .map((endpoint, i) => (
                    <Card key={i} className="hover-elevate" data-testid={`card-endpoint-${catIndex}-${i}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant={endpoint.method === "GET" ? "default" : "secondary"}
                              className="font-mono"
                              data-testid={`badge-method-${catIndex}-${i}`}
                            >
                              {endpoint.method}
                            </Badge>
                            <code className="text-sm" data-testid={`text-path-${catIndex}-${i}`}>
                              {endpoint.path}
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            {endpoint.public ? (
                              <Badge variant="outline" className="text-chart-3" data-testid={`badge-access-${catIndex}-${i}`}>
                                <Code className="w-3 h-3 mr-1" />
                                Public
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-chart-4" data-testid={`badge-access-${catIndex}-${i}`}>
                                <Lock className="w-3 h-3 mr-1" />
                                Protected
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription className="mt-2" data-testid={`text-description-${catIndex}-${i}`}>
                          {endpoint.description}
                        </CardDescription>
                      </CardHeader>
                      
                      {endpoint.params && endpoint.params.length > 0 && (
                        <CardContent>
                          <p className="text-sm font-semibold mb-2">Query Parameters:</p>
                          <div className="flex flex-wrap gap-2">
                            {endpoint.params.map((param, j) => (
                              <code key={j} className="bg-muted px-2 py-1 rounded text-xs" data-testid={`badge-param-${catIndex}-${i}-${j}`}>
                                {param}
                              </code>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
              </div>
            </div>
          ))}

          {/* Response Format Example */}
          <Card className="mt-8" data-testid="card-response-format">
            <CardHeader>
              <CardTitle>Response Format</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                All API responses follow a consistent JSON format:
              </p>
              <pre className="bg-muted p-4 rounded text-xs overflow-x-auto" data-testid="code-response-example">
{`{
  "success": true,
  "data": { ... },
  "timestamp": "2025-10-27T09:00:00Z"
}`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </>
  );
}
