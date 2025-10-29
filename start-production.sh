#!/bin/bash

# YoForex Production Startup Script
# Runs Express API (port 3001 internal) and Next.js frontend (port 5000 user-facing)

echo "🚀 Starting YoForex in Production Mode..."

# Start Express API server on port 3001 in background
echo "📦 Starting Express API server (port 3001)..."
API_PORT=3001 NODE_ENV=production node dist/index.js &
EXPRESS_PID=$!

# Wait for Express to initialize
sleep 2

# Start Next.js server on port 5000 (required by Replit for webview)
echo "⚡ Starting Next.js frontend (port 5000)..."
npx next start -p 5000 &
NEXTJS_PID=$!

echo "✅ Production servers started:"
echo "   - Express API: http://localhost:3001/api/* (internal)"
echo "   - Next.js App: http://localhost:5000 (user-facing)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Trap Ctrl+C to kill both processes
trap "echo '⏹️  Stopping servers...'; kill $EXPRESS_PID $NEXTJS_PID; exit" SIGINT SIGTERM

# Wait for both processes
wait
