"use client";

import Link from "next/link";
import { ChevronRight, Folder } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Category {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  parentSlug?: string | null;
  threadCount: number;
  postCount: number;
  children?: Category[];
}

interface CategoryTreeProps {
  categories: Category[];
}

export function CategoryTree({ categories }: CategoryTreeProps) {
  const mainCategories = categories.filter(c => !c.parentSlug);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mainCategories.map((category) => {
        const subcategories = categories.filter(c => c.parentSlug === category.slug);
        
        return (
          <Card key={category.slug} className="p-6 hover-elevate" data-testid={`category-card-${category.slug}`}>
            <Link href={`/category/${category.slug}`} className="block mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${category.color}`}>
                  <Folder className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-lg">{category.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {category.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{category.threadCount} threads</span>
                <span>{category.postCount} posts</span>
              </div>
            </Link>
            
            {subcategories.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="space-y-2">
                  {subcategories.slice(0, 5).map((subcat) => (
                    <Link
                      key={subcat.slug}
                      href={`/category/${category.slug}/${subcat.slug}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover-elevate p-2 rounded"
                      data-testid={`subcategory-link-${subcat.slug}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>{subcat.name}</span>
                      <span className="ml-auto text-xs">({subcat.threadCount})</span>
                    </Link>
                  ))}
                  {subcategories.length > 5 && (
                    <Link
                      href={`/category/${category.slug}`}
                      className="flex items-center gap-2 text-sm text-primary hover:underline pl-6"
                    >
                      +{subcategories.length - 5} more
                    </Link>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
