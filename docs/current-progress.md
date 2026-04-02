# Current Progress

## Current State

- Frontend:
  - Header search and `HomeView` search now surface real-time suggestions from `/search/suggestions`, blend them with local recent searches / hot keywords, and keep the selected suggestion flowing into the existing `q` route search context instead of stopping at a bare input entry.
  - Header search and `HomeView` search now also persist submitted keywords into backend `/search/history` for authenticated users, and recent-search suggestions can hydrate from server-side history instead of staying browser-local only.
  - Header and homepage search suggestion panels now expose a practical “清空” action for recent search history, and `RecommendationsView` now consumes server-side search history plus related keywords to provide a small search-interest workspace instead of limiting the page to watch-history-derived recommendations only.
  - Personalized recommendations now also absorb server-side search history signals: recommendation profiles surface recent search keywords, search-only users can enter a real `search-based` strategy instead of falling straight back to trending, and the profile sidebar now links into a dedicated `/search-history` workspace for managing and replaying recent searches.
  - `ProfileView` has been refreshed into a unified interest center: it now aggregates viewing stats, recommendation profile signals, recent search keywords, favorite previews, and direct jumps into watch history / favorites / search history / recommendation settings instead of acting as a watch-history-only shell.
  - A real `/settings` page now exists for editing profile fields plus explicit recommendation preferences (preferred types / genres / keywords, excluded genres, freshness bias), and those saved preferences are now persisted through `/users/profile` and merged back into recommendation scoring instead of being frontend-only placeholders.
  - `SettingsView` now also behaves more like a product page: it includes avatar preview/URL validation, password-change flow via `/users/change-password`, and an unsaved-changes reminder with browser refresh-leave protection instead of acting as a plain preference form.
  - Frontend user flows now share a lighter unified feedback layer: reusable inline notices plus centralized error-message extraction are wired into `SettingsView` / `SearchHistoryView`, while search-history clear actions in the header and homepage now emit consistent toast feedback instead of failing silently.
  - Frontend now also has a higher-level `UserJourney` regression spec that exercises the core signed-in flow across search submission, favorite feedback, favorites highlight handoff, settings persistence, and recommendation-profile consumption, helping protect the main user chain from future context regressions.
  - The signed-in frontend regression coverage now explicitly treats search → favorite → favorites highlight → settings save → recommendation profile as one user chain, giving the project a higher-level safety net beyond isolated single-view tests.
  - Frontend regression coverage now also includes an auth/profile journey that walks login redirect → settings update → password change → logout → login with the new password, giving the account-and-profile path the same kind of high-level safety net as the content-interaction chain.
  - Frontend now exposes a dedicated `npm run test:journeys` entry that bundles the highest-value user regressions (`LoginView`, `UserJourney`, `AuthProfileJourney`), making it easier to rerun the main product chains without remembering individual spec paths.
  - Backend-facing admin operations now also have a higher-level frontend regression path: `AdminJourney` covers the operator flow from user/media investigation into prefiltered admin download-task workspaces, and `npm run test:journeys:admin` provides a direct entry for rerunning that admin chain.
  - High-frequency consumer pages are being normalized onto clean UTF-8 templates as part of maintainability cleanup: `RecommendationsView`, `MediaDetailView`, and `WatchView` have now been re-authored with readable Chinese copy and preserved core behavior, reducing the remaining legacy-encoding hotspots in the frontend.
  - `LoginView` and `RegisterView` are now also aligned with the same cleanup direction: both auth pages use cleaner TS-based implementations, shared inline notice patterns, and explicit regression coverage, so the authentication entrance is no longer one of the remaining “old-style” frontend islands.
  - Tooling pages now also have direct regression coverage: `DownloadsView` and `TorrentView` each have focused view tests for their main actions, so task refresh / task clearing / torrent search / torrent-to-download handoff are no longer protected only by manual checks.
  - `UserDashboard`'s broken `/settings` detour is now folded back into `/recommendations?focus=profile`, and `RecommendationsView` now shows a profile-focused entry hint so the "推荐设置" shortcut lands with the right context instead of opening a generic recommendation page.
  - `MediaDetailView` and `WatchView` now load favorite status, support add/remove favorite actions end-to-end, and surface immediate success feedback with a direct jump into `/favorites`, closing the gap where the collection entry existed conceptually but the active user flow lacked visible confirmation.
  - `/favorites` now accepts a `highlight` route query, so opening favorites right after adding a title can either scroll/highlight the matching card in the current page or pin a highlighted preview card when that item is outside the current pagination slice.
  - Re-ran `npm run type-check`, full `npx vitest run`, and `npm run build`; all pass in the current workspace.
  - Re-ran targeted download/admin UI coverage via `npx vitest run test/views/AdminDownloadTasksView.spec.ts test/views/AdminDeepLinks.spec.ts test/stores/downloads.spec.ts`; all pass in the current workspace.
  - Download-task store edge cases are now tightened: moving a task out of `completed` clears stale `completedAt`, and remote hydration now re-pushes locally newer task records when the server copy is older.
  - Frontend bootstrap now hydrates the authenticated user before installing the router when a token already exists, avoiding the cold-start race where refreshed admin pages could be misclassified as non-admin before profile data arrived.
  - `AdminLogsView` now syncs action/resource/status/page through route query params, so filtered log investigations survive refresh/share and auto-correct if the backend clamps an overflow page.
  - `AdminWatchHistoryView` now syncs `userId`/page through route query params, so filtered watch-history investigations survive refresh/share and also auto-correct if the backend clamps an overflow page.
  - `AdminUsersView` and `AdminMediaView` now sync their search/type/page state through route query params, so operator investigations survive refresh/share and auto-correct when the backend clamps an overflow page.
  - `WatchHistoryView` now syncs `isCompleted`/`sortBy`/`sortOrder`/page through route query params, and `/continue-watching` + `/completed` now redirect into prefiltered watch-history routes instead of dropping the user into an unfiltered list.
  - User-specific recommendation requests now bypass the shared API cache on the client, preventing personalized recommendation/profile responses from being mistakenly reused across different signed-in users.
  - `RecommendationsView` now clears stale personalized/profile state before auth changes and manual refresh retries, so a failed personalized fetch no longer leaves the previous account's recommendation cards or profile snapshot visible on screen.
  - `ProfileView` now resumes �������ۿ��� cards from the saved `currentTime` instead of always reopening the media from the beginning.
  - `WatchView` now actually consumes the `?time=` resume query and seeks after metadata loads, so resume links from profile/watch-history finally continue playback from the intended timestamp instead of silently starting from 0.
  - `WatchView`, `ProfileView`, and `MediaDetailView` now tolerate missing `rating` values safely instead of calling `toFixed` on `undefined` and crashing the page during render.
  - `HomeView` now consumes the `q` route query and renders real search results, closing the gap where `/search?q=...` changed the URL but the homepage never actually executed a media search.
  - User-specific media favorites/watch-history reads now bypass the shared API cache on the client, preventing favorites/history payloads from being accidentally reused after account switching in the same browser session.
  - `/favorites` is now a real page instead of a mistaken redirect to watch history, with proper pagination, refresh-safe route state, and media-detail navigation.`r`n  - `AppLayout` now keeps the header search box synchronized with the current `q` route query, and `NavigationLayout` mobile logout now actually invokes the logout handler.
