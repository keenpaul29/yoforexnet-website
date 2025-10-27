import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useState } from "react";

interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterGroup {
  title: string;
  options: FilterOption[];
}

interface FilterSidebarProps {
  filters: FilterGroup[];
  onFilterChange?: (selectedFilters: Record<string, string[]>) => void;
}

export default function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const handleFilterToggle = (groupTitle: string, optionId: string) => {
    setSelectedFilters(prev => {
      const groupFilters = prev[groupTitle] || [];
      const newGroupFilters = groupFilters.includes(optionId)
        ? groupFilters.filter(id => id !== optionId)
        : [...groupFilters, optionId];
      
      const updated = {
        ...prev,
        [groupTitle]: newGroupFilters
      };
      
      if (onFilterChange) {
        onFilterChange(updated);
      }
      
      return updated;
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  const totalActiveFilters = Object.values(selectedFilters).flat().length;

  return (
    <Card data-testid="component-filter-sidebar">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Filters</CardTitle>
        {totalActiveFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-8 text-xs"
            data-testid="button-clear-filters"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {filters.map((group) => (
          <div key={group.title} className="space-y-3">
            <h4 className="text-sm font-medium">{group.title}</h4>
            <div className="space-y-2">
              {group.options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${group.title}-${option.id}`}
                    checked={selectedFilters[group.title]?.includes(option.id) || false}
                    onCheckedChange={() => handleFilterToggle(group.title, option.id)}
                    data-testid={`checkbox-${option.id}`}
                  />
                  <Label
                    htmlFor={`${group.title}-${option.id}`}
                    className="text-sm font-normal cursor-pointer flex items-center justify-between flex-1"
                  >
                    <span>{option.label}</span>
                    {option.count !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        ({option.count})
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
