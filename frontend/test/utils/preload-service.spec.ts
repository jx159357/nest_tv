import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RouteLocationResolved, Router } from 'vue-router';
import { PreloadService } from '@/utils/preload-service';

vi.mock('@/utils/logger', () => ({
  log: {
    warn: vi.fn(),
  },
}));

type LazyComponent = () => Promise<unknown>;

const setIdleCallback = () => {
  Object.defineProperty(window, 'requestIdleCallback', {
    configurable: true,
    value: (callback: IdleRequestCallback) => {
      callback({
        didTimeout: false,
        timeRemaining: () => 50,
      });
      return 1;
    },
  });
};

const makeRoute = (
  meta: Record<string, unknown>,
  matched: Array<{ component: LazyComponent; meta?: Record<string, unknown> }>,
): RouteLocationResolved =>
  ({
    meta,
    matched: matched.map(record => ({
      meta: record.meta ?? {},
      components: {
        default: record.component,
      },
    })),
  }) as unknown as RouteLocationResolved;

const makeRouter = (routes: Record<string, RouteLocationResolved>): Router =>
  ({
    resolve: vi.fn((to: { name?: string | symbol | null }) => {
      const routeName = String(to.name ?? '');
      const route = routes[routeName];
      if (!route) {
        throw new Error(`Unknown route: ${routeName}`);
      }
      return route;
    }),
    getRoutes: vi.fn(() =>
      Object.entries(routes).map(([name, route]) => ({
        name,
        meta: route.meta,
      })),
    ),
  }) as unknown as Router;

describe('PreloadService', () => {
  beforeEach(() => {
    setIdleCallback();
  });

  it('uses resolved route meta and marks successful preloads', async () => {
    const layout = vi.fn<LazyComponent>().mockResolvedValue({ default: 'layout' });
    const page = vi.fn<LazyComponent>().mockResolvedValue({ default: 'page' });
    const route = makeRoute({ preload: true }, [
      { component: layout, meta: {} },
      { component: page, meta: { preload: true } },
    ]);
    const service = new PreloadService(makeRouter({ recommendations: route }));

    await service.preloadRoute('recommendations');
    await service.preloadRoute('recommendations');

    expect(layout).toHaveBeenCalledTimes(1);
    expect(page).toHaveBeenCalledTimes(1);
    expect(service.getPreloadStatus()).toEqual({
      preloaded: ['recommendations'],
      queued: [],
    });
  });

  it('skips routes without preload meta', async () => {
    const page = vi.fn<LazyComponent>().mockResolvedValue({ default: 'page' });
    const route = makeRoute({ preload: false }, [{ component: page, meta: { preload: false } }]);
    const service = new PreloadService(makeRouter({ categories: route }));

    await service.preloadRoute('categories');

    expect(page).not.toHaveBeenCalled();
    expect(service.getPreloadStatus()).toEqual({
      preloaded: [],
      queued: [],
    });
  });

  it('clears the queue after failed preloads so the route can retry', async () => {
    const page = vi
      .fn<LazyComponent>()
      .mockRejectedValueOnce(new Error('load failed'))
      .mockResolvedValueOnce({ default: 'page' });
    const route = makeRoute({ preload: true }, [{ component: page, meta: { preload: true } }]);
    const service = new PreloadService(makeRouter({ recommendations: route }));

    await service.preloadRoute('recommendations');

    expect(page).toHaveBeenCalledTimes(1);
    expect(service.getPreloadStatus()).toEqual({
      preloaded: [],
      queued: [],
    });

    await service.preloadRoute('recommendations');

    expect(page).toHaveBeenCalledTimes(2);
    expect(service.getPreloadStatus()).toEqual({
      preloaded: ['recommendations'],
      queued: [],
    });
  });
});
