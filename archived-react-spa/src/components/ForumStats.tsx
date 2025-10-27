import { Card, CardContent } from "@/components/ui/card";
import { Download, CheckCircle2, MessageSquare, Activity, LucideIcon } from "lucide-react";

interface Stat {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

interface ForumStatsProps {
  stats?: Stat[];
}

const defaultStats: Stat[] = [
  {
    label: "Total Downloads",
    value: "48,392",
    icon: Download,
    color: "text-primary"
  },
  {
    label: "Verified Uploads",
    value: "2,847",
    icon: CheckCircle2,
    color: "text-chart-3"
  },
  {
    label: "Avg Daily Threads",
    value: "127",
    icon: MessageSquare,
    color: "text-chart-2"
  },
  {
    label: "Active Now",
    value: "342",
    icon: Activity,
    color: "text-chart-4"
  }
];

export default function ForumStats({ stats = defaultStats }: ForumStatsProps) {
  return (
    <Card data-testid="card-forum-stats">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3 text-sm">Forum Stats</h3>
        <div className="space-y-3">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-3" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="bg-muted rounded-md p-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm" data-testid={`text-value-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
