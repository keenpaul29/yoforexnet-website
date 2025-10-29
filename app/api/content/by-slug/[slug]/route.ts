/**
 * API Endpoint: Get Content by Slug
 * 
 * Returns a single marketplace content item by its slug
 * Used by hierarchical URL system to resolve content pages
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequest } from '@/lib/api-config';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Forward to the backend Express API
    const content = await apiRequest(`/api/content/slug/${params.slug}`, {
      method: 'GET',
    });
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(content);
  } catch (error: any) {
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }
    
    console.error('[API] Error fetching content by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
