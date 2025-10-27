"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import type { ForumCategory, ForumThread } from "@shared/schema";
import Header from "@/components/Header";
import EnhancedFooter from "@/components/EnhancedFooter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { useAuthPrompt } from "@/hooks/useAuthPrompt";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, Info, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Thread creation schema matching backend requirements
const createThreadSchema = z.object({
  title: z.string()
    .min(10, "Title must be at least 10 characters")
    .max(120, "Title must be at most 120 characters"),
  body: z.string()
    .min(50, "Body must be at least 50 characters")
    .max(50000, "Body is too long"),
  categorySlug: z.string().min(1, "Please select a category"),
  tags: z.array(z.string()).max(5, "Maximum 5 tags allowed").optional(),
});

type CreateThreadFormData = z.infer<typeof createThreadSchema>;

interface ThreadComposeClientProps {
  categories: ForumCategory[];
}

export default function ThreadComposeClient({ categories }: ThreadComposeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { requireAuth, AuthPrompt } = useAuthPrompt("create a thread");
  
  const [tagInput, setTagInput] = useState("");
  const [currentTags, setCurrentTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [subcategories, setSubcategories] = useState<ForumCategory[]>([]);

  // Pre-select category from URL param
  const categoryParam = searchParams?.get("category");
  
  useEffect(() => {
    if (categoryParam && categories.length > 0) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam, categories]);

  // Update subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const subs = categories.filter(c => c.parentSlug === selectedCategory);
      setSubcategories(subs);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategory, categories]);

  const form = useForm<CreateThreadFormData>({
    resolver: zodResolver(createThreadSchema),
    defaultValues: {
      title: "",
      body: "",
      categorySlug: categoryParam || "",
      tags: [],
    },
  });

  const createThreadMutation = useMutation({
    mutationFn: async (data: CreateThreadFormData) => {
      return await apiRequest<ForumThread>("/api/threads", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (thread) => {
      toast({
        title: "Thread Created!",
        description: "Your discussion thread has been published successfully.",
      });
      router.push(`/thread/${thread.slug}`);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Create Thread",
        description: error.message || "Something went wrong. Please try again.",
      });
    },
  });

  const handleSubmit = async (data: CreateThreadFormData) => {
    requireAuth(async () => {
      // Add current tags to form data
      const formData = {
        ...data,
        tags: currentTags.length > 0 ? currentTags : undefined,
      };
      await createThreadMutation.mutateAsync(formData);
    });
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (currentTags.length >= 5) {
      toast({
        variant: "destructive",
        title: "Maximum Tags Reached",
        description: "You can add up to 5 tags only.",
      });
      return;
    }
    if (currentTags.includes(tagInput.trim())) {
      toast({
        variant: "destructive",
        title: "Duplicate Tag",
        description: "This tag has already been added.",
      });
      return;
    }
    setCurrentTags([...currentTags, tagInput.trim()]);
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    setCurrentTags(currentTags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Get main categories (no parent)
  const mainCategories = categories.filter(c => !c.parentSlug);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AuthPrompt />

      <main className="container max-w-4xl mx-auto px-4 py-8">
        <Card data-testid="card-create-thread">
          <CardHeader>
            <CardTitle data-testid="heading-create-thread">Create New Discussion Thread</CardTitle>
            <CardDescription data-testid="text-thread-description">
              Start a conversation with the YoForex community. Share your knowledge, ask questions, or discuss trading strategies.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Posting Rules */}
            <Alert className="mb-6" data-testid="alert-posting-rules">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Posting Guidelines:</strong> Be polite and respectful. No spam or self-promotion. Stay on-topic and provide value to the community.
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Title Field */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-title">Thread Title *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter a descriptive title for your thread (10-120 characters)"
                          data-testid="input-title"
                          maxLength={120}
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value.length}/120 characters
                      </FormDescription>
                      <FormMessage data-testid="error-title" />
                    </FormItem>
                  )}
                />

                {/* Category Selection */}
                <FormField
                  control={form.control}
                  name="categorySlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-category">Category *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedCategory(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mainCategories.map((category) => (
                            <SelectItem
                              key={category.slug}
                              value={category.slug}
                              data-testid={`option-category-${category.slug}`}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage data-testid="error-category" />
                    </FormItem>
                  )}
                />

                {/* Subcategory Selection (Optional) */}
                {subcategories.length > 0 && (
                  <div className="space-y-2">
                    <Label data-testid="label-subcategory">Subcategory (Optional)</Label>
                    <Select
                      onValueChange={(value) => {
                        form.setValue("categorySlug", value);
                      }}
                      defaultValue={form.watch("categorySlug")}
                    >
                      <SelectTrigger data-testid="select-subcategory">
                        <SelectValue placeholder="Select a subcategory (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories.map((subcategory) => (
                          <SelectItem
                            key={subcategory.slug}
                            value={subcategory.slug}
                            data-testid={`option-subcategory-${subcategory.slug}`}
                          >
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Body Field */}
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel data-testid="label-body">Thread Body *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe your topic in detail. Provide context, ask specific questions, or share your insights. (Minimum 50 characters)"
                          className="min-h-[200px]"
                          data-testid="textarea-body"
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value.length} characters (minimum 50 required)
                      </FormDescription>
                      <FormMessage data-testid="error-body" />
                    </FormItem>
                  )}
                />

                {/* Tags Input */}
                <div className="space-y-2">
                  <Label data-testid="label-tags">Tags (Optional, max 5)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Add a tag (press Enter)"
                      data-testid="input-tag"
                      disabled={currentTags.length >= 5}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={currentTags.length >= 5 || !tagInput.trim()}
                      data-testid="button-add-tag"
                    >
                      Add
                    </Button>
                  </div>
                  {currentTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2" data-testid="container-tags">
                      {currentTags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="gap-1"
                          data-testid={`badge-tag-${index}`}
                        >
                          {tag}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                            onClick={() => handleRemoveTag(tag)}
                            data-testid={`button-remove-tag-${index}`}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {currentTags.length}/5 tags added
                  </p>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={createThreadMutation.isPending}
                    data-testid="button-post-thread"
                  >
                    {createThreadMutation.isPending ? "Posting..." : "Post Thread"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={createThreadMutation.isPending}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>

      <EnhancedFooter />
    </div>
  );
}
