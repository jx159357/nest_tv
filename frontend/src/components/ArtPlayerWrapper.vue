<template>
  <div ref="artRef" class="art-player-container"></div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, ref, watch } from 'vue';
  import Artplayer from 'artplayer';
  import Hls from 'hls.js';
  import artplayerPluginHlsControl from 'artplayer-plugin-hls-control';
  import { iptvApi } from '@/api/iptv';
  import { log } from '@/utils/logger';

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
  let proxyFallbackAttempted = false;

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

  const setupHls = (video: HTMLVideoElement, url: string, art: Artplayer): void => {
    destroyHls();

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
        art.play().catch(() => {});
      }
    });

    let mediaErrorRetries = 0;
    hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
      log.error('ArtPlayer', 'hls.js error', {
        type: data.type,
        details: data.details,
        fatal: data.fatal,
      });
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            log.warn('ArtPlayer', 'Fatal network error, restarting load');
            hlsInstance?.startLoad();
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
              emit('error', `Media playback error: ${data.details}`);
            }
            break;
          default:
            emit('error', `HLS playback error: ${data.details}`);
            break;
        }
      }
    });

    art.on('destroy', () => {
      destroyHls();
    });
  };

  const initPlayer = (): void => {
    if (!artRef.value) return;

    const isHls = isHlsUrl(props.src);
    const playableUrl = getPlayableUrl(props.src);
    log.info('ArtPlayer', 'initPlayer', { src: props.src, isHls, playableUrl });

    art = new Artplayer({
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
      pip: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      volume: 0.7,
      fullscreen: false,
      fullscreenWeb: false,
      subtitleOffset: false,
      miniProgressBar: true,
    });

    art.on('ready', () => {
      if (props.currentTime > 0) {
        art!.currentTime = props.currentTime;
      }
      emit('ready', art!);
    });

    art.on('video:timeupdate', () => {
      if (art) {
        emit('timeupdate', art.currentTime, art.duration);
      }
    });

    art.on('video:play', () => {
      if (art) {
        emit('play', art.currentTime);
      }
    });

    art.on('video:pause', () => {
      if (art) {
        emit('pause', art.currentTime);
      }
    });

    art.on('video:seeked', () => {
      if (art) {
        emit('seeked', art.currentTime);
      }
    });

    art.on('video:ended', () => {
      emit('ended');
    });

    art.on('error', (error: Error) => {
      const errMsg = String(error);
      log.error('ArtPlayer', 'video element error', errMsg);
      emit('error', errMsg);
    });

    if (isHls) {
      const video = art.video as HTMLVideoElement;
      setupHls(video, playableUrl, art);
    }
  };

  watch(
    () => props.src,
    newSrc => {
      if (!art) return;
      proxyFallbackAttempted = false;

      const isHls = isHlsUrl(newSrc);
      const playableUrl = getPlayableUrl(newSrc);
      log.info('ArtPlayer', 'src changed', { newSrc, isHls, playableUrl });

      if (isHls) {
        const video = art.video as HTMLVideoElement;
        setupHls(video, playableUrl, art);
      } else {
        destroyHls();
        art.url = playableUrl;
      }
    },
  );

  onMounted(() => {
    initPlayer();
  });

  onUnmounted(() => {
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
