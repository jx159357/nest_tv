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
  - Latest full snapshot: `365 errors + 18 warnings` across `32` files.

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
- Latest cleaned files:
  - `backend/src/common/services/proxy-pool.service.ts`
  - `backend/src/common/services/proxy-provider.service.ts`
  - `backend/src/common/services/proxy-monitoring.service.ts`
  - `backend/src/controllers/proxy-pool.controller.ts`
  - `backend/src/scheduler/crawler-scheduler.service.ts`
  - `backend/src/crawler/crawler.controller.ts`
  - `backend/src/crawler/crawler.service.ts`
  - `backend/src/media/advanced-search.controller.ts`
  - `backend/src/media/advanced-search.service.ts`
- Current highest-value backend files:
  - `backend/src/danmaku/services/danmaku.service.ts`
  - `backend/src/parse-providers/parse-providers.service.ts`
  - `backend/src/iptv/iptv.service.ts`

## Suggested Next Steps

1. Continue with backend `danmaku` lint cleanup, starting from `danmaku.service.ts`.
2. Then move to `parse-providers.service.ts` and `iptv.service.ts`.
3. Re-run:
   - `backend npm run lint:check`
   - `backend npm run build`
   - `backend npx jest --runInBand`
   - `backend npx jest --config ./test/jest-e2e.json --runInBand`

## Notes For Continuation

- If context is lost, restart from the commands above and inspect `git status --short`.
- The backend lint count has been reduced significantly, but it is not clean yet.
- This round reduced backend lint from about `549 + 55` to `365 + 18`.
- Avoid reverting the staged removals under `backend/dist` and `.env.production`; those are intentional index cleanups.
