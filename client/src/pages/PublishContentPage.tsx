import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  FileText,
  Upload,
  Sparkles,
  Info,
  CheckCircle2,
  Coins
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const publishSchema = z.object({
  type: z.enum(["ea", "indicator", "article", "source_code"]),
  title: z.string().min(10, "Title must be at least 10 characters").max(200),
  description: z.string().min(50, "Description must be at least 50 characters").max(500),
  body: z.string().min(100, "Content must be at least 100 characters"),
  priceCoins: z.number().min(0).max(10000),
  isFree: z.boolean(),
  tags: z.string(),
  fileUrl: z.string().optional(),
  images: z.array(z.string()).optional()
});

type PublishFormData = z.infer<typeof publishSchema>;

export default function PublishContentPage() {
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  const form = useForm<PublishFormData>({
    resolver: zodResolver(publishSchema),
    defaultValues: {
      type: "ea",
      title: "",
      description: "",
      body: "",
      priceCoins: 500,
      isFree: false,
      tags: "",
      images: []
    }
  });

  const publishMutation = useMutation({
    mutationFn: async (data: PublishFormData) => {
      return await apiRequest("POST", "/api/content", data);
    },
    onSuccess: () => {
      toast({
        title: "Content Published Successfully!",
        description: "Your content is now live. SEO metadata has been automatically generated.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Publishing Failed",
        description: error.message
      });
    }
  });

  const onSubmit = (data: PublishFormData) => {
    publishMutation.mutate(data);
  };

  const isFree = form.watch("isFree");

  return (
    <div className="min-h-screen bg-background">
      <Header userCoins={2450} />
      
      <main className="container max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Publish Content</h1>
          <p className="text-lg text-muted-foreground">
            Share your Expert Advisors, Indicators, or Trading Knowledge
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Content Details</CardTitle>
                    <CardDescription>
                      Fill in the details below. We'll handle all SEO optimization automatically!
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Auto SEO
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-content-type">
                                <SelectValue placeholder="Select content type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ea">Expert Advisor (EA)</SelectItem>
                              <SelectItem value="indicator">Indicator</SelectItem>
                              <SelectItem value="article">Article / Guide</SelectItem>
                              <SelectItem value="source_code">Source Code</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Gold Scalper EA Pro - MT5 XAUUSD Strategy"
                              {...field}
                              data-testid="input-title"
                            />
                          </FormControl>
                          <FormDescription>
                            Make it descriptive. We'll extract keywords automatically for SEO.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief overview of what your content offers..."
                              className="min-h-[100px]"
                              {...field}
                              data-testid="textarea-description"
                            />
                          </FormControl>
                          <FormDescription>
                            This will be used for previews and meta descriptions.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="body"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Detailed information about your content. Include features, setup instructions, performance data, etc..."
                              className="min-h-[300px] font-mono text-sm"
                              {...field}
                              data-testid="textarea-body"
                            />
                          </FormControl>
                          <FormDescription>
                            Write in plain text. You can use basic HTML if needed.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="MT5, XAUUSD, Scalping, Gold, No DLL"
                              {...field}
                              data-testid="input-tags"
                            />
                          </FormControl>
                          <FormDescription>
                            Comma-separated tags to help users find your content.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isFree"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pricing</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(value === "true")}
                              defaultValue={field.value ? "true" : "false"}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-pricing">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="true">Free</SelectItem>
                                <SelectItem value="false">Paid</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priceCoins"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (Gold Coins)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                max="10000"
                                disabled={isFree}
                                value={field.value}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-price"
                              />
                            </FormControl>
                            <FormDescription>
                              1-10,000 coins (disabled if free)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="border-t pt-6 flex gap-3">
                      <Button 
                        type="submit" 
                        size="lg"
                        disabled={publishMutation.isPending}
                        data-testid="button-publish"
                      >
                        {publishMutation.isPending ? (
                          <>
                            <Upload className="w-4 h-4 mr-2 animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Publish Content
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="lg"
                        onClick={() => setPreviewMode(!previewMode)}
                        data-testid="button-preview"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Invisible SEO Engine
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Auto Focus Keywords</p>
                      <p className="text-xs text-muted-foreground">
                        Extracted from your title automatically
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Meta Description</p>
                      <p className="text-xs text-muted-foreground">
                        First 155 characters from your content
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Smart Image Alt Text</p>
                      <p className="text-xs text-muted-foreground">
                        Unique descriptions for each image
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">SEO-Friendly URL</p>
                      <p className="text-xs text-muted-foreground">
                        Generated from your title with collision handling
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Schema.org Markup</p>
                      <p className="text-xs text-muted-foreground">
                        Structured data for better search visibility
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Publishing Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    • Use descriptive titles with key trading terms
                  </p>
                  <p className="text-muted-foreground">
                    • Include performance data and features
                  </p>
                  <p className="text-muted-foreground">
                    • Add relevant tags for better discoverability
                  </p>
                  <p className="text-muted-foreground">
                    • Free content gets more downloads initially
                  </p>
                  <p className="text-muted-foreground">
                    • Premium content builds long-term revenue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-600" />
                    Earnings Estimate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Your Price</span>
                      <span className="font-bold text-lg">
                        {form.watch("priceCoins")} coins
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Platform Fee (15%)</span>
                      <span className="text-red-600">
                        -{Math.round(form.watch("priceCoins") * 0.15)} coins
                      </span>
                    </div>
                    <div className="border-t pt-2 flex items-center justify-between">
                      <span className="font-medium">You Earn Per Sale</span>
                      <span className="font-bold text-green-600 text-lg">
                        {Math.round(form.watch("priceCoins") * 0.85)} coins
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <EnhancedFooter />
    </div>
  );
}
