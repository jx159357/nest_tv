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

<!-- BEGIN SUPER DEV CLAUDE -->
# Super Dev Claude Code Integration

This project uses a pipeline-driven development model.

## Positioning
- Super Dev does not own a model endpoint.
- Claude Code remains the execution host for coding capability.
- Super Dev provides governance: protocol, gates, and audit artifacts.

## Runtime Contract
- Treat Super Dev as the local Python workflow tool plus Claude Code `CLAUDE.md + Skills` integration.
- Primary surfaces are project-root `CLAUDE.md`, compatibility mirror `.claude/CLAUDE.md`, project-level `.claude/skills/super-dev/`, and user-level `~/.claude/skills/super-dev/`.
- Compatibility surface `.claude/commands/super-dev.md` remains installed so older Claude Code builds still converge onto the same Super Dev workflow.
- Optional repo enhancement surfaces `.claude-plugin/marketplace.json` and `plugins/super-dev-claude/.claude-plugin/plugin.json` can expose a richer Claude-native plugin layer without replacing the base `CLAUDE.md + Skills` contract.
- When the user triggers `/super-dev`, `super-dev:`, or `super-dev：`, enter the Super Dev pipeline immediately rather than handling it like casual chat.
- Use Claude Code browse/search for research and Claude Code terminal/editing for implementation.
- Use local `super-dev` commands whenever you need to generate/update docs, spec artifacts, quality reports, and delivery outputs.

## First-Response Contract
- On the first reply after a host-supported Super Dev entry (for example `/super-dev ...`, `$super-dev`, `super-dev: ...`, `super-dev：...`, `/super-dev-seeai ...`, `$super-dev-seeai`, `super-dev-seeai: ...`, or `super-dev-seeai：...`), explicitly state that the matching Super Dev mode is now active rather than normal chat mode.
- If the repository already contains `super-dev.yaml`, `.super-dev/WORKFLOW.md`, `output/*`, `.super-dev/review-state/*`, or an unfinished run state, the first natural-language requirement in a new host session must also default to continuing Super Dev rather than plain chat.
- Before the first reply, read `.super-dev/WORKFLOW.md` and `output/*-bootstrap.md` when present, and treat them as the explicit bootstrap contract for this repository.
- The first reply must explicitly state that the current phase is `research`, and that you will read `knowledge/` plus `output/knowledge-cache/*-knowledge-bundle.json` first when available before similar-product research.
- In standard mode, the next sequence is research -> three core documents -> wait for user confirmation -> Spec / tasks -> frontend first with runtime verification -> backend / tests / delivery.
- In SEEAI mode, the next sequence is research -> compact competition docs -> wait for user confirmation -> compact Spec -> full-stack sprint -> polish / handoff.
- Both modes must explicitly promise that they will stop after the three core documents and wait for approval before creating Spec or writing code.

## Local Knowledge Contract
- Read relevant files under `knowledge/` before drafting PRD, architecture, and UIUX.
- If `output/knowledge-cache/*-knowledge-bundle.json` exists, read it first and inherit its local knowledge hits into later stages.
- Treat matched local standards, scenario packs, and checklists as hard constraints, not optional hints.

## Conversation Continuity Contract
- If `.super-dev/SESSION_BRIEF.md` exists, read it before responding and treat it as the active workflow state.
- If the workflow is waiting for docs confirmation, preview confirmation, UI revision, architecture revision, or quality revision, then user replies like `修改`, `补充`, `继续改`, `确认`, `通过`, `继续`, or detailed feedback remain inside the current Super Dev stage.
- After each requested revision inside a gate, stay in the same stage, update the required artifacts, summarize what changed, and wait again for explicit confirmation.
- Do not silently exit Super Dev mode because the user asked for several edits, follow-up questions, or extra constraints.
- Only leave the current Super Dev workflow if the user explicitly says to cancel the workflow, restart from scratch, or switch back to normal chat.

