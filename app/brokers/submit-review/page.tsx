import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SubmitBrokerReviewClient from "./SubmitBrokerReviewClient";
import { getInternalApiUrl } from "../../lib/api-config";

export const metadata: Metadata = {
  title: "Submit Broker Review | YoForex",
  description: "Share your experience with forex brokers. Help the community make informed decisions and earn coins.",
  keywords: "broker review, submit review, broker feedback, forex broker rating",
  openGraph: {
    title: "Submit Broker Review | YoForex",
    description: "Share your experience with forex brokers. Help the community make informed decisions and earn coins.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Submit Broker Review | YoForex",
    description: "Share your experience with forex brokers. Help the community make informed decisions and earn coins.",
  },
};

async function checkAuth() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("connect.sid");
    
    if (!sessionCookie) {
      return null;
    }

    const apiUrl = getInternalApiUrl();
    const response = await fetch(`${apiUrl}/api/me`, {
      headers: { Cookie: `connect.sid=${sessionCookie.value}` },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    return null;
  }
}

async function getBrokers() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("connect.sid");
    
    const apiUrl = getInternalApiUrl();
    const response = await fetch(`${apiUrl}/api/brokers`, {
      headers: sessionCookie ? { Cookie: `connect.sid=${sessionCookie.value}` } : {},
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch brokers:", error);
    return [];
  }
}

export default async function SubmitBrokerReviewPage() {
  // Check authentication - this is an authenticated page
  const user = await checkAuth();
  if (!user) {
    redirect("/");
  }

  // Fetch broker list for selection dropdown
  const brokers = await getBrokers();

  return <SubmitBrokerReviewClient initialBrokers={brokers} />;
}
