<template>
  <div ref="artRef" class="art-player-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

interface Props {
  src: string;
  title?: string;
  poster?: string;
  autoplay?: boolean;
  currentTime?: number;
  quality?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  poster: '',
  autoplay: false,
  currentTime: 0,
  quality: '1080p',
});

const emit = defineEmits<{
  ready: [player: Artplayer];
  timeupdate: [currentTime: number];
  ended: [];
  error: [error: string];
  qualityChange: [quality: string];
}>();

const artRef = ref<HTMLDivElement>();
let art: Artplayer | null = null;
let hls: Hls | null = null;

const isHlsUrl = (url: string): boolean => {
  return url.includes('.m3u8') || url.includes('m3u8');
};

const isMagnetUrl = (url: string): boolean => {
  return url.startsWith('magnet:');
};

const initHls = (url: string): void => {
  if (!art?.video) return;

  if (Hls.isSupported()) {
    hls = new Hls({
      maxBufferLength: 30,
      maxMaxBufferLength: 600,
      startFragPrefetch: true,
      enableWorker: true,
    });

    hls.loadSource(url);
    hls.attachMedia(art.video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (props.autoplay) {
        art?.play();
      }
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls?.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls?.recoverMediaError();
            break;
          default:
            emit('error', `HLS 播放错误: ${data.details}`);
            break;
        }
      }
    });
  } else if (art.video.canPlayType('application/vnd.apple.mpegurl')) {
    art.video.src = url;
  }
};

const destroyHls = (): void => {
  if (hls) {
    hls.destroy();
    hls = null;
  }
};

const initPlayer = (): void => {
  if (!artRef.value) return;

  art = new Artplayer({
    container: artRef.value!,
    url: props.src,
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
      loading: '<div class="art-loading"><div class="art-loading-spinner"></div></div>',
      state: '<div class="art-state"><div class="art-state-icon"></div></div>',
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
  });

  art.on('ready', () => {
    if (props.currentTime > 0) {
      art!.currentTime = props.currentTime;
    }
    emit('ready', art!);
  });

  art.on('video:timeupdate', () => {
    if (art) {
      emit('timeupdate', art.currentTime);
    }
  });

  art.on('video:ended', () => {
    emit('ended');
  });

  art.on('error', (error: string) => {
    emit('error', String(error));
  });

  if (isHlsUrl(props.src)) {
    initHls(props.src);
  }
};

watch(
  () => props.src,
  (newSrc) => {
    if (!art) return;

    destroyHls();

    if (isHlsUrl(newSrc)) {
      initHls(newSrc);
    } else {
      art.url = newSrc;
    }
  },
);

onMounted(() => {
  initPlayer();
});

onUnmounted(() => {
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
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

:deep(.art-state) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

:deep(.art-state-icon) {
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
