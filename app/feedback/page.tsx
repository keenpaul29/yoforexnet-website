'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'other'], {
    required_error: 'Please select a feedback type',
  }),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100),
  message: z.string().min(20, 'Message must be at least 20 characters').max(2000),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

export default function FeedbackPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: undefined,
      subject: '',
      message: '',
      email: '',
    },
  });

  const onSubmit = async (data: FeedbackForm) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const expressUrl = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
      const response = await fetch(`${expressUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
      form.reset();
    } catch (err) {
      setError('Failed to submit feedback. Please try again or contact us on Telegram.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-background">
        <div className="container max-w-3xl mx-auto px-4 py-12">
          <Card data-testid="card-feedback-form">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl" data-testid="heading-main">Submit Feedback</CardTitle>
              </div>
              <CardDescription className="text-base" data-testid="text-intro">
                Help us improve YoForex by sharing your thoughts, reporting bugs, or suggesting new features. 
                Your feedback shapes the future of our platform.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {submitted ? (
                <div className="text-center py-12" data-testid="section-success">
                  <CheckCircle2 className="h-16 w-16 text-chart-3 mx-auto mb-4" data-testid="icon-success" />
                  <h3 className="text-2xl font-semibold mb-2" data-testid="text-success-heading">Thank You!</h3>
                  <p className="text-muted-foreground mb-6" data-testid="text-success-message">
                    Your feedback has been submitted successfully. We'll review it and get back to you if needed.
                  </p>
                  <Button 
                    onClick={() => setSubmitted(false)} 
                    data-testid="button-submit-more"
                  >
                    Submit More Feedback
                  </Button>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-6 p-4 border border-destructive/50 bg-destructive/10 rounded-md flex items-start gap-3" data-testid="alert-error">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive" data-testid="text-error-message">{error}</p>
                    </div>
                  )}

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Feedback Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-feedback-type">
                                  <SelectValue placeholder="Select feedback type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bug" data-testid="option-bug">Bug Report</SelectItem>
                                <SelectItem value="feature" data-testid="option-feature">Feature Request</SelectItem>
                                <SelectItem value="improvement" data-testid="option-improvement">Improvement Suggestion</SelectItem>
                                <SelectItem value="other" data-testid="option-other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Brief summary of your feedback"
                                data-testid="input-subject"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your feedback in detail..."
                                className="min-h-[200px]"
                                data-testid="input-message"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="your@email.com"
                                data-testid="input-email"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                        data-testid="button-submit-feedback"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                      </Button>
                    </form>
                  </Form>
                </>
              )}
            </CardContent>
          </Card>

          {/* Help Section */}
          {!submitted && (
            <Card className="mt-6 border-primary/50 bg-primary/5" data-testid="card-help">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2" data-testid="text-help-heading">Need Immediate Help?</h3>
                <p className="text-sm text-muted-foreground mb-4" data-testid="text-help-description">
                  For urgent issues or quick questions, join our Telegram community for instant support from 
                  thousands of traders and the YoForex team.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <a 
                    href="https://t.me/+AIByvTkkIwM3MjFl" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    data-testid="link-telegram"
                  >
                    <Button variant="outline" size="sm" data-testid="button-telegram">
                      Join Telegram
                    </Button>
                  </a>
                  <a href="/support" data-testid="link-support">
                    <Button variant="outline" size="sm" data-testid="button-support">
                      Visit Support
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
