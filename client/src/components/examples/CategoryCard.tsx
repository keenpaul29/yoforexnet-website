import CategoryCard from '../CategoryCard';
import { Lightbulb, HelpCircle, TrendingUp, Settings } from 'lucide-react';

export default function CategoryCardExample() {
  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
      <CategoryCard
        name="Strategy Discussion"
        description="Share and discuss trading strategies, EA configurations, and optimization tips"
        icon={Lightbulb}
        threadCount={1234}
        postCount={8765}
        color="bg-primary"
      />
      <CategoryCard
        name="Beginner Questions"
        description="New to EA trading? Ask questions and get help from experienced traders"
        icon={HelpCircle}
        threadCount={567}
        postCount={3421}
        color="bg-chart-2"
      />
      <CategoryCard
        name="Performance Reports"
        description="Post and review real trading results, backtests, and performance analysis"
        icon={TrendingUp}
        threadCount={890}
        postCount={5432}
        color="bg-chart-3"
      />
      <CategoryCard
        name="Technical Support"
        description="Get help with installation, configuration, and troubleshooting"
        icon={Settings}
        threadCount={445}
        postCount={2109}
        color="bg-chart-4"
      />
    </div>
  );
}
