<template>
  <div ref="artRef" class="art-player-container"></div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted, ref, watch } from 'vue';
  import Artplayer from 'artplayer';
  import Hls from 'hls.js';
  import artplayerPluginHlsControl from 'artplayer-plugin-hls-control';

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
    ended: [];
    error: [error: string];
  }>();

  const artRef = ref<HTMLDivElement>();
  let art: Artplayer | null = null;

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
    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
    return `${apiBase}/iptv/stream/proxy?url=${encodeURIComponent(url)}`;
  };

  const getPlayableUrl = (url: string): string => {
    if (isCrossOrigin(url)) {
      return getProxiedUrl(url);
    }
    return url;
  };

  const playM3u8 = (video: HTMLVideoElement, url: string, art: Artplayer): void => {
    const hls = new Hls({
      maxBufferLength: 30,
      maxMaxBufferLength: 600,
      startFragPrefetch: true,
      enableWorker: true,
    });

    hls.loadSource(url);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (props.autoplay) {
        art.play();
      }
    });

    let networkRetries = 0;
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            if (networkRetries < 3) {
              networkRetries++;
              hls.startLoad();
            } else {
              emit('error', 'Network error, failed to load stream');
              hls.destroy();
            }
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            emit('error', `HLS playback error: ${data.details}`);
            hls.destroy();
            break;
        }
      }
    });

    art.on('destroy', () => {
      hls.destroy();
    });
  };

  const initPlayer = (): void => {
    if (!artRef.value) return;

    const isHls = isHlsUrl(props.src);
    const playableUrl = getPlayableUrl(props.src);

    art = new Artplayer({
      container: artRef.value!,
      url: isHls ? '' : playableUrl,
      poster: props.poster,
      autoplay: props.autoplay,
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
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: false,
      miniProgressBar: true,
      icons: {
        // loading: '<div class="art-loading"><div class="art-loading-spinner"></div></div>',
        // state: '<div class="art-state"><div class="art-state-icon"></div></div>',
        loading: '',
        state: '',
        play: '',
        pause: '',
        volume: '',
        volumeClose: '',
        screenshot: '',
        setting: '',
        fullscreen: '',
        fullscreenWeb: '',
        pip: '',
        arrowLeft: '',
        arrowRight: '',
        playbackRate: '',
        aspectRatio: '',
        flip: '',
        quality: '',
      },
      ...(isHls
        ? {
            customType: {
              m3u8: playM3u8,
            },
            plugins: [
              artplayerPluginHlsControl({
                quality: {
                  control: true,
                  setting: true,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  getName: (level: any) => `${level.height}P`,
                  title: 'Quality',
                  auto: 'Auto',
                },
                audio: {
                  control: true,
                  setting: true,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  getName: (track: any) => track.name || `Track ${track.id}`,
                  title: 'Audio',
                  auto: 'Auto',
                },
              }),
            ],
          }
        : {}),
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

    art.on('video:ended', () => {
      emit('ended');
    });

    art.on('error', (error: Error) => {
      emit('error', String(error));
    });

    if (isHls) {
      art.url = playableUrl;
    }
  };

  watch(
    () => props.src,
    newSrc => {
      if (!art) return;

      const isHls = isHlsUrl(newSrc);
      const playableUrl = getPlayableUrl(newSrc);

      if (isHls) {
        art.url = playableUrl;
      } else {
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