- Backend:
  - Restored `/media/favorites`, `/media/:id/favorites`, and `/media/:id/favorites/status` on the active backend controller/service path, so the frontend favorites page and new instant-feedback collection actions no longer rely on missing legacy routes.
  - `AdvancedSearchController` now consistently uses the authenticated user's real `id` instead of a stale `userId` field assumption, and `/search/history` now supports explicit write-in recording for frontend-driven search flows.
  - Re-ran `npm run build`, full `npx jest --runInBand`, and `npx jest --config ./test/jest-e2e.json --runInBand`; all pass in the current workspace.
  - Download-task/admin backend coverage is green in the current workspace, including `src/download-tasks/download-tasks.service.spec.ts`, `src/admin/admin.service.spec.ts`, and `src/admin/admin.controller.spec.ts`.
  - Admin backend hardening is now in place: `/admin/*` routes require an authenticated admin/superAdmin role on the server side instead of relying only on frontend route gating.
  - Admin list endpoints now share normalized pagination handling, so malformed or out-of-range `page` / `limit` query params no longer leak through as `NaN`, negative offsets, or stale overflow pages.
  - Admin list endpoints now also cap oversized page sizes at a shared server-side maximum, preventing overly large `limit` requests from turning into accidental heavy queries.
  - Admin controller inputs are now validated consistently: list endpoints use dedicated query DTOs with numeric coercion / enum validation, and the controller now applies `ValidationPipe` so role/permission body DTO rules actually execute at runtime.
  - Admin e2e coverage now exercises unauthenticated/admin/non-admin access paths plus query/body validation/coercion on `/admin/*`, so the new role guard and controller-level validation are no longer protected only by unit tests.
  - User watch-history filtering is now truly end-to-end: `/watch-history/user/me` accepts the shared query DTO with coercion/validation and applies completion/sort filters server-side instead of silently ignoring them.
  - Re-ran `npm run lint:check`; it now passes again after clearing the remaining Prettier line-ending debt.
  - Latest full snapshot is back to `0 errors + 0 warnings`.

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
  - recommendation page now shows preference profile, reasoned personalized cards, and latest-release shelf
