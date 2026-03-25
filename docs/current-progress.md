# Current Progress

## Current State

- Frontend:
  - `npm run type-check` passes.
  - `npx vitest run` passes.
  - `npm run build` passes.
- Backend:
  - `npm run build` passes.
  - `npx jest --runInBand` passes.
  - `npx jest --config ./test/jest-e2e.json --runInBand` passes.
  - `npm run lint:check` still fails, but ESLint project parsing is fixed and the remaining debt is now concentrated in a few modules.

## High-Value Work Already Completed

- Main user flow is connected for authenticated usage:
  - register -> login -> home -> detail -> watch -> watch history -> profile
- Frontend API/client alignment fixed.
- Frontend route guards added.
- Watch progress persistence wired back into watch history.
- Deployment foundation repaired:
  - Dockerfiles rewritten
  - compose files unified
  - `.env.example` files added
  - `.gitignore` / `.dockerignore` added
- Git index cleanup executed for tracked artifacts and secrets:
  - `backend/node_modules`
  - `backend/dist`
  - `.env.production`

## Current Priority

- Continue reducing backend lint debt without destabilizing runtime behavior.
- Current highest-value backend files:
  - `backend/src/common/cache/cache.service.ts`
  - `backend/src/common/decorators/cache.decorator.ts`
  - `backend/src/common/controllers/health.controller.ts`

## Suggested Next Steps

1. Finish cleaning backend `common/cache` and `health` lint errors.
2. Re-run:
   - `backend npm run lint:check`
   - `backend npm run build`
   - `backend npx jest --runInBand`
   - `backend npx jest --config ./test/jest-e2e.json --runInBand`
3. Move to crawler/recommendation/admin module lint cleanup.

## Notes For Continuation

- If context is lost, restart from the commands above and inspect `git status --short`.
- The backend lint count has been reduced significantly, but it is not clean yet.
- Avoid reverting the staged removals under `backend/dist` and `.env.production`; those are intentional index cleanups.
