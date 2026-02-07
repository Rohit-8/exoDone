# Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** (201 Created)
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** (200 OK)
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get Current User
```http
GET /api/auth/me
```

**Headers:** `Authorization: Bearer <token>`

**Response:** (200 OK)
```json
{
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_login": "2024-01-02T12:00:00.000Z"
  }
}
```

---

### Categories

#### Get All Categories
```http
GET /api/categories
```

**Response:** (200 OK)
```json
{
  "categories": [
    {
      "id": 1,
      "name": "Software Architecture",
      "slug": "architecture",
      "description": "Master system design...",
      "icon": "🏗️",
      "order_index": 1
    }
  ]
}
```

#### Get Category by Slug
```http
GET /api/categories/:slug
```

**Response:** (200 OK)
```json
{
  "category": {
    "id": 1,
    "name": "Software Architecture",
    "slug": "architecture",
    "description": "...",
    "topics": [
      {
        "id": 1,
        "name": "Basic Architecture Concepts",
        "slug": "basic-architecture",
        "lesson_count": 5,
        "avg_time": 150
      }
    ]
  }
}
```

---

### Topics

#### Get All Topics
```http
GET /api/topics?category=<slug>&difficulty=<level>
```

**Query Parameters:**
- `category` (optional): Filter by category slug
- `difficulty` (optional): Filter by difficulty level

**Response:** (200 OK)
```json
{
  "topics": [
    {
      "id": 1,
      "name": "OOP Fundamentals",
      "slug": "oop-fundamentals",
      "difficulty_level": "beginner",
      "category_name": "Backend Development",
      "lesson_count": 8
    }
  ]
}
```

#### Get Topic by Slug
```http
GET /api/topics/:slug
```

**Response:** (200 OK)
```json
{
  "topic": {
    "id": 1,
    "name": "OOP Fundamentals",
    "slug": "oop-fundamentals",
    "description": "...",
    "difficulty_level": "beginner",
    "lessons": [
      {
        "id": 1,
        "title": "Classes and Objects",
        "slug": "classes-objects",
        "summary": "...",
        "code_example_count": 3,
        "quiz_count": 5,
        "user_status": "completed",
        "progress_percentage": 100
      }
    ]
  }
}
```

---

### Lessons

#### Get Lesson by Slug
```http
GET /api/lessons/:slug
```

**Response:** (200 OK)
```json
{
  "lesson": {
    "id": 1,
    "title": "Classes and Objects in C#",
    "slug": "classes-objects-csharp",
    "content": "# Classes and Objects...",
    "summary": "...",
    "difficulty_level": "beginner",
    "estimated_time": 30,
    "key_points": ["...", "..."],
    "userProgress": {
      "status": "in_progress",
      "progress_percentage": 50
    }
  },
  "codeExamples": [
    {
      "id": 1,
      "title": "Simple Person Class",
      "language": "csharp",
      "code": "public class Person {...}",
      "explanation": "..."
    }
  ],
  "quizQuestions": [
    {
      "id": 1,
      "question_text": "What is a class?",
      "question_type": "multiple_choice",
      "options": ["...", "..."],
      "difficulty": "easy",
      "points": 10
    }
  ],
  "navigation": {
    "previous": {
      "id": 0,
      "title": "...",
      "slug": "..."
    },
    "next": {
      "id": 2,
      "title": "...",
      "slug": "..."
    }
  }
}
```

#### Search Lessons
```http
GET /api/lessons/search?q=<query>&difficulty=<level>&category=<slug>
```

**Query Parameters:**
- `q` (required): Search query
- `difficulty` (optional): Filter by difficulty
- `category` (optional): Filter by category

**Response:** (200 OK)
```json
{
  "results": [
    {
      "id": 1,
      "title": "Classes and Objects",
      "slug": "classes-objects",
      "topic_name": "OOP Fundamentals",
      "category_name": "Backend Development",
      "rank": 0.123
    }
  ]
}
```

---

### Progress (Protected Routes)

#### Get Progress Overview
```http
GET /api/progress/overview
```

**Headers:** `Authorization: Bearer <token>`

**Response:** (200 OK)
```json
{
  "categoryProgress": [
    {
      "category_name": "Backend Development",
      "category_slug": "backend",
      "total_lessons": 20,
      "completed_lessons": 5,
      "progress_percentage": 25
    }
  ],
  "recentActivity": [
    {
      "id": 1,
      "lesson_title": "Classes and Objects",
      "lesson_slug": "classes-objects",
      "topic_name": "OOP Fundamentals",
      "category_name": "Backend Development",
      "status": "in_progress",
      "progress_percentage": 50,
      "time_spent": 15,
      "last_accessed": "2024-01-02T12:00:00.000Z"
    }
  ]
}
```

#### Update Lesson Progress
```http
POST /api/progress/lesson/:lessonId
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "in_progress",
  "progressPercentage": 75,
  "timeSpent": 10,
  "notes": "Optional notes"
}
```

**Response:** (200 OK)
```json
{
  "message": "Progress updated successfully",
  "progress": {
    "id": 1,
    "user_id": 1,
    "lesson_id": 1,
    "status": "in_progress",
    "progress_percentage": 75,
    "time_spent": 25
  }
}
```

---

### Quiz (Protected Routes)

#### Submit Quiz Answer
```http
POST /api/quiz/submit
```

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "questionId": 1,
  "userAnswer": "A blueprint or template for creating objects"
}
```

**Response:** (200 OK)
```json
{
  "isCorrect": true,
  "pointsEarned": 10,
  "explanation": "A class is indeed a blueprint...",
  "correctAnswer": "A blueprint or template for creating objects",
  "attempt": {
    "id": 1,
    "is_correct": true,
    "points_earned": 10,
    "attempt_number": 1
  }
}
```

#### Get Quiz Statistics
```http
GET /api/quiz/stats
```

**Headers:** `Authorization: Bearer <token>`

**Response:** (200 OK)
```json
{
  "stats": {
    "total_attempts": 50,
    "correct_answers": 40,
    "total_points": 450,
    "accuracy_percentage": 80
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common Status Codes:**
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (valid token but insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting is implemented, but it's recommended to add it in production.

## CORS

The API accepts requests from the configured `CORS_ORIGIN` environment variable (default: `http://localhost:3000`).