- IPTV surfaces are now wired to live backend data:
  - frontend now includes a dedicated IPTV page with stats, group filtering, search, channel detail, validation, and M3U import flow
- Admin management is partially activated with real data:
  - admin dashboard uses live backend stats and health data
  - admin users list uses real `/admin/users`
  - admin media list uses real `/admin/media`
  - admin play sources list uses real `/admin/play-sources`
  - admin watch history uses real `/admin/watch-history`
  - admin logs uses real `/admin/logs`
  - admin roles/permissions page is now routed and backed by real `/admin/roles` + `/admin/permissions` create/update flows
  - admin dashboard now includes a scheduled-task result dashboard with recent run history, failure-source focus, and manual daily collection trigger
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
  - proxy execution is now scoped by request stage (`discovery`, `detail`, `connectivity-check`), so sources only use proxies where truly needed
- source health summaries are now available for UI/dashboard consumption (active rate, recent additions, latest checks)
- source quality scoring and recommended proxy mode are now computed from real play-source health data
- daily scheduler now prioritizes stronger sources first and dynamically reduces fetch volume for lower-quality sources
- crawler UI now shows source quality score, suggested proxy mode, runtime-editable source collection policy controls, and finer quality diagnostics such as extraction coverage / recent media freshness
- data-collection detail extraction is richer now:
  - source selectors support director / actors / genres / releaseDate / downloadUrls
  - collected media data now carries more structured metadata before persistence
  - download/playable URL extraction now scans both DOM links and page text for magnet / thunder / ftp / ed2k / m3u8 / direct video links
- Torrent aggregation is improved:
  - backend `torrent` endpoints now read real magnet play sources from the database instead of returning random placeholder data
  - supported operations now include local magnet parsing, info lookup, health summary, search, popular, and latest
- Play-source validation is deeper now:
  - direct/stream sources use richer HTTP probing with playlist detection and content-type inspection
  - parser sources now verify through real parse providers and probe the resolved downstream URL
  - magnet sources now persist parsed infoHash / tracker metadata during validation
  - validation details are stored on play sources for admin troubleshooting and surfaced in `AdminPlaySourcesView`
- Frontend crawler management is improved:
  - `CrawlerView` now uses a dedicated API client instead of placeholder/nonexistent store methods
  - crawl results now surface persistence feedback such as created media ID and created/skipped play source counts
  - quick-crawl results now also surface extracted backdrop / duration and compact extraction diagnostics
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
  - Next product-facing expansion can target remaining admin placeholders or deeper download / torrent workflows.

