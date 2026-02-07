# Getting Started Guide

## Prerequisites Checklist

Before starting, make sure you have:

- ✅ Node.js v18+ installed ([Download](https://nodejs.org/))
- ✅ PostgreSQL v14+ installed ([Download](https://www.postgresql.org/download/))
- ✅ A code editor (VS Code recommended)
- ✅ Git installed

## Step-by-Step Setup

### 1. Install PostgreSQL

**Windows:**
- Download installer from postgresql.org
- Run installer, set password for postgres user
- Remember this password for later!

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

### 2. Create Database

Open a terminal and run:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE interview_prep;

# Verify it was created
\l

# Exit
\q
```

### 3. Clone and Setup Project

**Windows (PowerShell or Command Prompt):**
```bash
# Navigate to project
cd exoDone

# Run setup script
setup.bat
```

**macOS/Linux:**
```bash
# Navigate to project
cd exoDone

# Make setup script executable
chmod +x setup.sh

# Run setup script
./setup.sh
```

### 4. Configure Environment

Edit `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD  # ← Change this!
DB_NAME=interview_prep
JWT_SECRET=your_random_secret_key_here  # ← Change this!
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Initialize Database

```bash
cd backend

# Create tables
npm run init-db

# Add sample data
npm run seed
```

### 6. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server is running on port 5000
✅ Database connected successfully
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
VITE ready in XXX ms
Local: http://localhost:3000/
```

### 7. Test the Application

1. Open browser to http://localhost:3000
2. You should see the homepage
3. Click "Sign Up" to create an account
4. After registration, browse categories
5. Select a topic and start learning!

## Common Issues & Solutions

### Issue: "Database connection failed"

**Solution:**
- Verify PostgreSQL is running
- Check credentials in `.env` file
- Ensure database `interview_prep` exists

### Issue: "Port 5000 already in use"

**Solution:**
Change port in `backend/.env`:
```env
PORT=5001
```

### Issue: "npm install fails"

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Issue: "Cannot find module"

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

## Verification Checklist

After setup, verify:

- [ ] Backend responds at http://localhost:5000/api/health
- [ ] Frontend loads at http://localhost:3000
- [ ] Can register a new user
- [ ] Can login with credentials
- [ ] Can view categories
- [ ] Can view topics
- [ ] Can read a lesson
- [ ] Can see progress dashboard

## Next Steps

1. **Explore the Application**
   - Register an account
   - Browse all three categories
   - Complete a lesson
   - Take a quiz

2. **Customize Content**
   - Edit `backend/src/database/seed.js`
   - Add your own lessons
   - Run `npm run seed` to update

3. **Development**
   - Backend code: `backend/src/`
   - Frontend code: `frontend/src/`
   - Database schema: `backend/src/database/schema.sql`

## Architecture Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   React     │────────▶│   Express   │────────▶│ PostgreSQL  │
│  Frontend   │  HTTP   │   Backend   │   SQL   │  Database   │
│  (Port      │         │  (Port      │         │             │
│   3000)     │◀────────│   5000)     │◀────────│             │
└─────────────┘  JSON   └─────────────┘  Data   └─────────────┘
```

## Useful Commands

**Backend:**
```bash
npm run dev       # Start development server
npm run init-db   # Initialize database
npm run seed      # Seed with data
npm start         # Production server
```

**Frontend:**
```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
```

## Getting Help

If you encounter issues:

1. Check the console for error messages
2. Verify all prerequisites are installed
3. Check database connection
4. Review environment variables
5. Check the GitHub issues page

## Learning Path

Recommended order for exploring the platform:

1. Start with **Frontend → React Basics**
2. Move to **Backend → OOP Fundamentals**
3. Explore **Architecture → Basic Concepts**
4. Progress through difficulty levels
5. Track your progress in the dashboard

---

**You're all set! Happy learning! 🎉**
