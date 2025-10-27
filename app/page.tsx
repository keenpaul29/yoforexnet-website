import type { Metadata } from 'next';
import HomeClient from './HomeClient';

// Homepage metadata
export const metadata: Metadata = {
  title: 'YoForex - Expert Advisor Forum & EA Marketplace',
  description: 'Join 10,000+ forex traders. Download free EAs, share strategies, and earn coins. #1 MT4/MT5 EA community with verified backtests and live results.',
  keywords: ['forex forum', 'EA marketplace', 'Expert Advisor', 'MT4', 'MT5', 'forex trading', 'algorithmic trading', 'free EAs', 'trading robots'],
};

async function fetchData(url: string) {
  try {
    const expressUrl = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
    const res = await fetch(`${expressUrl}${url}`, {
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
  const [stats, categories, threads] = await Promise.all([
    fetchData('/api/stats'),
    fetchData('/api/categories'),
    fetchData('/api/threads'),
  ]);

  return (
    <HomeClient 
      initialStats={stats}
      initialCategories={categories}
      initialThreads={threads}
    />
  );
}
