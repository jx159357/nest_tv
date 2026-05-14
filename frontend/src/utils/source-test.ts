export interface SourceTestResult {
  id: number;
  speed: number;
  resolution: string | null;
  status: 'pending' | 'testing' | 'success' | 'error';
  error?: string;
}

const RESOLUTION_PRIORITY: Record<string, number> = {
  '4k': 4, '2160p': 4,
  '1080p': 3, 'fhd': 3,
  '720p': 2, 'hd': 2,
  '480p': 1, 'sd': 1,
  '360p': 0,
};

export function getResolutionScore(resolution: string | null | undefined): number {
  if (!resolution) return 0;
  const key = resolution.toLowerCase().replace(/\s/g, '');
  return RESOLUTION_PRIORITY[key] ?? 0;
}

export function getSourceScore(speed: number, resolution: string | null): number {
  const speedScore = speed > 0 ? Math.max(0, 100 - speed / 50) : 0;
  const resScore = getResolutionScore(resolution) * 25;
  return Math.round(speedScore * 0.6 + resScore * 0.4);
}

export async function testSourceSpeed(url: string, timeout = 8000): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const start = performance.now();

  try {
    const isM3u8 = url.includes('.m3u8') || url.includes('m3u8');

    if (isM3u8) {
      const resp = await fetch(url, { signal: controller.signal, mode: 'no-cors' });
      void resp;
    } else {
      await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors',
      });
    }

    return Math.round(performance.now() - start);
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return -1;
    }
    return Math.round(performance.now() - start);
  } finally {
    clearTimeout(timer);
  }
}

export async function detectResolution(url: string, timeout = 6000): Promise<string | null> {
  if (!url.includes('.m3u8') && !url.includes('m3u8')) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const resp = await fetch(url, { signal: controller.signal, mode: 'no-cors' });
    const text = await resp.text();
    const match = text.match(/RESOLUTION=(\d+)x(\d+)/);
    if (match) {
      const height = parseInt(match[2], 10);
      if (height >= 2160) return '4K';
      if (height >= 1080) return '1080p';
      if (height >= 720) return '720p';
      if (height >= 480) return '480p';
      return `${height}p`;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function testSingleSource(
  sourceId: number,
  url: string,
): Promise<SourceTestResult> {
  try {
    const speed = await testSourceSpeed(url);
    const resolution = await detectResolution(url);
    return {
      id: sourceId,
      speed,
      resolution,
      status: speed > 0 ? 'success' : 'error',
      error: speed < 0 ? '超时' : undefined,
    };
  } catch {
    return { id: sourceId, speed: -1, resolution: null, status: 'error', error: '测试失败' };
  }
}

export async function batchTestSources(
  sources: { id: number; url: string }[],
  concurrency = 3,
  onProgress?: (result: SourceTestResult) => void,
): Promise<SourceTestResult[]> {
  const results: SourceTestResult[] = [];
  const queue = [...sources];

  const worker = async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const result = await testSingleSource(item.id, item.url);
      results.push(result);
      onProgress?.(result);
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, sources.length) }, () => worker());
  await Promise.all(workers);

  return results.sort((a, b) => {
    const scoreA = getSourceScore(a.speed, a.resolution);
    const scoreB = getSourceScore(b.speed, b.resolution);
    return scoreB - scoreA;
  });
}
