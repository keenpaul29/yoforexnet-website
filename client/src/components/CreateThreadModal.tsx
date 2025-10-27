import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

const forumCategories = [
  { slug: "strategy-discussion", name: "Strategy Discussion" },
  { slug: "beginner-questions", name: "Beginner Questions" },
  { slug: "performance-reports", name: "Performance Reports" },
  { slug: "technical-support", name: "Technical Support" },
  { slug: "ea-development", name: "EA Development (MQL4/5)" },
  { slug: "success-stories", name: "Success Stories" },
  { slug: "ea-library", name: "EA Library" },
  { slug: "indicator-library", name: "Indicator Library" },
  { slug: "broker-discussion", name: "Broker Discussion" },
  { slug: "scam-alerts", name: "Scam Alerts" },
  { slug: "vps-hosting", name: "VPS & Hosting" },
  { slug: "trading-psychology", name: "Trading Psychology" },
  { slug: "market-analysis", name: "Market Analysis" },
  { slug: "news-updates", name: "News & Updates" },
  { slug: "off-topic", name: "Off-Topic Lounge" },
  { slug: "commercial-trials", name: "Commercial & Free Trials" },
];

const createThreadSchema = z.object({
  categorySlug: z.string().min(1, "Please select a category"),
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(200, "Title cannot exceed 200 characters"),
  body: z
    .string()
    .min(50, "Content must be at least 50 characters")
    .max(10000, "Content cannot exceed 10,000 characters"),
});

type CreateThreadFormData = z.infer<typeof createThreadSchema>;

interface CreateThreadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateThreadModal({ open, onOpenChange }: CreateThreadModalProps) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateThreadFormData>({
    resolver: zodResolver(createThreadSchema),
    defaultValues: {
      categorySlug: "",
      title: "",
      body: "",
    },
  });

  const selectedCategory = watch("categorySlug");

  const createThreadMutation = useMutation({
    mutationFn: (data: CreateThreadFormData) => {
      if (!user?.id) {
        return Promise.reject(new Error("You must be logged in to create a thread"));
      }
      return apiRequest("POST", "/api/threads", {
        ...data,
        userId: user.id,
      });
    },
    onSuccess: async (response) => {
      const thread = await response.json();
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/categories/${thread.categorySlug}/threads`],
      });

      // Close modal and reset form
      onOpenChange(false);
      reset();

      // Show success toast
      toast({
        title: "Thread created successfully!",
        description: "Redirecting to your new thread...",
      });

      // Navigate to the new thread
      setTimeout(() => {
        setLocation(`/thread/${thread.slug}`);
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create thread",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateThreadFormData) => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "You must be logged in to create a thread",
        variant: "destructive",
      });
      return;
    }
    createThreadMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="modal-create-thread">
        <DialogHeader>
          <DialogTitle>Create New Thread</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={selectedCategory}
              onValueChange={(value) => setValue("categorySlug", value)}
            >
              <SelectTrigger id="category" data-testid="select-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {forumCategories.map((category) => (
                  <SelectItem
                    key={category.slug}
                    value={category.slug}
                    data-testid={`select-option-${category.slug}`}
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categorySlug && (
              <p className="text-sm text-destructive" data-testid="error-category">
                {errors.categorySlug.message}
              </p>
            )}
          </div>

          {/* Thread Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., XAUUSD M1 Scalping Strategy - High Win Rate"
              {...register("title")}
              data-testid="input-title"
            />
            {errors.title && (
              <p className="text-sm text-destructive" data-testid="error-title">
                {errors.title.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {watch("title")?.length || 0} / 200 characters
            </p>
          </div>

          {/* Thread Body */}
          <div className="space-y-2">
            <Label htmlFor="body">Content *</Label>
            <Textarea
              id="body"
              placeholder="Share your thoughts, strategies, questions, or analysis...

You can include:
• Trading strategies and setups
• Performance reports and backtests
• Questions and troubleshooting
• Market analysis and insights
• Code snippets and EA configurations"
              rows={12}
              {...register("body")}
              data-testid="input-body"
            />
            {errors.body && (
              <p className="text-sm text-destructive" data-testid="error-body">
                {errors.body.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {watch("body")?.length || 0} / 10,000 characters (minimum 50)
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                reset();
              }}
              disabled={createThreadMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createThreadMutation.isPending}
              data-testid="button-submit"
            >
              {createThreadMutation.isPending ? "Creating..." : "Create Thread"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
