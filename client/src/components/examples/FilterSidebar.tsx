import FilterSidebar from '../FilterSidebar';

export default function FilterSidebarExample() {
  const mockFilters = [
    {
      title: "Platform",
      options: [
        { id: "mt4", label: "MT4", count: 234 },
        { id: "mt5", label: "MT5", count: 156 },
        { id: "both", label: "Both", count: 89 }
      ]
    },
    {
      title: "Strategy",
      options: [
        { id: "scalping", label: "Scalping", count: 123 },
        { id: "trend", label: "Trend Following", count: 98 },
        { id: "grid", label: "Grid", count: 67 },
        { id: "martingale", label: "Martingale", count: 45 }
      ]
    },
    {
      title: "Price",
      options: [
        { id: "free", label: "Free", count: 56 },
        { id: "under100", label: "Under $100", count: 134 },
        { id: "100to200", label: "$100 - $200", count: 89 },
        { id: "over200", label: "Over $200", count: 45 }
      ]
    }
  ];

  return (
    <div className="p-8 max-w-xs">
      <FilterSidebar 
        filters={mockFilters}
        onFilterChange={(filters) => console.log('Filters changed:', filters)}
      />
    </div>
  );
}
