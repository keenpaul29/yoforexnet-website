import { NextResponse } from 'next/server';

// Root health check endpoint for deployment
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // Respond immediately for health checks
  return NextResponse.json({ 
    status: 'healthy',
    service: 'yoforex-frontend',
    timestamp: Date.now()
  }, { 
    status: 200 
  });
}