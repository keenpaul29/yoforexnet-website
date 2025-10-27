import EACard from "./EACard";

interface EA {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  platform: "MT4" | "MT5" | "Both";
  strategy: string;
  rating: number;
  reviewCount: number;
  downloads: number;
  price: number;
  profitFactor?: number;
  verified?: boolean;
}

interface EAGridProps {
  eas: EA[];
}

export default function EAGrid({ eas }: EAGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {eas.map((ea) => (
        <EACard key={ea.id} {...ea} />
      ))}
    </div>
  );
}
