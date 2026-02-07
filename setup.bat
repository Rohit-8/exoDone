@echo off
echo 🚀 Starting Interview Prep Platform Setup...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js v18 or higher.
    pause
    exit /b 1
)

echo ✅ Node.js is installed
node --version
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL is not installed. Please install PostgreSQL v14 or higher.
    pause
    exit /b 1
)

echo ✅ PostgreSQL is installed
echo.

REM Setup Backend
echo 📦 Setting up Backend...
cd backend

if not exist ".env" (
    echo 📝 Creating .env file...
    copy .env.example .env
    echo ⚠️  Please edit backend\.env with your database credentials
    echo.
)

echo 📦 Installing backend dependencies...
call npm install

echo.
echo 🗄️  Database Setup
echo Please ensure PostgreSQL is running and you have created the 'interview_prep' database
echo Run this command in psql:
echo   CREATE DATABASE interview_prep;
echo.
set /p dbready="Have you created the database? (y/n): "

if /i "%dbready%"=="y" (
    echo 🔧 Initializing database schema...
    call npm run init-db
    
    echo 🌱 Seeding database with sample data...
    call npm run seed
    
    echo ✅ Backend setup complete!
) else (
    echo ⚠️  Please create the database and run:
    echo   npm run init-db
    echo   npm run seed
)

cd ..
echo.

REM Setup Frontend
echo 📦 Setting up Frontend...
cd frontend

echo 📦 Installing frontend dependencies...
call npm install

echo ✅ Frontend setup complete!

cd ..
echo.

echo 🎉 Setup Complete!
echo.
echo To start the application:
echo.
echo Terminal 1 (Backend):
echo   cd backend
echo   npm run dev
echo.
echo Terminal 2 (Frontend):
echo   cd frontend
echo   npm run dev
echo.
echo Then open http://localhost:3000 in your browser
echo.
pause