## Suggested Next Steps

1. Re-run backend unit tests and e2e tests after the lint cleanup milestone.
2. Continue product work from the remaining placeholders:



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
- Follow-up admin/crawler UX enhancement completed: dashboard alert summary cards now deep-link into `CrawlerView` alert-filter views, and the shared frontend source-alert utility keeps dashboard/crawler risk logic aligned.
- Follow-up admin/play-source UX enhancement completed: dashboard alert summary cards now also offer direct entry into `AdminPlaySourcesView` alert-filter views, so operators can jump straight from first-screen source-risk counts into play-source troubleshooting.
- Follow-up admin/play-source UX enhancement completed: `AdminPlaySourcesView` alert-filter mode now includes a dashboard return link plus a collapsible matched-source list, keeping alert context visible during deeper troubleshooting.
- Follow-up admin/crawler UX enhancement completed: `CrawlerView` alert-filter mode now mirrors the play-source view with a dashboard return link plus a collapsible matched-source list, keeping first-screen alert context intact while drilling into source strategy.
- Follow-up admin/dashboard enhancement completed: each attention-source card now surfaces a recommended next action and prioritizes its primary CTA toward either source-strategy inspection or play-source troubleshooting.
- Follow-up admin/dashboard enhancement completed: alert summary cards now visually prioritize their recommended default entry (source view vs play-source view) while still keeping the secondary path available.
- Follow-up admin/crawler/play-source UX enhancement completed: alert banners in both `CrawlerView` and `AdminPlaySourcesView` now reuse the same recommended-entry language/priority as the dashboard, keeping action guidance consistent across the whole troubleshooting flow.
- Follow-up admin/crawler UX enhancement completed: source cards inside `CrawlerView` now also surface recommended next actions and aligned CTA priority, so action guidance remains visible after drilling down from the dashboard.
- Follow-up admin/play-source UX enhancement completed: `AdminPlaySourcesView` now mirrors that action guidance inside the focused source summary and the empty state, so operators still get a clear next step even after drilling all the way into source-level troubleshooting.
- Follow-up admin/crawler UX enhancement completed: `CrawlerView` now extends the same action guidance into empty states and source-collection/quick-crawl result summaries, so operators still get a next-step recommendation after running source actions.
- Follow-up admin enhancement completed: `AdminRolesView` is now actually routed and backed by real role/permission create + update flows via `adminApi`, so role dictionaries and permission assignments can be maintained without placeholder alerts or missing routes.
- Follow-up backend integrity enhancement completed: updating or disabling a permission now synchronizes role permission-code arrays, preventing stale references after permission changes.
- Follow-up scheduler observability enhancement completed: `DailySourceCollectionService` now keeps recent in-memory run history plus aggregated task metrics / issue-source summaries, and `SchedulerController` exposes a dedicated dashboard endpoint for admin consumption.
- Follow-up admin/dashboard enhancement completed: `AdminDashboard` now embeds a scheduled-task result dashboard with recent run snapshots, aggregated success metrics, failure-source focus, refresh, and manual trigger controls for the daily collection job.
- Follow-up play-source validation enhancement completed: direct/stream probing now records richer HTTP validation details, parser-type sources verify via real parse providers plus resolved URL probing, and magnet validation now persists parsed metadata for later troubleshooting.
- Follow-up admin/play-source UX enhancement completed: `AdminPlaySourcesView` now shows a compact validation summary under each source URL, making parser/magnet/http probe results visible without opening raw payloads.
- Follow-up data-collection extraction enhancement completed: repeated crawls can now enrich existing media records with richer backdrop / episodeCount / duration / metadata signals instead of only syncing missing play sources, and quick-crawl results now expose those extraction diagnostics.
- Follow-up proxy-policy enhancement completed: source collection policy now controls proxy usage separately for discovery, detail crawling, and connectivity checks, and CrawlerView exposes those stage-level toggles so proxy-required mode only applies where it is explicitly needed.
- Follow-up source-quality enhancement completed: source quality scoring now blends availability, freshness, extraction coverage, inventory, and validation recency, while crawler/dashboard attention views surface extraction coverage and recent-media freshness for faster diagnosis.
- Follow-up recommendation enhancement completed: personalized recommendations now use a richer recency-aware preference profile with explainable reason tags, RecommendationController exposes detailed recommendation/profile endpoints, and RecommendationsView now shows preference insights plus latest-release recommendations.
- Follow-up torrent UX enhancement completed: frontend now exposes a dedicated magnet page with search, popular/latest shelves, magnet parsing, info/health detail panels, and linked-media entry, finally making the existing backend torrent endpoints directly usable.
- Follow-up download-task enhancement completed: frontend now has a dedicated downloads workspace with persistent task history, MediaDetail/Watch/Torrent entry points can enqueue download jobs, magnet quick actions now route through the same download-task flow, and authenticated users now sync download-task records through new backend /download-tasks APIs instead of relying on local storage only.
- Follow-up download-task linkage enhancement completed: download tasks now persist `mediaResourceId` across local state and backend sync, so detail/watch/torrent entry points keep their media association instead of losing it during cloud hydration.
- Follow-up download-task UX enhancement completed: `DownloadsView` now surfaces a direct jump back to the linked media detail page, and the downloads store now normalizes remote/local ISO date strings cleanly so `frontend npm run type-check` stays green.
- Follow-up download-task sync hardening completed: the downloads store now clears stale completion timestamps when tasks return to non-completed states, and `hydrateRemote` now retries syncing locally newer task snapshots instead of skipping them whenever an older server-side record already exists.
- Follow-up admin authorization hardening completed: backend admin routes now enforce a real admin-role guard, closing the gap where any authenticated non-admin user could previously call `/admin/*` endpoints directly.
- Follow-up admin/download-task pagination hardening completed: backend now clamps out-of-range `/admin/download-tasks` page requests to the last valid page, and `AdminDownloadTasksView` normalizes the route query when the server resolves an overflow page.
- Follow-up admin pagination hardening completed: `getUsers`, `getMedia`, `getPlaySources`, `getWatchHistory`, `getDownloadTasks`, and `getAdminLogs` now all share the same server-side pagination normalization, preventing malformed query params from producing invalid offsets/limits across the broader admin surface.
- Follow-up admin page-size hardening completed: the shared admin pagination helper now caps `limit` at `200`, so oversized list requests cannot silently expand into unbounded admin queries.
- Follow-up admin DTO validation hardening completed: admin list routes now use dedicated query DTOs with coercion/enum checks, and `AdminController` now runs a shared `ValidationPipe`, so malformed admin query/body payloads are rejected consistently instead of slipping through as raw strings.
- Follow-up admin bootstrap hardening completed: frontend now loads the current user profile before router installation when a persisted token exists, preventing refreshed admin routes from bouncing legitimate admins back to `/` just because `authStore.user` had not been restored yet.
- Follow-up admin/logs UX enhancement completed: `AdminLogsView` now preserves action/resource/status/page state in the route query and normalizes the URL when the backend resolves an out-of-range page, making log triage links shareable and refresh-safe.
- Follow-up admin/watch-history UX enhancement completed: `AdminWatchHistoryView` now preserves `userId`/page state in the route query and normalizes the URL when the backend resolves an out-of-range page, making user-scoped watch-history triage links shareable and refresh-safe.
- Follow-up admin/users-media UX enhancement completed: `AdminUsersView` and `AdminMediaView` now preserve search/type/page state in the route query and normalize the URL when the backend resolves an out-of-range page, making those operator list views refresh-safe and shareable like the newer admin screens.
- Follow-up user/watch-history UX enhancement completed: `WatchHistoryView` now preserves completion/sort/page state in the route query, auto-corrects overflow pages from the backend, and the `/continue-watching` + `/completed` shortcuts now land on the correctly filtered history view instead of an unfiltered list.
- Follow-up user/watch-history backend integrity enhancement completed: `WatchHistoryController.findMyHistory` now consumes `WatchHistoryQueryDto` and passes completion/sort filters through to the service layer, closing the gap where the new watch-history UI filters updated the URL but the backend still returned an unfiltered result set.
- Follow-up user/recommendation cache hardening completed: personalized recommendation/profile requests now disable the shared client-side GET cache, preventing one signed-in user's recommendation payload from being incorrectly reused after account switching in the same browser session.
- Follow-up user/recommendation stale-state hardening completed: `RecommendationsView` now clears old personalized cards/profile data before token-driven reloads and before manual refresh retries, so failed recommendation/profile requests no longer leave stale user-specific content visible in the personalized section.
- Follow-up user/profile resume enhancement completed: the �������ۿ��� cards on `ProfileView` now route into `/watch/:id?time=...` when saved progress exists, so personal dashboard resume actions continue from the last known playback time instead of restarting from 0.
- Follow-up user/watch resume integrity enhancement completed: `WatchView` now honors the `time` query parameter and seeks once metadata is ready, closing the final gap in the resume chain from dashboard/history shortcuts into the actual player state.
- Follow-up user/rating null-safety enhancement completed: user-facing watch/detail/profile surfaces now format missing ratings defensively, preventing runtime render crashes when upstream media records lack a numeric `rating`.
- Follow-up user/home-search enhancement completed: the homepage now watches the `q` query, runs `mediaStore.searchMedia(...)`, and shows a dedicated search-results mode, so global search entry points finally produce visible results instead of just mutating the URL.
- Follow-up user/media cache hardening completed: `mediaApi.getFavorites()` and `mediaApi.getWatchHistory()` now disable the shared client-side GET cache, preventing user-specific favorites/history data from bleeding across accounts in reused browser sessions.
- Follow-up user/favorites feature enhancement completed: `/favorites` now renders a dedicated favorites workspace backed by `mediaStore.fetchFavorites(...)`, replacing the old incorrect redirect to watch history and making ���ҵ��ղء� entries from the header/dashboard finally land on the right data set.`r`n- Follow-up user/layout entrypoint enhancement completed: `AppLayout` now mirrors the active `q` query into the header search field, and `NavigationLayout` mobile logout now reliably triggers sign-out, making the top-level navigation/search affordances consistent across desktop and mobile flows.
- Follow-up admin e2e hardening completed: backend now has request-level coverage for `/admin/stats`, `/admin/download-tasks`, and `POST /admin/roles`, validating that unauthenticated users are rejected, non-admins are forbidden, admins are allowed, malformed query/body payloads are blocked, and unknown role payload fields are stripped before reaching the service layer.
- Follow-up admin stats integrity enhancement completed: backend `AdminController` now actually exposes `/admin/stats`, removing the frontend/backend mismatch where `AdminDashboard` requested live stats from a route that was not mounted.
- Follow-up admin dashboard enhancement completed: system stats now include download-task totals and active/completed/failed breakdowns, and `AdminDashboardView` surfaces a dedicated download-task summary card alongside the existing core platform metrics.
- Follow-up download-task testing enhancement completed: backend now has focused `DownloadTasksService` unit coverage for filtered listing, status aggregation, task creation normalization, and completed-state updates, so the newly added `/download-tasks` workflow is no longer relying only on manual verification.
- Follow-up download-task DTO integrity enhancement completed: `DownloadTaskQueryDto` and `CreateDownloadTaskDto` now explicitly coerce number/date fields via `class-transformer`, preventing real `/download-tasks` requests from failing validation just because query params and ISO timestamps arrive as strings.
- Follow-up download-task DTO testing enhancement completed: backend now has focused DTO validation coverage for query pagination filters plus body numeric/date coercion, locking in the fix for authenticated cloud-sync and filtered task listing flows.
- Follow-up admin/download-task enhancement completed: backend admin APIs now expose a real paginated `/admin/download-tasks` endpoint with user/media/status/type/search filters, and frontend admin routing/layout now includes a dedicated `AdminDownloadTasksView` for operator-side inspection of download lifecycle, linked media, and task failures.
- Follow-up admin/download-task testing enhancement completed: `AdminService` now has focused coverage for filtered admin download-task listing, so the new management endpoint is validated alongside the existing stats coverage instead of relying only on manual smoke checks.
- Follow-up admin/download-task UX enhancement completed: `AdminDownloadTasksView` now syncs status/type/user/search/page state through route query params, making filtered investigation shareable and preserving context during pagination/refresh.
- Follow-up admin/dashboard UX enhancement completed: the download-task summary card on `AdminDashboardView` now deep-links into the admin download-task page with ready-made shortcuts for all tasks, active tasks, and failed tasks.
- Follow-up admin/download-task drill-down enhancement completed: operators can now pivot from any download-task row into ��same user�� or ��same media�� filtered task views, while the page preserves those pivots as route query state for continued investigation and sharing.
- Follow-up admin/cross-page enhancement completed: `AdminUsersView` and `AdminMediaView` now deep-link directly into the admin download-task page with prefilled user/media filters, shortening the path from account/content inspection to download-task troubleshooting.
- Follow-up admin/cross-page testing enhancement completed: frontend now has focused view coverage for those `AdminUsersView` / `AdminMediaView` deep links, locking in the route handoff into the admin download-task workspace.
- Follow-up admin/download-task prioritization enhancement completed: `AdminDownloadTasksView` now supports route-synced sort modes for ��recently updated��, ��recently started��, and ��exceptions first��, with row highlighting so failed/cancelled tasks surface faster during operations review.
- Follow-up admin/download-task view testing enhancement completed: frontend now has focused coverage for route-query filter hydration and exception-priority ordering inside `AdminDownloadTasksView`, reducing the risk of regressions in the new admin troubleshooting flow.
- Follow-up admin/controller testing enhancement completed: backend now has focused `AdminController` coverage for the new system-stats and download-task management entry points, so controller-to-service parameter handoff is validated instead of relying only on service tests.
- Follow-up admin/download-task overview enhancement completed: `AdminDownloadTasksView` now adds operator-oriented summary cards such as unique-user/media coverage and 24h-started/magnet counts, plus an exception CTA banner so risky task clusters surface before table-level inspection.
- Follow-up admin/download-task detail enhancement completed: `AdminDownloadTasksView` now supports inline task detail expansion, surfacing task ID, file path, raw URL, last launch/completion timing, error details, and metadata payload without leaving the operations table.
- Follow-up admin/download-task guidance enhancement completed: the detail panel now also includes status-aware recommended actions plus same-user/same-media/media-admin shortcuts, helping operators move from observation to the next troubleshooting step faster.
- Follow-up IPTV enhancement completed: frontend now exposes a dedicated IPTV page with channel stats, group/search filters, detail drill-down, availability validation, and M3U import flow on top of the existing backend IPTV module.
- Follow-up backend lint cleanup completed: normalized the remaining Prettier line endings in `data-collection`, `play-source`, and `media-resource` backend files, restoring `backend npm run lint:check` to green.
- Follow-up backend/documentation consolidation completed: README, test docs, deployment/docs summaries, and `backend/docs` API/environment guides are now aligned around the current backend reality (default `3334` port with dynamic fallback, `/users/profile` + `/users/change-password`, `/search/*`, `/recommendations/*`, `/download-tasks/user/me`, current admin routes, and the partially integrated danmaku realtime story), reducing drift between product flows, controller code, and operator documentation.
- Follow-up frontend/backend API-wrapper alignment completed: the frontend auth/play-source/watch-history/media wrappers now avoid stale backend endpoints (`/auth/validate`, `/auth/logout`, `/media/:id/play-sources`, `/play-sources/:id/test`, generic `/watch-history` user reads), `ProfileView` now has explicit watch-history/profile typing that restores `frontend npm run type-check` to green, and Swagger auth annotations now visibly match the guarded recommendation/download-task/admin controllers.
- Follow-up play-source management alignment completed: `PlaySourcesView` no longer depends on the non-existent `authStore.api`, the play-source API wrapper now normalizes `limit -> pageSize`, backend play-source listing now actually honors documented `status` / `isActive` / `search` style filters, and the stale unsupported `ed2k` option has been removed so the management page is closer to the real play-source enum and routes.
- Follow-up download-protocol semantics alignment completed: the downloads store now treats `thunder://` and `ed2k://` links as generic direct/protocol launches instead of misclassifying them as torrent files, `DownloadsView` copy now distinguishes “直链 / 协议链接” from real “种子文件”, and the downloads store spec covers those legacy protocol inferences explicitly.
- Follow-up frontend/layout cleanup completed: the high-frequency `AppLayout` shell no longer shows mojibake aria labels or `??` placeholder icons, and its header/sidebar/user-menu affordances now use readable Chinese labels plus consistent visual icons without breaking the existing component regression coverage.
- Follow-up legacy watch-page cleanup completed: `VideoWatchView` no longer emits leftover debug `console.log` noise during source switching/playback/local-file handling, the historical `旧版播放页` download source label has been normalized back to `播放页`, and the local upload callback is now typed as `unknown` instead of `any`, keeping the page quieter and a little cleaner without changing behavior.
- Follow-up crawler-page shell cleanup completed: `CrawlerView` is no longer wrapped in its own old standalone nav/header shell and now uses the shared `NavigationLayout`, pulling this large operations page back toward the same product chrome as the rest of the app without changing its data-collection workflows.
- Follow-up play-source page shell cleanup completed: `PlaySourcesView` also dropped its old standalone nav/header shell and now uses the shared `NavigationLayout`, bringing the playback-source management page back into the same application chrome as the rest of the authenticated product surfaces.
- Follow-up IPTV page shell cleanup completed: `IPTVView` now also uses the shared `NavigationLayout` instead of a standalone page wrapper, keeping the IPTV tool surface visually aligned with the rest of the authenticated application without altering its channel/statistics/import workflows.
- Follow-up torrent-page copy cleanup completed: `TorrentView` now uses the more neutral “做种者 / 下载者” wording instead of the older colloquial “做种 / 吸血” labels, making the torrent health/search badges read more like product UI copy without changing any behavior.
- Follow-up watch-page feedback cleanup completed: `VideoWatchView` no longer relies on bare `alert(...)` popups for copy-link / no-download / enqueue-download feedback and now uses the shared success/error notification pattern, keeping that legacy watch surface more consistent with `MediaDetailView` / `WatchView` interaction feedback.
- Follow-up watch-history page shell cleanup completed: `WatchHistoryView` no longer carries its own standalone front-stage nav/header shell and now uses the shared `NavigationLayout`, keeping the viewing-history workspace visually aligned with the rest of the authenticated user surfaces.
- Follow-up player debug cleanup completed: `VideoPlayer` no longer emits touch-gesture debug `console.log` noise for swipe direction or pinch scale, keeping the core player quieter during normal interaction without changing gesture behavior.
- Follow-up confirm-dialog consistency cleanup completed: `PlaySourcesView` and `WatchHistoryView` now use the shared `showConfirm(...)` modal helper instead of bare browser `confirm(...)`, bringing those delete actions closer to the rest of the app's notification/modal style while preserving behavior.
- Follow-up admin confirm cleanup completed: `AdminRolesView` now also uses the shared `showConfirm(...)` modal helper for role/permission enable-disable actions instead of bare `window.confirm(...)`, making the backend role-management flow match the same modal-confirm style as the rest of the app.
- Follow-up prompt cleanup completed: `LocalVideoUpload`, `VideoWatchView`, and `UserDashboard` no longer rely on bare `confirm(...)` / `alert(...)` for normal interactive feedback; only `SettingsView` intentionally keeps a native `window.confirm(...)` for synchronous unsaved-changes route-leave protection.
- Avoid reverting the staged removals under `backend/dist` and `.env.production`; those are intentional index cleanups.













