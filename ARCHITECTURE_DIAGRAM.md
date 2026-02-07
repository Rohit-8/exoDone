# Application Architecture Diagram

## High-Level System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                            │
│                    http://localhost:3000                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Components:                                              │  │
│  │  • Layout (Navbar, Footer)                               │  │
│  │  • Pages (Home, Login, Dashboard, Lessons, etc.)         │  │
│  │  • State Management (Zustand)                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Features:                                                │  │
│  │  • User Authentication UI                                │  │
│  │  • Category & Topic Browsing                             │  │
│  │  • Lesson Viewer with Markdown                           │  │
│  │  • Code Examples with Syntax Highlighting               │  │
│  │  • Interactive Quizzes                                   │  │
│  │  • Progress Dashboard                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS (REST API)
                         │ Authorization: Bearer <JWT>
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXPRESS.JS BACKEND                             │
│                  http://localhost:5000/api                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Middleware:                                              │  │
│  │  • CORS                                                   │  │
│  │  • Helmet (Security)                                     │  │
│  │  • JWT Authentication                                    │  │
│  │  • Request Validation                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Routes:                                              │  │
│  │  • /api/auth          - Authentication                   │  │
│  │  • /api/categories    - Categories                       │  │
│  │  • /api/topics        - Topics                           │  │
│  │  • /api/lessons       - Lessons & Search                 │  │
│  │  • /api/progress      - Progress Tracking (Protected)    │  │
│  │  • /api/quiz          - Quizzes (Protected)              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ SQL Queries
                         │ (pg - node-postgres)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   POSTGRESQL DATABASE                            │
│                        interview_prep                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Tables:                                                  │  │
│  │  • users                - User accounts                  │  │
│  │  • categories           - Learning categories            │  │
│  │  • topics               - Topics within categories       │  │
│  │  • lessons              - Lesson content                 │  │
│  │  • code_examples        - Code snippets                  │  │
│  │  • quiz_questions       - Quiz questions                 │  │
│  │  • user_progress        - User learning progress         │  │
│  │  • quiz_attempts        - Quiz attempt history           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### User Registration Flow

```
User                Frontend              Backend              Database
 │                     │                     │                     │
 │──Register Form──────>                     │                     │
 │                     │──POST /auth/────────>                     │
 │                     │   register          │                     │
 │                     │                     │──Check User─────────>
 │                     │                     │   Exists            │
 │                     │                     <──Not Found──────────│
 │                     │                     │                     │
 │                     │                     │──Hash Password      │
 │                     │                     │                     │
 │                     │                     │──Insert User────────>
 │                     │                     <──User Created───────│
 │                     │                     │                     │
 │                     │                     │──Generate JWT       │
 │                     │                     │                     │
 │                     <──User + Token───────│                     │
 │<──Success + Token───│                     │                     │
 │                     │                     │                     │
 │──Store Token────────>                     │                     │
 │──Navigate to────────>                     │                     │
 │  Dashboard          │                     │                     │
```

### Lesson Viewing Flow

```
User                Frontend              Backend              Database
 │                     │                     │                     │
 │──Click Lesson───────>                     │                     │
 │                     │──GET /lessons/──────>                     │
 │                     │   :slug             │                     │
 │                     │   + JWT Token       │──Verify Token       │
 │                     │                     │                     │
 │                     │                     │──Get Lesson─────────>
 │                     │                     <──Lesson Data────────│
 │                     │                     │                     │
 │                     │                     │──Get Code───────────>
 │                     │                     │  Examples           │
 │                     │                     <──Code Data──────────│
 │                     │                     │                     │
 │                     │                     │──Get Quiz───────────>
 │                     │                     │  Questions          │
 │                     │                     <──Quiz Data──────────│
 │                     │                     │                     │
 │                     │                     │──Get Progress───────>
 │                     │                     │  (if logged in)     │
 │                     │                     <──Progress Data──────│
 │                     │                     │                     │
 │                     <──Complete Data──────│                     │
 │<──Display Lesson────│                     │                     │
 │                     │                     │                     │
 │──Read Content───────>                     │                     │
 │──View Code──────────>                     │                     │
 │──Take Quiz──────────>                     │                     │
 │                     │──POST /quiz/────────>                     │
 │                     │   submit            │                     │
 │                     │   + Answer          │──Save Attempt───────>
 │                     │                     <──Result─────────────│
 │                     <──Quiz Result────────│                     │
 │<──Show Feedback─────│                     │                     │
```

### Progress Tracking Flow

