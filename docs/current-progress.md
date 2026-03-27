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
- Recommendation page is now wired to live backend data:
  - personalized recommendations from watch history
  - trending recommendations
  - top-rated recommendations
- Admin management is partially activated with real data:
  - admin dashboard uses live backend stats and health data
  - admin users list uses real `/admin/users`
  - admin media list uses real `/admin/media`
  - admin play sources list uses real `/admin/play-sources`
  - admin watch history uses real `/admin/watch-history`
  - admin logs uses real `/admin/logs`
- Admin backend placeholders reduced further:
  - backend admin controller now returns real paginated data for users / media / play sources / watch history
- Crawler persistence is improved:
  - `crawler/crawl-and-save` now auto-creates play sources from discovered playable/download URLs
  - repeated imports skip existing media and only sync missing play sources
- Daily source collection is now wired into the app scheduler:
  - daily job collects candidate URLs from configured collection sources
  - crawled resources are persisted and synced into play sources
  - recently created active play sources are automatically revalidated for stability
  - source-level collection policy now exists (`dailyEnabled`, `dailyLimit`, `proxyMode`)
  - scheduler exposes last-run summary and manual trigger endpoints for observability/debugging
  - source-level `proxyMode` is now applied to collection requests (`direct` / `prefer-proxy` / `proxy-required`)
- source health summaries are now available for UI/dashboard consumption (active rate, recent additions, latest checks)
- source quality scoring and recommended proxy mode are now computed from real play-source health data
- daily scheduler now prioritizes stronger sources first and dynamically reduces fetch volume for lower-quality sources
- crawler UI now shows source quality score, suggested proxy mode, and runtime-editable source collection policy controls
- data-collection detail extraction is richer now:
  - source selectors support director / actors / genres / releaseDate / downloadUrls
  - collected media data now carries more structured metadata before persistence
  - download/playable URL extraction now scans both DOM links and page text for magnet / thunder / ftp / ed2k / m3u8 / direct video links
- Torrent aggregation is improved:
  - backend `torrent` endpoints now read real magnet play sources from the database instead of returning random placeholder data
  - supported operations now include local magnet parsing, info lookup, health summary, search, popular, and latest
- Frontend crawler management is improved:
  - `CrawlerView` now uses a dedicated API client instead of placeholder/nonexistent store methods
  - crawl results now surface persistence feedback such as created media ID and created/skipped play source counts
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
  - Next product-facing expansion can target remaining admin placeholders, torrent placeholders, or richer recommendation algorithms.

## Suggested Next Steps

1. Re-run backend unit tests and e2e tests after the lint cleanup milestone.
2. Continue product work from the remaining placeholders:
   - frontend remaining admin views (`roles` and related permission management polish)
   - richer recommendation UX and algorithm tuning
   - crawler/data-collection source quality and extraction depth
   - scheduled task observability / task result dashboard
   - play source validation depth (stream probing, parser verification, magnet metadata enrichment)
   - source-specific proxy execution policy (only where truly needed)
3. Re-run:
   - `backend npm run lint:check`
   - `backend npm run build`
   - `frontend npm run type-check`
   - `frontend npm run build`
   - `backend npx jest --runInBand`
   - `backend npx jest --config ./test/jest-e2e.json --runInBand`

## Notes For Continuation

- If context is lost, restart from the commands above and inspect `git status --short`.
- The backend lint debt has been cleaned to zero.
- This round reduced backend lint from about `176 + 5` to `0 + 0`.
- Follow-up product enhancement completed: recommendations frontend now consumes real backend recommendation endpoints.
- Follow-up product enhancement completed: core admin dashboard/users/media/play-sources pages now consume real backend management endpoints.
- Follow-up product enhancement completed: `admin/watch-history` and `admin/logs` now consume real backend endpoints.
- Follow-up aggregation enhancement completed: crawler save flow now persists playable source records alongside media resources.
- Follow-up aggregation enhancement completed: torrent endpoints are now backed by real stored magnet sources, and crawler UI now displays persistence/play-source creation results.
- Follow-up aggregation enhancement completed: a daily scheduled collection job now crawls candidate resource pages and revalidates recent play sources.
- Follow-up aggregation enhancement completed: source-level daily collection policy and scheduler summary/manual-run endpoints are now in place.
- Follow-up aggregation enhancement completed: collection requests now honor per-source proxy policy and can gracefully fall back or fail fast depending on source configuration.
- Follow-up aggregation enhancement completed: crawler management UI now shows daily collection status and source-level health/quality metrics.
- Follow-up aggregation enhancement completed: daily collection now skips empty-shell resources lacking playable links and allocates crawl budget based on source quality score.
- Follow-up aggregation enhancement completed: detail-page extraction now produces richer structured media metadata, improving aggregation quality.
- Follow-up stability enhancement completed: play-source ordering now prefers more directly playable and recently validated sources, while the daily validation pass now prioritizes active sources that have gone the longest without a check.
- Follow-up observability enhancement completed: `data-collection/statistics` now returns real aggregated source/media/play-source metrics, and crawler management UI now displays a real collection overview plus per-source media ingestion timestamps.
- Follow-up admin enhancement completed: `AdminDashboard` now surfaces the real stable-source collection overview, so source availability/quality monitoring is visible on the backend home page instead of only inside the crawler page.
- Follow-up admin enhancement completed: `AdminDashboard` now also surfaces the latest daily source-collection task status, created media/play-source counts, validation pass counts, and task timing summary.
- Follow-up admin enhancement completed: `AdminDashboard` now highlights at-risk collection sources using real quality / active-rate / validation / ingestion signals, making low-quality or stale sources visible without opening the crawler page.
- Follow-up admin/crawler UX enhancement completed: admin monitoring cards now deep-link into `CrawlerView`, and the crawler page can auto-focus/highlight the corresponding source card for faster troubleshooting and policy adjustment.
- Follow-up admin/play-source UX enhancement completed: admin monitoring cards can now deep-link into `AdminPlaySourcesView`, while the play-source admin page supports source-aware filtering, route-driven focus state, and quick return to crawler/source strategy inspection.
- Follow-up admin/play-source UX enhancement completed: `AdminPlaySourcesView` now supports status filtering plus last-checked/priority sorting, so failed or long-unchecked sources surface earlier during source-level troubleshooting.
- Follow-up admin/play-source UX enhancement completed: `AdminPlaySourcesView` now includes quick troubleshooting toggles plus current-list stat cards, making error/checking/unverified sources easier to spot at a glance.
- Follow-up admin/play-source UX enhancement completed: `AdminPlaySourcesView` now embeds the focused source's health summary (quality score, active rate, recent ingestion/check timestamps, proxy guidance, recommendation), reducing context switching during source-level troubleshooting.
- Follow-up admin/dashboard enhancement completed: `AdminDashboard` now applies a richer source risk model (quality, active rate, active-source count, stale validation, stalled ingestion, inactive media) and surfaces compact risk score/highlight tags for faster prioritization.
- Follow-up admin/dashboard enhancement completed: `AdminDashboard` now shows first-screen alert summary cards (critical / high / stalled ingestion / zero-active-source counts) so operators can gauge the current source-risk landscape before drilling into details.
- Avoid reverting the staged removals under `backend/dist` and `.env.production`; those are intentional index cleanups.
