<template>
  <div ref="artRef" class="art-player-container"></div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, ref, watch } from 'vue';
  import type Artplayer from 'artplayer';
  import type Hls from 'hls.js';
  import { iptvApi } from '@/api/iptv';
  import { log } from '@/utils/logger';

  type ArtplayerConstructor = typeof import('artplayer')['default'];
  type HlsConstructor = typeof import('hls.js')['default'];

  let artplayerLoader: Promise<ArtplayerConstructor> | null = null;
  let hlsLoader: Promise<HlsConstructor> | null = null;

  const loadArtplayer = (): Promise<ArtplayerConstructor> => {
    artplayerLoader ??= import('artplayer').then(module => module.default);
    return artplayerLoader;
  };

  const loadHls = (): Promise<HlsConstructor> => {
    hlsLoader ??= import('hls.js/light').then(module => module.default as unknown as HlsConstructor);
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

  const emit = defineEmits<{
    ready: [player: Artplayer];
    timeupdate: [currentTime: number, duration: number];
    play: [currentTime: number];
    pause: [currentTime: number];
    seeked: [currentTime: number];
    ended: [];
    error: [error: string];
  }>();

  const artRef = ref<HTMLDivElement>();
  let art: Artplayer | null = null;
  let playerLoadId = 0;
  let hlsLoadId = 0;

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

  const destroyHls = () => {
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
      log.error('ArtPlayer', 'hls.js not supported in this browser');
      emit('error', 'HLS is not supported in this browser');
      return;
    }

    log.info('ArtPlayer', 'Creating hls.js instance for', url);
    hlsInstance = new Hls({
      maxBufferLength: 30,
      maxMaxBufferLength: 600,
      startFragPrefetch: true,
      enableWorker: true,
    });

    hlsInstance.loadSource(url);
    hlsInstance.attachMedia(video);

    hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
      log.info('ArtPlayer', 'MANIFEST_PARSED', { levels: data.levels?.length });
      if (props.autoplay) {
        player.play().catch(() => {});
      }
    });

    let networkErrorRetries = 0;
    let mediaErrorRetries = 0;
    let fatalErrorEmitted = false;

    const emitFatalError = (message: string) => {
      if (fatalErrorEmitted) return;
      fatalErrorEmitted = true;
      emit('error', message);
    };

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

    player.on('destroy', () => {
      hlsLoadId++;
      destroyHls();
    });
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
      url: isHls ? '' : playableUrl,
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
        emit('timeupdate', player.currentTime, player.duration);
      }
    });

    player.on('video:play', () => {
      if (art === player) {
        emit('play', player.currentTime);
      }
    });

    player.on('video:pause', () => {
      if (art === player) {
        emit('pause', player.currentTime);
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

    if (isHls) {
      const video = player.video as HTMLVideoElement;
      void setupHls(video, playableUrl, player);
    }
  };

  watch(
    () => props.src,
    newSrc => {
      if (!art) return;

      const isHls = isHlsUrl(newSrc);
      const playableUrl = getPlayableUrl(newSrc);
      log.info('ArtPlayer', 'src changed', { newSrc, isHls, playableUrl });

      if (isHls) {
        const video = art.video as HTMLVideoElement;
        void setupHls(video, playableUrl, art);
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
    playerLoadId++;
    hlsLoadId++;
    destroyHls();
    if (art) {
      art.destroy(false);
      art = null;
    }
  });
</script>

<style scoped>
  .art-player-container {
    width: 100%;
    height: 100%;
    min-height: 300px;
  }

  :deep(.art-loading) {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
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
