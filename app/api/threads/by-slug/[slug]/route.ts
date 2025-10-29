/**
 * API Endpoint: Get Thread by Slug
 * 
 * Returns a single thread by its slug
 * Used by hierarchical URL system to resolve thread pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequest } from '@/lib/api-config';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Forward to the backend Express API
    const thread = await apiRequest(`/api/threads/slug/${params.slug}`, {
      method: 'GET',
    });
    
    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(thread);
  } catch (error: any) {
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }
    
    console.error('[API] Error fetching thread by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thread' },
      { status: 500 }
    );
  }
}
