#!/bin/bash

# YoForex Production Hybrid Startup Script
# Builds and runs both Express and Next.js in production mode

echo "🏗️  Building YoForex for production..."

# Build Vite frontend
echo "📦 Building Vite frontend..."
npm run build

# Build Next.js
echo "⚡ Building Next.js..."
npx next build

echo "🚀 Starting production servers..."

# Start Express in production mode in background
echo "📦 Starting Express server (port 5000)..."
NODE_ENV=production node dist/index.js &
EXPRESS_PID=$!

# Wait for Express to start
sleep 3

# Start Next.js in production mode in background
echo "⚡ Starting Next.js server (port 3000)..."
npx next start -p 3000 &
NEXTJS_PID=$!

echo "✅ Production servers running:"
echo "   - Express API: http://localhost:5000"
echo "   - Next.js SEO: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Trap Ctrl+C to kill both processes
trap "echo '⏹️  Stopping servers...'; kill $EXPRESS_PID $NEXTJS_PID; exit" SIGINT SIGTERM

# Wait for both processes
wait