```
User                Frontend              Backend              Database
 │                     │                     │                     │
 │──Mark Complete──────>                     │                     │
 │                     │──POST /progress/────>                     │
 │                     │   lesson/:id        │                     │
 │                     │   status=completed  │                     │
 │                     │   + JWT Token       │                     │
 │                     │                     │──Verify Token       │
 │                     │                     │                     │
 │                     │                     │──Check Existing─────>
 │                     │                     │  Progress           │
 │                     │                     <──Found/Not Found────│
 │                     │                     │                     │
 │                     │                     │──Update/Insert──────>
 │                     │                     │  Progress           │
 │                     │                     │  • status           │
 │                     │                     │  • percentage       │
 │                     │                     │  • completed_at     │
 │                     │                     <──Updated────────────│
 │                     │                     │                     │
 │                     <──Success────────────│                     │
 │<──Update UI─────────│                     │                     │
 │  (Show Checkmark)   │                     │                     │
```

## Component Hierarchy

```
App
├── Layout
│   ├── Navbar
│   │   ├── Logo
│   │   ├── Navigation Links
│   │   └── User Menu
│   │       ├── Login Button (if not authenticated)
│   │       └── User Dropdown (if authenticated)
│   │
│   ├── Main Content (React Router Outlet)
│   │   ├── Home
│   │   │   ├── Hero Section
│   │   │   ├── Features Grid
│   │   │   ├── Learning Levels
│   │   │   └── CTA Section
│   │   │
│   │   ├── Categories
│   │   │   └── Category Cards (map)
│   │   │
│   │   ├── TopicView
│   │   │   ├── Topic Header
│   │   │   └── Lessons List (map)
│   │   │       └── Lesson Card
│   │   │           ├── Progress Bar
│   │   │           └── Status Icon
│   │   │
│   │   ├── LessonView
│   │   │   ├── Breadcrumbs
│   │   │   ├── Lesson Header
│   │   │   ├── Tabs (Content/Code/Quiz)
│   │   │   │   ├── Content Tab
│   │   │   │   │   ├── Markdown Content
│   │   │   │   │   └── Key Points
│   │   │   │   │
│   │   │   │   ├── Code Tab
│   │   │   │   │   └── Code Examples (map)
│   │   │   │   │       └── Syntax Highlighter
│   │   │   │   │
│   │   │   │   └── Quiz Tab
│   │   │   │       └── Quiz Questions (map)
│   │   │   │           ├── Question
│   │   │   │           ├── Options
│   │   │   │           ├── Submit Button
│   │   │   │           └── Result Feedback
│   │   │   │
│   │   │   ├── Complete Button
│   │   │   └── Navigation (Prev/Next)
│   │   │
│   │   ├── Dashboard (Protected)
│   │   │   ├── Welcome Header
│   │   │   ├── Stats Grid
│   │   │   ├── Category Progress
│   │   │   └── Recent Activity
│   │   │
│   │   ├── Progress (Protected)
│   │   │   ├── Overall Stats
│   │   │   ├── Category Breakdown
│   │   │   └── Recent Activity List
│   │   │
│   │   ├── Login
│   │   │   └── Login Form
│   │   │
│   │   └── Register
│   │       └── Registration Form
│   │
│   └── Footer
│       ├── About Section
│       ├── Quick Links
│       └── Social Links
```

## State Management

```
Zustand Stores:

authStore
├── user (object)
├── token (string)
├── isAuthenticated (boolean)
├── login(user, token) (function)
├── logout() (function)
└── updateUser(data) (function)

progressStore
├── overview (object)
├── currentLessonProgress (object)
├── setOverview(data) (function)
├── setCurrentLessonProgress(data) (function)
└── updateLessonProgress(id, data) (function)
```

## Security Flow

```
┌──────────────────┐
│  User Login      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Verify Password  │
│ (bcrypt compare) │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Generate JWT    │
│  • userId        │
│  • username      │
│  • exp: 7 days   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Return to Client │
│ Store in:        │
│ • localStorage   │
│ • Zustand store  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Subsequent       │
│ Requests         │
│ Header:          │
│ Authorization:   │
│ Bearer <token>   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Backend Verifies │
│ JWT Signature    │
│ & Expiration     │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐  ┌──────┐
│Valid │  │Invalid│
└───┬──┘  └───┬──┘
    │         │
    │         ▼
    │    ┌──────────┐
    │    │ Return   │
    │    │ 401/403  │
    │    └──────────┘
    │
    ▼
┌──────────────────┐
│ Process Request  │
│ with user context│
└──────────────────┘
```

This diagram shows the complete architecture of the Interview Preparation Platform!
