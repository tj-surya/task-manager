# Task Management API

A production-ready RESTful API built with **NestJS**, **TypeORM**, and **PostgreSQL**. Supports full user and task management with JWT authentication, soft deletes, pagination, and Swagger documentation.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Configuration](#environment-configuration)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Authentication Flow](#authentication-flow)
- [Bonus Features](#bonus-features)
- [Running Tests](#running-tests)

---

## Tech Stack

| Layer          | Technology              |
|----------------|-------------------------|
| Framework      | NestJS 10               |
| Language       | TypeScript 5            |
| ORM            | TypeORM 0.3             |
| Database       | PostgreSQL 15           |
| Authentication | JWT + Passport          |
| Validation     | class-validator         |
| Documentation  | Swagger (@nestjs/swagger)|
| Containerization | Docker + Docker Compose |

---

## Project Structure

```
src/
├── main.ts                        # Entry point — Swagger, pipes, filters
├── app.module.ts                  # Root module — TypeORM config
├── config/
│   ├── config.module.ts           # Global config module
│   └── config.service.ts          # Typed env variable access
├── common/
│   ├── dto/
│   │   └── pagination.dto.ts      # Shared limit/offset pagination
│   ├── filters/
│   │   └── http-exception.filter.ts  # Global structured error handler
│   └── interceptors/
│       └── logging.interceptor.ts    # Request/response logging
├── users/
│   ├── entities/user.entity.ts    # User DB model
│   ├── dto/create-user.dto.ts     # Validated create payload
│   ├── users.service.ts           # Business logic
│   ├── users.controller.ts        # Route handlers
│   └── users.module.ts
├── tasks/
│   ├── entities/task.entity.ts    # Task DB model (soft delete)
│   ├── dto/create-task.dto.ts
│   ├── dto/update-task.dto.ts
│   ├── dto/filter-task.dto.ts     # Status filter + pagination
│   ├── tasks.service.ts
│   ├── tasks.controller.ts
│   └── tasks.module.ts
└── auth/
    ├── dto/login.dto.ts
    ├── guards/jwt-auth.guard.ts
    ├── strategies/jwt.strategy.ts
    ├── auth.service.ts
    ├── auth.controller.ts
    └── auth.module.ts
```

---

## Setup Instructions

### Option A — Local (Node + PostgreSQL)

**Prerequisites:** Node.js 18+, PostgreSQL 14+

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/task-management-api.git
cd task-management-api

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 4. Create the database
psql -U postgres -c "CREATE DATABASE task_management;"

# 5. Start in development mode (auto-syncs schema)
npm run start:dev
```

### Option B — Docker Compose (Recommended)

**Prerequisites:** Docker + Docker Compose

```bash
# 1. Clone and enter the project
git clone https://github.com/YOUR_USERNAME/task-management-api.git
cd task-management-api

# 2. Copy environment file
cp .env.example .env

# 3. Build and start all services
docker-compose up --build

# Stop services
docker-compose down

# Stop and remove volumes (resets DB)
docker-compose down -v
```

Once running, visit:
- **API Base URL:** `http://localhost:3000/api`
- **Swagger UI:** `http://localhost:3000/api/docs`

---

## Environment Configuration

Copy `.env.example` to `.env` and fill in your values:

```env
# Application
PORT=3000
NODE_ENV=development       # development | production

# PostgreSQL
DB_HOST=localhost          # Use 'db' when running via Docker Compose
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=task_management

# JWT Authentication
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d
```

> ⚠️ **Important:** Never commit your real `.env` file. It is git-ignored by default.

> 💡 **Schema sync:** `synchronize: true` is enabled in `development` mode — TypeORM auto-creates/updates tables. In production, use migrations instead.

---

## Database Schema

### `users` table

| Column      | Type        | Constraints              |
|-------------|-------------|--------------------------|
| `id`        | UUID        | Primary Key, auto-gen    |
| `name`      | VARCHAR(100)| NOT NULL                 |
| `email`     | VARCHAR(255)| NOT NULL, UNIQUE         |
| `password`  | VARCHAR     | nullable, hidden in API  |
| `createdAt` | TIMESTAMP   | auto-set on insert       |

### `tasks` table

| Column        | Type        | Constraints                        |
|---------------|-------------|------------------------------------|
| `id`          | UUID        | Primary Key, auto-gen              |
| `title`       | VARCHAR(200)| NOT NULL                           |
| `description` | TEXT        | nullable                           |
| `status`      | ENUM        | `TODO` \| `IN_PROGRESS` \| `DONE`, default `TODO` |
| `userId`      | UUID        | Foreign Key → `users.id`           |
| `createdAt`   | TIMESTAMP   | auto-set on insert                 |
| `deletedAt`   | TIMESTAMP   | nullable — used for soft deletes   |

### Relationships

```
users  1 ──────< tasks  (One-to-Many)
```

---

## API Endpoints

All routes are prefixed with `/api`.

### Auth

| Method | Route         | Auth | Description              |
|--------|---------------|------|--------------------------|
| POST   | `/auth/login` | ❌   | Login → returns JWT token|

### Users

| Method | Route               | Auth | Description                    |
|--------|---------------------|------|--------------------------------|
| POST   | `/users`            | ❌   | Register a new user            |
| GET    | `/users`            | ✅   | List all users (paginated)     |
| GET    | `/users/:id`        | ✅   | Get user by ID                 |
| GET    | `/users/:id/tasks`  | ✅   | Get all tasks for a user       |

### Tasks

| Method | Route               | Auth | Description                          |
|--------|---------------------|------|--------------------------------------|
| POST   | `/tasks`            | ✅   | Create a new task                    |
| GET    | `/tasks`            | ✅   | List tasks (filter by status, paginate)|
| GET    | `/tasks/:id`        | ✅   | Get task by ID                       |
| PATCH  | `/tasks/:id`        | ✅   | Update task title/description/status |
| DELETE | `/tasks/:id`        | ✅   | Soft-delete a task                   |
| POST   | `/tasks/:id/restore`| ✅   | Restore a soft-deleted task          |

### Query Parameters

**Pagination** (all list endpoints):
```
?limit=10&offset=0
```

**Filter tasks by status:**
```
GET /api/tasks?status=TODO
GET /api/tasks?status=IN_PROGRESS
GET /api/tasks?status=DONE
```

### Error Response Format

All errors follow this structure:

```json
{
  "statusCode": 404,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/tasks/invalid-id",
  "method": "GET",
  "error": "Not Found",
  "message": "Task with ID 'invalid-id' not found"
}
```

---

## Authentication Flow

1. **Register** a user with `POST /api/users` (include a `password` field)
2. **Login** via `POST /api/auth/login` with `email` + `password`
3. **Copy** the `access_token` from the response
4. **Add** to all protected requests: `Authorization: Bearer <token>`

```bash
# Step 1: Register
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"secret123"}'

# Step 2: Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret123"}'

# Step 3: Use token
curl http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <your_token_here>"
```

---

## Bonus Features

| Feature | Status | Details |
|---------|--------|---------|
| Pagination | ✅ | `limit` + `offset` on all list endpoints |
| Soft Delete | ✅ | `DELETE /tasks/:id` → recoverable via `POST /tasks/:id/restore` |
| JWT Auth | ✅ | Bearer token via `POST /auth/login` |
| Dockerized | ✅ | `docker-compose up --build` |
| Swagger Docs | ✅ | `/api/docs` |
| Global Error Filter | ✅ | Structured JSON errors |
| Request Logging | ✅ | Method, URL, status, duration |

---

## Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```
