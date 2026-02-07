#!/bin/bash

echo "🚀 Starting Interview Prep Platform Setup..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL v14 or higher."
    exit 1
fi

echo "✅ PostgreSQL is installed"
echo ""

# Setup Backend
echo "📦 Setting up Backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your database credentials"
    echo ""
fi

echo "📦 Installing backend dependencies..."
npm install

echo ""
echo "🗄️  Database Setup"
echo "Please ensure PostgreSQL is running and you have created the 'interview_prep' database"
echo "Run these commands in psql:"
echo "  CREATE DATABASE interview_prep;"
echo ""
read -p "Have you created the database? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔧 Initializing database schema..."
    npm run init-db
    
    echo "🌱 Seeding database with sample data..."
    npm run seed
    
    echo "✅ Backend setup complete!"
else
    echo "⚠️  Please create the database and run:"
    echo "  npm run init-db"
    echo "  npm run seed"
fi

cd ..
echo ""

# Setup Frontend
echo "📦 Setting up Frontend..."
cd frontend

echo "📦 Installing frontend dependencies..."
npm install

echo "✅ Frontend setup complete!"

cd ..
echo ""

echo "🎉 Setup Complete!"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
