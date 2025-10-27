import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { getInternalApiUrl } from './lib/api-config';

// Homepage metadata
export const metadata: Metadata = {
  title: 'YoForex - Expert Advisor Forum & EA Marketplace',
  description: 'Join 10,000+ forex traders. Download free EAs, share strategies, and earn coins. #1 MT4/MT5 EA community with verified backtests and live results.',
  keywords: ['forex forum', 'EA marketplace', 'Expert Advisor', 'MT4', 'MT5', 'forex trading', 'algorithmic trading', 'free EAs', 'trading robots'],
};

async function fetchData(url: string) {
  try {
    // Server-side: use centralized API config (no hardcoded URLs)
    const apiUrl = getInternalApiUrl();
    const res = await fetch(`${apiUrl}${url}`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!res.ok) {
      console.error(`Failed to fetch ${url}:`, res.status, res.statusText);
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

export default async function HomePage() {
  // Parallel data fetching from Express API
  const [stats, categoryTree, threads] = await Promise.all([
    fetchData('/api/stats'),
    fetchData('/api/categories/tree/all'),  // Fetch category tree instead of flat list
    fetchData('/api/threads'),
  ]);

  return (
    <HomeClient 
      initialStats={stats}
      initialCategories={categoryTree}
      initialThreads={threads}
    />
  );
}
