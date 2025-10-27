import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, HelpCircle, TrendingUp, LucideIcon } from "lucide-react";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  description: string;
  color: string;
  onClick?: () => void;
}

interface QuickActionsProps {
  actions?: QuickAction[];
}

const defaultActions: QuickAction[] = [
  {
    label: "Performance Report",
    icon: TrendingUp,
    description: "Share your results",
    color: "bg-chart-3"
  },
  {
    label: "Share EA",
    icon: Upload,
    description: "Upload your bot",
    color: "bg-primary"
  },
  {
    label: "Ask Question",
    icon: HelpCircle,
    description: "Get help fast",
    color: "bg-chart-2"
  },
  {
    label: "Write Guide",
    icon: FileText,
    description: "Help others learn",
    color: "bg-chart-4"
  }
];

export default function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  return (
    <Card data-testid="card-quick-actions">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3 text-sm">Quick Actions</h3>
        <div className="space-y-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={action.onClick}
              data-testid={`button-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className={`${action.color} rounded-md p-2 flex-shrink-0`}>
                <action.icon className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="font-medium text-sm">{action.label}</div>
                <div className="text-xs text-muted-foreground truncate">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