## Before coding
1. If Claude Code browse/search is available, research similar products first and write output/*-research.md as a real repository file
2. Read output/*-prd.md
3. Read output/*-architecture.md
4. Read output/*-uiux.md
5. Summarize the three core documents to the user and wait for explicit confirmation before creating Spec or coding
6. Chat-only summaries do not count as completion; the required artifacts must exist in the workspace
7. Read output/*-execution-plan.md
8. Follow .super-dev/changes/*/tasks.md after confirmation, with frontend-first implementation and runtime verification

9. If the user requests a UI redesign or says the UI is unsatisfactory, first update `output/*-uiux.md`, then redo the frontend, and rerun frontend runtime + UI review before continuing.

## Output Quality
- Keep security/performance constraints from red-team report.
- Ensure quality gate threshold is met before merge.
- UI must follow output/*-uiux.md and avoid AI-looking templates (purple gradient, emoji icons, default-font-only).
- Before any UI implementation, lock the icon library, typography, design token system, component ecosystem, and page skeleton from output/*-uiux.md.
- Do not use emoji as functional icons or placeholders.
- For non-conversational AI products, avoid Claude / ChatGPT-style shells unless the UI plan explicitly justifies them.
- UI implementation must define typography system, design tokens, page hierarchy and component states before polishing visuals.
- Prioritize real screenshots, trust modules, proof points and task flows over decorative hero sections.

## Coding Constraints (active during ALL coding phases)

These rules apply every time you write or edit a file. They are NOT suggestions:

### Tech Stack Pre-Research
- Before writing ANY code, run `cat package.json` (or equivalent) to check framework versions.
- If unsure about an API for the installed version, use WebFetch to read official docs first.
- Never guess API signatures. Check docs.

### Icon & Visual Rules
- Icons MUST come from a declared icon library (Lucide/Heroicons/Tabler). No emoji as icons.
- No purple/pink gradient themes. No default system font only.
- Before showing any UI code, self-check: no emoji characters in the source.

### Frontend/Backend Alignment
- Frontend fetch URLs must exactly match backend route definitions.
- Define API paths as shared constants when possible.

### Per-File Self-Check
- Before writing each file: correct imports, no emoji, colors from tokens only.
- After completing a feature, run build + lint. Fix errors before moving on.

### Host-First Governance During Coding
- 完成 UI 后，优先在宿主里继续当前流程并触发 `/super-dev-review ui`，不要把内部 CLI 当成日常开发入口。
- 需要进入质量与交付时，优先在宿主里继续当前流程或用 `/super-dev-run quality`、`/super-dev-review quality` 这类宿主交互面。
- 终端侧 `super-dev` CLI 保留给维护与治理补救，不负责日常脚手架、实现与返工调度。

## Four-Layer Governance Model

Super Dev governance operates at four layers:

**Layer 1 — CLAUDE.md (Persistent Rules)**
Project-root `CLAUDE.md` is the canonical persistent memory surface. `.claude/CLAUDE.md` is kept as a compatibility mirror for builds that still read nested memory files.

**Layer 2 — Skills (Primary Execution Contract)**
Project-level `.claude/skills/super-dev/` and user-level `~/.claude/skills/super-dev/` carry the primary Super Dev execution contract. Claude Code only uses `super-dev` as the single skill name; old legacy aliases are only retained for cleanup/migration paths.

**Layer 3 — Hooks (Runtime Enforcement)**
PreToolUse hooks validate every file write. PostToolUse hooks audit results.
Hooks are auto-registered when /super-dev is invoked.

**Layer 4 — CLI Commands & Optional Plugin Enhancement (On-Demand Checks)**
Maintenance-only CLI checks may still exist behind the scenes, but ordinary development should stay on host entry surfaces instead of teaching users `enforce` / `quality` command habits.
If Claude Code surfaces repo plugins, `.claude-plugin/marketplace.json` + `plugins/super-dev-claude/.claude-plugin/plugin.json` should enhance the same Super Dev flow rather than fork it.

## Super Dev System Flow Contract
- SUPER_DEV_FLOW_CONTRACT_V1
- PHASE_CHAIN: research>docs>docs_confirm>spec>frontend>preview_confirm>backend>quality>delivery
- DOC_CONFIRM_GATE: required
- PREVIEW_CONFIRM_GATE: required
- HOST_PARITY: required
<!-- END SUPER DEV CLAUDE -->
