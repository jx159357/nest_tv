<template>
  <div ref="artRef" class="art-player-container"></div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, ref, watch } from 'vue';
  import type Artplayer from 'artplayer';
  import type Hls from 'hls.js';
  import { iptvApi } from '@/api/iptv';
  import { log } from '@/utils/logger';

  type ArtplayerConstructor = (typeof import('artplayer'))['default'];
  type HlsConstructor = (typeof import('hls.js'))['default'];

  let artplayerLoader: Promise<ArtplayerConstructor> | null = null;
  let hlsLoader: Promise<HlsConstructor> | null = null;

  const loadArtplayer = (): Promise<ArtplayerConstructor> => {
    artplayerLoader ??= import('artplayer').then(module => module.default);
    return artplayerLoader;
  };

  const loadHls = (): Promise<HlsConstructor> => {
    hlsLoader ??= import('hls.js/light').then(
      module => module.default as unknown as HlsConstructor,
    );
    return hlsLoader;
  };

  interface Props {
    src: string;
    title?: string;
    poster?: string;
    autoplay?: boolean;
    currentTime?: number;
  }

  const props = withDefaults(defineProps<Props>(), {
    title: '',
    poster: '',
    autoplay: false,
    currentTime: 0,
  });

  export interface PlaybackMetrics {
    firstFrameTimeMs: number;
    stallCount: number;
    success: boolean;
  }

  const emit = defineEmits<{
    ready: [player: Artplayer];
    timeupdate: [currentTime: number, duration: number];
    play: [currentTime: number];
    pause: [currentTime: number];
    seeked: [currentTime: number];
    ended: [];
    error: [error: string];
    metrics: [metrics: PlaybackMetrics];
  }>();

  const artRef = ref<HTMLDivElement>();
  let art: Artplayer | null = null;
  let playerLoadId = 0;
  let hlsLoadId = 0;
  let hlsStartupTimer: number | null = null;
  let hlsLoadingGraceTimer: number | null = null;
  let playbackWatchdogTimer: number | null = null;
  let cleanupHlsVideoListeners: (() => void) | null = null;
  const HAVE_METADATA = 1;
  const HAVE_CURRENT_DATA = 2;

  const isHlsUrl = (url: string): boolean => {
    return url.includes('.m3u8') || url.includes('m3u8');
  };

  const isCrossOrigin = (url: string): boolean => {
    try {
      const parsed = new URL(url, window.location.href);
      return parsed.origin !== window.location.origin;
    } catch {
      return true;
    }
  };

  const getProxiedUrl = (url: string): string => {
    return iptvApi.getStreamProxyUrl(url);
  };

  const getPlayableUrl = (url: string): string => {
    if (!url) return url;
    if (isHlsUrl(url) && isCrossOrigin(url)) {
      return getProxiedUrl(url);
    }
    return url;
  };

  let hlsInstance: Hls | null = null;
  let playStartAt = 0;
  let stallCount = 0;
  let firstFrameReported = false;

  const clearHlsStartupTimer = () => {
    if (hlsStartupTimer !== null) {
      window.clearTimeout(hlsStartupTimer);
      hlsStartupTimer = null;
    }
  };

  const clearHlsLoadingGraceTimer = () => {
    if (hlsLoadingGraceTimer !== null) {
      window.clearTimeout(hlsLoadingGraceTimer);
      hlsLoadingGraceTimer = null;
    }
  };

  const clearPlaybackWatchdog = () => {
    if (playbackWatchdogTimer !== null) {
      window.clearTimeout(playbackWatchdogTimer);
      playbackWatchdogTimer = null;
    }
  };

  const hidePlayerLoading = (player: Artplayer) => {
    player.loading.show = false;
  };

  const resetMetrics = () => {
    playStartAt = 0;
    stallCount = 0;
    firstFrameReported = false;
  };

  const reportFirstFrame = () => {
    if (firstFrameReported || playStartAt <= 0) return;
    firstFrameReported = true;
    const firstFrameTimeMs = Date.now() - playStartAt;
    emit('metrics', { firstFrameTimeMs, stallCount: 0, success: true });
  };

  const destroyHls = () => {
    clearHlsStartupTimer();
    clearHlsLoadingGraceTimer();
    cleanupHlsVideoListeners?.();
    cleanupHlsVideoListeners = null;

    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
  };

  const setupHls = async (
    video: HTMLVideoElement,
    url: string,
    player: Artplayer,
  ): Promise<void> => {
    const currentLoadId = ++hlsLoadId;
    destroyHls();

    let Hls: HlsConstructor;
    try {
      Hls = await loadHls();
    } catch (error) {
      if (currentLoadId === hlsLoadId && art === player) {
        log.error('ArtPlayer', 'Failed to load hls.js', error);
        emit('error', 'Failed to load HLS player');
      }
      return;
    }

    if (currentLoadId !== hlsLoadId || art !== player) {
      return;
    }

    if (!Hls.isSupported()) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.load();
        if (props.autoplay) {
          player.play().catch(() => {});
        }
        return;
      }

      log.error('ArtPlayer', 'HLS is not supported in this browser');
      emit('error', 'HLS is not supported in this browser');
      return;
    }

    log.info('ArtPlayer', 'Creating hls.js instance for', url);
    let networkErrorRetries = 0;
    let mediaErrorRetries = 0;
    let fatalErrorEmitted = false;

    const emitFatalError = (message: string) => {
      if (fatalErrorEmitted) return;
      fatalErrorEmitted = true;
      clearHlsStartupTimer();
      emit('error', message);
    };

    const markMediaReady = () => {
      if (currentLoadId !== hlsLoadId || art !== player) return;
      clearHlsStartupTimer();
      hidePlayerLoading(player);
    };

    video.addEventListener('loadedmetadata', markMediaReady);
    video.addEventListener('loadeddata', markMediaReady);
    video.addEventListener('canplay', markMediaReady);
    cleanupHlsVideoListeners = () => {
      video.removeEventListener('loadedmetadata', markMediaReady);
      video.removeEventListener('loadeddata', markMediaReady);
      video.removeEventListener('canplay', markMediaReady);
    };

    hlsStartupTimer = window.setTimeout(() => {
      if (currentLoadId !== hlsLoadId || art !== player) return;
      if (!props.autoplay && video.paused) {
        hidePlayerLoading(player);
        return;
      }
      if (video.readyState < HAVE_METADATA) {
        emitFatalError('HLS load timeout');
      }
    }, 15000);

    hlsLoadingGraceTimer = window.setTimeout(() => {
      if (currentLoadId !== hlsLoadId || art !== player || props.autoplay) return;
      if (video.paused && video.readyState < HAVE_METADATA) {
        hidePlayerLoading(player);
      }
    }, 2500);

    hlsInstance = new Hls({
      autoStartLoad: true,
      maxBufferLength: 30,
      maxMaxBufferLength: 600,
      startFragPrefetch: true,
      enableWorker: true,
      manifestLoadingTimeOut: 15000,
      levelLoadingTimeOut: 15000,
      fragLoadingTimeOut: 20000,
    });

    hlsInstance.on(Hls.Events.MEDIA_ATTACHED, () => {
      if (currentLoadId !== hlsLoadId || art !== player) return;
      hlsInstance?.loadSource(url);
      hlsInstance?.startLoad(-1);
    });

    hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
      log.info('ArtPlayer', 'MANIFEST_PARSED', { levels: data.levels?.length });
      hidePlayerLoading(player);
      if (props.autoplay) {
        player.play().catch(() => {});
      }
    });

    const getResponseCode = (data: unknown): number | null => {
      const response = (data as { response?: { code?: number; status?: number } })?.response;
      const code = response?.code ?? response?.status;
      return typeof code === 'number' ? code : null;
    };

    const shouldFailFastNetworkError = (data: unknown): boolean => {
      const details = String((data as { details?: string })?.details || '');
      const responseCode = getResponseCode(data);

      if (responseCode && [400, 401, 403, 404, 410].includes(responseCode)) {
        return true;
      }

      return details.includes('manifestLoadError') || details.includes('manifestLoadTimeOut');
    };

    hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
      log.error('ArtPlayer', 'hls.js error', {
        type: data.type,
        details: data.details,
        fatal: data.fatal,
      });
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (shouldFailFastNetworkError(data)) {
              const responseCode = getResponseCode(data);
              emitFatalError(
                responseCode
                  ? `HLS network error ${responseCode}: ${data.details}`
                  : `HLS network error: ${data.details}`,
              );
              break;
            }

            if (networkErrorRetries < 2) {
              networkErrorRetries++;
              log.warn('ArtPlayer', `Fatal network error, restart attempt ${networkErrorRetries}`);
              hlsInstance?.startLoad();
            } else {
              emitFatalError(`HLS network error: ${data.details}`);
            }
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            if (mediaErrorRetries < 3) {
              mediaErrorRetries++;
              log.warn('ArtPlayer', `Media error recovery attempt ${mediaErrorRetries}`);
              try {
                hlsInstance?.recoverMediaError();
              } catch (e) {
                log.error('ArtPlayer', 'recoverMediaError failed', e);
              }
            } else {
              log.error('ArtPlayer', 'Media error recovery exhausted');
              emitFatalError(`Media playback error: ${data.details}`);
            }
            break;
          default:
            emitFatalError(`HLS playback error: ${data.details}`);
            break;
        }
      }
    });

    hlsInstance.attachMedia(video);

    player.on('destroy', () => {
      hlsLoadId++;
      destroyHls();
    });
  };

  const startPlaybackWatchdog = (player: Artplayer) => {
    clearPlaybackWatchdog();
    const video = player.video as HTMLVideoElement | null;
    const srcAtPlay = props.src;

    if (!video || !isHlsUrl(srcAtPlay) || video.readyState >= HAVE_CURRENT_DATA) {
      return;
    }

    hlsInstance?.startLoad(-1);
    playbackWatchdogTimer = window.setTimeout(() => {
      if (art !== player || props.src !== srcAtPlay || !video || video.paused) return;
      if (video.readyState < HAVE_CURRENT_DATA) {
        emit('error', 'Video playback timeout');
      }
    }, 12000);
  };

  const initPlayer = async (): Promise<void> => {
    if (!artRef.value) return;
    const currentLoadId = ++playerLoadId;

    let Artplayer: ArtplayerConstructor;
    try {
      Artplayer = await loadArtplayer();
    } catch (error) {
      if (currentLoadId === playerLoadId) {
        log.error('ArtPlayer', 'Failed to load artplayer', error);
        emit('error', 'Failed to load video player');
      }
      return;
    }

    if (currentLoadId !== playerLoadId || !artRef.value) return;

    const isHls = isHlsUrl(props.src);
    const playableUrl = getPlayableUrl(props.src);
    log.info('ArtPlayer', 'initPlayer', { src: props.src, isHls, playableUrl });

    const player = new Artplayer({
      container: artRef.value!,
      url: playableUrl,
      type: isHls ? 'm3u8' : undefined,
      poster: props.poster,
      autoplay: props.autoplay && !isHls,
      autoSize: false,
      autoMini: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      screenshot: true,
      setting: true,
      hotkey: true,
      pip: false,
      mutex: true,
      backdrop: true,
      playsInline: true,
      volume: 0.7,
      fullscreen: false,
      fullscreenWeb: false,
      subtitleOffset: false,
      miniProgressBar: true,
      customType: isHls
        ? {
            m3u8(video: HTMLVideoElement, url: string, nextPlayer: Artplayer) {
              void setupHls(video, url, nextPlayer);
            },
          }
        : undefined,
    });
    art = player;

    player.on('ready', () => {
      if (props.currentTime > 0) {
        player.currentTime = props.currentTime;
      }
      emit('ready', player);
    });

    player.on('video:timeupdate', () => {
      if (art === player) {
        clearPlaybackWatchdog();
        reportFirstFrame();
        emit('timeupdate', player.currentTime, player.duration);
      }
    });

    player.on('video:play', () => {
      if (art === player) {
        if (!playStartAt) playStartAt = Date.now();
        startPlaybackWatchdog(player);
        emit('play', player.currentTime);
      }
    });

    player.on('video:pause', () => {
      if (art === player) {
        clearPlaybackWatchdog();
        emit('pause', player.currentTime);
      }
    });

    player.on('video:loadedmetadata', () => {
      clearPlaybackWatchdog();
      hidePlayerLoading(player);
      reportFirstFrame();
    });

    player.on('video:canplay', () => {
      clearPlaybackWatchdog();
      hidePlayerLoading(player);
    });

    player.on('video:waiting', () => {
      if (art === player && firstFrameReported) {
        stallCount++;
      }
    });

    player.on('video:seeked', () => {
      if (art === player) {
        emit('seeked', player.currentTime);
      }
    });

    player.on('video:ended', () => {
      emit('ended');
    });

    player.on('error', (error: Error) => {
      const errMsg = String(error);
      log.error('ArtPlayer', 'video element error', errMsg);
      emit('error', errMsg);
    });
  };

  watch(
    () => props.src,
    newSrc => {
      if (!art) return;

      const isHls = isHlsUrl(newSrc);
      const playableUrl = getPlayableUrl(newSrc);
      log.info('ArtPlayer', 'src changed', { newSrc, isHls, playableUrl });

      if (isHls) {
        art.type = 'm3u8';
        art.url = playableUrl;
      } else {
        hlsLoadId++;
        destroyHls();
        art.url = playableUrl;
      }
    },
  );

  onMounted(() => {
    void initPlayer();
  });

  onUnmounted(() => {
    if (playStartAt > 0 && !firstFrameReported) {
      emit('metrics', { firstFrameTimeMs: 0, stallCount: 0, success: false });
    } else if (firstFrameReported && stallCount > 0) {
      emit('metrics', { firstFrameTimeMs: 0, stallCount, success: true });
    }
    playerLoadId++;
    hlsLoadId++;
    clearPlaybackWatchdog();
    destroyHls();
    resetMetrics();
    if (art) {
      art.destroy(false);
      art = null;
    }
  });
</script>

<style scoped>
  .art-player-container {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    min-height: 300px;
    overflow: hidden;
    background: #000;
  }

  :deep(.artplayer),
  :deep(.art-video),
  :deep(video) {
    width: 100%;
    height: 100%;
  }

  :deep(.art-loading) {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: none;
    pointer-events: none;
  }

  :deep(.art-loading-spinner) {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: var(--border-focus);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  :deep(.art-state) {
    position: absolute;
    pointer-events: none;
  }

  /* :deep(.art-state-icon) {
    width: 60px;
    height: 60px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  } */

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
