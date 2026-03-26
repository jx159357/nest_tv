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
  - `npm run lint:check` passes.
  - Latest full snapshot: `0 errors + 0 warnings`.

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

- Preserve the now-clean backend lint/build state while doing follow-up validation.
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
  - `backend/src/danmaku/controllers/danmaku.controller.ts`
  - `backend/src/danmaku/services/danmaku.service.ts`
  - `backend/src/parse-providers/parse-providers.service.ts`
  - `backend/src/iptv/iptv.service.ts`
  - `backend/src/main.ts`
  - `backend/src/data-collection/data-collection.controller.ts`
  - `backend/src/data-collection/data-collection.service.ts`
  - `backend/src/redis/redis.module.ts`
  - `backend/src/media/media-resource.service.ts`
  - `backend/src/media/media-resource.controller.ts`
  - `backend/src/common/utils/advanced-cache-manager.util.ts`
  - `backend/src/recommendations/recommendation.service.ts`
  - `backend/src/recommendations/recommendation.controller.ts`
  - `backend/src/middleware/rate-limit.middleware.ts`
  - `backend/src/middleware/performance-monitoring.middleware.ts`
  - `backend/src/middleware/request-logging.middleware.ts`
  - `backend/src/decorators/current-user.decorator.ts`
  - `backend/src/decorators/user.decorator.ts`
  - `backend/src/gateway/danmaku.gateway.ts`
  - `backend/src/entities/admin-role.entity.ts`
  - `backend/src/entities/admin-permission.entity.ts`
  - `backend/src/entities/parse-provider.entity.ts`
  - `backend/src/entities/danmaku.entity.ts`
  - `backend/src/entities/iptv-channel.entity.ts`
  - `backend/src/entities/media-resource.entity.ts`
  - `backend/src/initialization/initialization.service.ts`
  - `backend/src/play-sources/dtos/play-source.dto.ts`
  - `backend/src/play-sources/play-source.service.ts`
  - `backend/src/play-sources/play-source.controller.ts`
  - `backend/src/media/dtos/media-resource-response.dto.ts`
  - `backend/src/media/dtos/search-history.dto.ts`
  - `backend/src/iptv/dto/create-iptv-channel.dto.ts`
- Current highest-value backend files:
  - No remaining backend lint hotspots.

## Suggested Next Steps

1. Re-run backend unit tests and e2e tests after the lint cleanup milestone.
2. Then decide whether to continue broader refactors or shift back to product work.
3. Re-run:
   - `backend npm run lint:check`
   - `backend npm run build`
   - `backend npx jest --runInBand`
   - `backend npx jest --config ./test/jest-e2e.json --runInBand`

## Notes For Continuation

- If context is lost, restart from the commands above and inspect `git status --short`.
- The backend lint debt has been cleaned to zero.
- This round reduced backend lint from about `176 + 5` to `0 + 0`.
- Avoid reverting the staged removals under `backend/dist` and `.env.production`; those are intentional index cleanups.
