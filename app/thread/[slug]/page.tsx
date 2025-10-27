import type { Metadata } from 'next';
import type { ForumThread, ForumReply } from '@shared/schema';
import ThreadDetailClient from './ThreadDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function createExcerpt(html: string, maxLength: number = 155): string {
  const text = stripHtml(html);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const thread: ForumThread | null = await fetchData(`/api/threads/slug/${slug}`);

  if (!thread) {
    return {
      title: 'Thread Not Found - YoForex',
      description: 'The thread you are looking for does not exist.',
    };
  }

  const description = thread.metaDescription || createExcerpt(thread.body || '');
  const title = `${thread.title} - YoForex Forum`;

  return {
    title,
    description,
    keywords: [
      thread.categorySlug || 'forum',
      'EA discussion',
      'forex forum',
      'expert advisor',
      'trading discussion',
      'MT4',
      'MT5',
    ],
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://yoforex.com/thread/${slug}`,
      siteName: 'YoForex',
      images: thread.thumbnailUrl ? [
        {
          url: thread.thumbnailUrl,
          width: 1200,
          height: 630,
          alt: thread.title,
        },
      ] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: thread.thumbnailUrl ? [thread.thumbnailUrl] : undefined,
    },
  };
}

export default async function ThreadDetailPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Fetch thread data from Express API
  const thread: ForumThread | null = await fetchData(`/api/threads/slug/${slug}`);
  
  // Fetch replies if thread exists
  let replies: ForumReply[] = [];
  if (thread?.id) {
    const repliesData = await fetchData(`/api/threads/${thread.id}/replies`);
    replies = repliesData || [];
  }

  return (
    <ThreadDetailClient 
      initialThread={thread}
      initialReplies={replies}
    />
  );
}
