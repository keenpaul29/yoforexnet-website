#!/bin/bash

# YoForex Hybrid Server Startup Script
# Runs both Express (port 5000) and Next.js (port 3000) simultaneously

echo "🚀 Starting YoForex Hybrid Architecture..."

# Start Express server in background
echo "📦 Starting Express server (port 5000)..."
NODE_ENV=development tsx server/index.ts &
EXPRESS_PID=$!

# Wait a moment for Express to initialize
sleep 3

# Start Next.js server in background
echo "⚡ Starting Next.js server (port 3000)..."
npx next dev &
NEXTJS_PID=$!

echo "✅ Both servers started:"
echo "   - Express API: http://localhost:5000"
echo "   - Next.js SEO: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Trap Ctrl+C to kill both processes
trap "echo '⏹️  Stopping servers...'; kill $EXPRESS_PID $NEXTJS_PID; exit" SIGINT SIGTERM

# Wait for both processes
wait
