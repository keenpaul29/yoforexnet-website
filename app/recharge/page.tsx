import { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import RechargeClient from "./RechargeClient";

export const metadata: Metadata = {
  title: "Recharge Coins | YoForex",
  description: "Purchase gold coins to unlock premium content, support creators, and access exclusive features on YoForex.",
  keywords: "recharge, buy coins, gold coins, premium content, stripe payment, cryptocurrency, USDT, trading platform",
  openGraph: {
    title: "Recharge Coins | YoForex",
    description: "Purchase gold coins to unlock premium content, support creators, and access exclusive features on YoForex.",
    type: "website",
    siteName: "YoForex",
  },
  twitter: {
    card: "summary_large_image",
    title: "Recharge Coins | YoForex",
    description: "Purchase gold coins to unlock premium content, support creators, and access exclusive features on YoForex.",
  },
};

async function getUser() {
  const EXPRESS_URL = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join('; ');

  try {
    const res = await fetch(`${EXPRESS_URL}/api/me`, {
      headers: {
        Cookie: cookieHeader,
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (res.status === 401) {
      return null;
    }

    if (!res.ok) {
      throw new Error('Failed to fetch user');
    }

    return await res.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

async function getRechargePackages() {
  const packages = [
    { coins: 22, price: 22 },
    { coins: 52, price: 52, bonus: 5 },
    { coins: 200, price: 200, bonus: 20, popular: true },
    { coins: 500, price: 500, bonus: 75 },
    { coins: 1000, price: 1000, bonus: 200 },
    { coins: 2000, price: 2000, bonus: 500 }
  ];

  return packages;
}

export default async function RechargePage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  const packages = await getRechargePackages();

  return <RechargeClient initialPackages={packages} />;
}
