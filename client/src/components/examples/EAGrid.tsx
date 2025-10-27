import EAGrid from '../EAGrid';
import eaIcon1 from '@assets/generated_images/EA_software_icon_1_ca83c324.png';
import eaIcon2 from '@assets/generated_images/EA_software_icon_2_909d9b4a.png';
import perfChart from '@assets/generated_images/Performance_chart_thumbnail_14e4f5ea.png';

export default function EAGridExample() {
  const mockEAs = [
    {
      id: "1",
      name: "Scalping Master Pro",
      description: "Advanced scalping algorithm with built-in risk management",
      thumbnail: eaIcon1,
      platform: "MT4" as const,
      strategy: "Scalping",
      rating: 4.5,
      reviewCount: 234,
      downloads: 1520,
      price: 149,
      profitFactor: 1.85,
      verified: true
    },
    {
      id: "2",
      name: "Trend Rider Elite",
      description: "Follow major trends with intelligent entry and exit points",
      thumbnail: perfChart,
      platform: "Both" as const,
      strategy: "Trend Following",
      rating: 4.8,
      reviewCount: 456,
      downloads: 2340,
      price: 199,
      profitFactor: 2.12,
      verified: true
    },
    {
      id: "3",
      name: "Grid Trading Bot",
      description: "Automated grid strategy with dynamic lot sizing",
      thumbnail: eaIcon2,
      platform: "MT5" as const,
      strategy: "Grid",
      rating: 4.2,
      reviewCount: 89,
      downloads: 567,
      price: 99,
      profitFactor: 1.65,
      verified: false
    }
  ];

  return (
    <div className="p-8">
      <EAGrid eas={mockEAs} />
    </div>
  );
}
