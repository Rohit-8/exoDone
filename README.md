# Interview Preparation Platform 🚀

A comprehensive full-stack web application for interview preparation, covering Software Architecture, Backend Development (C#/OOP), and Frontend Development (React).

## 🌟 Features

- **📚 Comprehensive Learning Paths**: Progress from Junior to Lead level
- **💻 Interactive Code Examples**: Learn by seeing real code
- **✅ Quiz System**: Test your knowledge with quizzes
- **📊 Progress Tracking**: Monitor your learning journey
- **🎯 Three Main Categories**:
  - Software Architecture (System Design)
  - Backend Development (OOP, Design Patterns, C#)
  - Frontend Development (React, Hooks, Patterns)

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** authentication
- **RESTful API** architecture

### Frontend
- **React 18** with functional components
- **React Router** for navigation
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Monaco Editor** for code examples
- **React Markdown** for content rendering
- **Vite** for fast development

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd exoDone
\`\`\`

### 2. Backend Setup

\`\`\`bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your database credentials
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_NAME=interview_prep
# JWT_SECRET=your_secret_key

# Initialize database (creates tables)
npm run init-db

# Seed database with sample content
npm run seed

# Start the backend server
npm run dev
\`\`\`

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

\`\`\`bash
# Open a new terminal
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
\`\`\`

The frontend will run on `http://localhost:3000`

### 4. Access the Application

Open your browser and go to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 📖 Database Setup (Detailed)

### Create PostgreSQL Database

\`\`\`bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE interview_prep;

# Exit
\\q
\`\`\`

### Initialize Schema

\`\`\`bash
cd backend
npm run init-db
\`\`\`

This creates all necessary tables:
- users
- categories
- topics
- lessons
- code_examples
- quiz_questions
- user_progress
- quiz_attempts

### Seed Sample Data

\`\`\`bash
npm run seed
\`\`\`

This populates:
- 3 categories (Architecture, Backend, Frontend)
- 12 topics across all categories
- Sample lessons with content
- Code examples
- Quiz questions

## 🎯 Usage Guide

### For Students

1. **Register an Account**
   - Click "Sign Up" in the navbar
   - Enter username, email, and password

2. **Browse Categories**
   - Visit the Categories page
   - Choose: Architecture, Backend, or Frontend

3. **Learn Topics**
   - Select a topic to see all lessons
   - Lessons are organized by difficulty

4. **Study Lessons**
   - Read comprehensive content
   - View code examples
   - Take quizzes to test knowledge

5. **Track Progress**
   - Mark lessons as complete
   - View progress dashboard
   - See recent activity

### For Development

#### Project Structure

\`\`\`
exoDone/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── database/       # Schema and seed files
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   └── server.js       # Main server file
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   ├── store/          # Zustand state management
│   │   ├── App.jsx         # Main App component
│   │   └── main.jsx        # Entry point
│   ├── index.html
│   └── package.json
│
├── architecture/
│   └── README.md           # Architecture topics reference
├── backend/
│   └── README.md           # Backend topics reference
└── frontend/
    └── README.md           # Frontend topics reference
\`\`\`

#### API Endpoints

**Authentication**
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user (protected)

**Categories**
- GET `/api/categories` - Get all categories
- GET `/api/categories/:slug` - Get category with topics

**Topics**
- GET `/api/topics` - Get all topics (with filters)
- GET `/api/topics/:slug` - Get topic with lessons

**Lessons**
- GET `/api/lessons/:slug` - Get lesson with content, code, quizzes
- GET `/api/lessons/search?q=query` - Search lessons

**Progress** (Protected)
- GET `/api/progress/overview` - Get user's overall progress
- GET `/api/progress/lesson/:lessonId` - Get progress for lesson
- POST `/api/progress/lesson/:lessonId` - Update lesson progress

**Quiz** (Protected)
- POST `/api/quiz/submit` - Submit quiz answer
- GET `/api/quiz/stats` - Get user's quiz statistics

## 🔧 Development

### Backend Development

\`\`\`bash
cd backend

# Run in development mode with auto-reload
npm run dev

# Run in production mode
npm start
\`\`\`

### Frontend Development

\`\`\`bash
cd frontend

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
\`\`\`

### Adding New Content

To add more lessons:

1. Modify `backend/src/database/seed.js`
2. Add new lesson data with content, code examples, and quizzes
3. Run: `npm run seed`

## 🎨 Features Breakdown

### 1. Learning System
- Structured learning paths from beginner to expert
- Comprehensive lessons with markdown support
- Syntax-highlighted code examples
- Interactive quizzes with explanations

### 2. Progress Tracking
- Personal dashboard
- Category-wise progress visualization
- Recent activity tracking
- Completion status for each lesson

### 3. User Authentication
- Secure JWT-based authentication
- User registration and login
- Protected routes for authenticated content

### 4. Responsive Design
- Mobile-friendly interface
- Dark mode theme
- Modern, clean UI with Tailwind CSS

## 🚀 Deployment

### Backend Deployment (Example: Heroku)

\`\`\`bash
# Add Heroku PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Initialize database
heroku run npm run init-db
heroku run npm run seed
\`\`\`

### Frontend Deployment (Example: Vercel)

\`\`\`bash
cd frontend

# Build the project
npm run build

# Deploy to Vercel
vercel deploy
\`\`\`

## 📝 Environment Variables

### Backend (.env)

\`\`\`env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=interview_prep

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

CORS_ORIGIN=http://localhost:3000
\`\`\`

### Frontend (.env)

\`\`\`env
VITE_API_URL=http://localhost:5000/api
\`\`\`

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- Content based on comprehensive interview preparation guides
- Inspired by real-world interview experiences
- Built with modern web technologies

## 📧 Support

For issues or questions:
- Open an issue in the repository
- Contact the development team

## 🎓 Learning Resources

The content is organized into three main areas:

### Software Architecture
- System design fundamentals
- Scalability patterns
- Microservices architecture
- Real-world case studies (Twitter, Netflix, Uber, etc.)

### Backend Development
- OOP concepts in C#
- SOLID principles
- Design patterns (Gang of Four)
- Clean architecture
- Domain-Driven Design

### Frontend Development
- React fundamentals
- Hooks and state management
- Advanced patterns
- Performance optimization

---

**Happy Learning! 🎉**

Start your interview preparation journey today and master the skills needed to ace your technical interviews!
