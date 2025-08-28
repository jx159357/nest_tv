# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a NestJS-based TV application repository. The project is currently empty and will need to be initialized with NestJS.

## Common Development Commands
- `npm install -g @nestjs/cli`: Install NestJS CLI globally (if not already installed)
- `nest new .`: Initialize a new NestJS project in the current directory
- `npm install`: Install project dependencies
- `npm run start`: Start the development server
- `npm run start:dev`: Start the development server with hot reload
- `npm run build`: Build the project
- `npm run test`: Run unit tests
- `npm run test:e2e`: Run end-to-end tests
- `npm run test:cov`: Run tests with coverage

## Project Structure (Typical NestJS)
- `src/`: Source code directory
  - `main.ts`: Application entry point
  - `app.module.ts`: Root application module
  - `app.controller.ts`: Main application controller
  - `app.service.ts`: Main application service
- `test/`: Test files
- `dist/`: Compiled output directory

## Architecture Notes
NestJS follows a modular architecture:
- Modules organize code into feature areas
- Controllers handle incoming requests
- Services contain business logic
- Providers are injectable dependencies
- Entities represent data models (when using TypeORM)

## Development Workflow
1. Initialize the NestJS project if not already done
2. Create modules for different features
3. Implement controllers for handling HTTP requests
4. Develop services for business logic
5. Add tests for all functionality
6. Run linting and formatting tools