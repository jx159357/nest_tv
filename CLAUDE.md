# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a video streaming platform built with NestJS backend and Vue3 frontend, featuring user authentication, media resource management, and multi-source playback functionality. The project uses MySQL for data storage and Redis for caching.

## Common Development Commands

### Backend (NestJS)
```bash
cd backend
npm install                          # Install dependencies
npm run start:dev                    # Start development server with hot reload
npm run start                        # Start production server
npm run build                        # Build the project
npm run test                         # Run unit tests
npm run test:e2e                     # Run end-to-end tests
npm run test:cov                     # Run tests with coverage
npm run lint                         # Run ESLint
npm run format                       # Format code with Prettier
```

### Frontend (Vue3 + Vite)
```bash
cd frontend/tv-frontend
npm install                          # Install dependencies
npm run dev                          # Start development server
npm run build                        # Build for production
npm run preview                      # Preview production build
```

### Database Setup
```bash
cd backend
npm run init-database                # Initialize database (if script exists)
# Or manually: TypeORM will auto-create tables on first start
```

## Architecture Overview

### Backend Structure (NestJS)
The backend follows a modular NestJS architecture:

- **Modules**: Feature-based organization (auth, users, media, play-sources)
- **Entities**: TypeORM entities defining database tables (User, MediaResource, PlaySource, WatchHistory)
- **Controllers**: Handle HTTP requests and validation
- **Services**: Business logic and data operations
- **Strategies**: JWT and Local authentication strategies
- **DTOs**: Data transfer objects for API communication

### Frontend Structure (Vue3)
The frontend uses Vue3 with composition API and UnoCSS:

- **Components**: Reusable Vue components
- **Views**: Page-level components
- **Stores**: Pinia for state management
- **Router**: Vue Router for navigation
- **Utils**: Helper functions and utilities

### Database Schema
Core entities with relationships:
- **User**: Authentication and user profile data
- **MediaResource**: Video content metadata (movies, series, etc.)
- **PlaySource**: Video URLs and playback information
- **WatchHistory**: User viewing progress and history

## Key Development Notes

### Circular Dependency Resolution
The project previously had circular dependencies between UserModule and AuthModule. When working with authentication:
- AuthService depends on UserService
- Use forwardRef() when needed to break circular imports
- Keep module imports clean and one-directional when possible

### Authentication Flow
- User registration: UserService → bcrypt password hashing → User entity
- User login: LocalStrategy → AuthService → JWT token generation
- Protected routes: JwtAuthGuard → JwtStrategy → UserService validation

### Database Configuration
- TypeORM configured with MySQL, auto-sync in development
- Redis for caching and session management
- Environment variables in backend/.env file

### API Design Patterns
- RESTful endpoints with proper HTTP methods
- DTOs for input validation and serialization
- JWT tokens for authentication in Authorization headers
- Error handling with proper HTTP status codes

### Frontend Integration
- Vue3 composition API for component logic
- UnoCSS for utility-first styling
- Axios for HTTP requests to backend APIs
- Vue Router for client-side navigation

## Development Workflow
1. **Backend Development**: Create modules → entities → services → controllers
2. **Frontend Development**: Create views → components → stores → routing
3. **Database Changes**: Update entities → TypeORM handles migrations
4. **Testing**: Write unit tests for services, e2e tests for APIs
5. **Code Quality**: Run linting and formatting before commits