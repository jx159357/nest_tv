<template>
  <div ref="containerRef" class="iptv-player">
    <div class="player-wrapper">
      <video
        ref="videoRef"
        class="player-video"
        :muted="isMuted"
        playsinline
        @play="isPlaying = true"
        @pause="isPlaying = false"
        @error="onError"
        @waiting="isLoading = true"
        @playing="isLoading = false"
        @canplay="isLoading = false"
      />

      <div v-if="isLoading" class="player-loading">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>

      <div v-if="error" class="player-error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>{{ error }}</p>
        <button class="btn-retry" @click="loadStream">重试</button>
      </div>

      <div v-if="!isPlaying && !isLoading && !error" class="player-overlay" @click="play">
        <div class="play-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      </div>
    </div>

    <div class="player-controls">
      <button class="ctrl-btn" @click="togglePlay">
        <svg v-if="isPlaying" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </button>

      <button class="ctrl-btn" @click="toggleMute">
        <svg v-if="isMuted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      </button>

      <input
        type="range"
        class="volume-slider"
        min="0"
        max="1"
        step="0.05"
        :value="isMuted ? 0 : volume"
        @input="onVolumeChange"
      />

      <div class="spacer"></div>

      <button class="ctrl-btn" @click="toggleFullscreen">
        <svg v-if="isFullscreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import Hls from 'hls.js';

const props = defineProps<{
  src: string;
  autoplay?: boolean;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const isPlaying = ref(false);
const isMuted = ref(false);
const isLoading = ref(true);
const isFullscreen = ref(false);
const volume = ref(0.8);
const error = ref<string | null>(null);

let hls: Hls | null = null;

const isHlsStream = (url: string) => {
  return url.includes('.m3u8') || url.includes('m3u8');
};

const getProxiedUrl = (url: string) => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
  return `${apiBase}/iptv/stream/proxy?url=${encodeURIComponent(url)}`;
};

const loadStream = () => {
  if (!videoRef.value) return;
  error.value = null;
  isLoading.value = true;

  if (hls) {
    hls.destroy();
    hls = null;
  }

  const video = videoRef.value;
  const streamUrl = getProxiedUrl(props.src);

  if (isHlsStream(props.src)) {
    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        isLoading.value = false;
        if (props.autoplay) {
          video.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              error.value = '网络错误，正在重试...';
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              error.value = '媒体错误，正在恢复...';
              hls?.recoverMediaError();
              break;
            default:
              error.value = '播放失败，请检查链接是否有效';
              hls?.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        isLoading.value = false;
        if (props.autoplay) {
          video.play().catch(() => {});
        }
      });
    } else {
      error.value = '您的浏览器不支持 HLS 播放';
      isLoading.value = false;
    }
  } else {
    video.src = streamUrl;
    video.addEventListener('loadedmetadata', () => {
      isLoading.value = false;
      if (props.autoplay) {
        video.play().catch(() => {});
      }
    });
  }
};

const play = () => {
  videoRef.value?.play().catch(() => {});
};

const togglePlay = () => {
  if (!videoRef.value) return;
  if (isPlaying.value) {
    videoRef.value.pause();
  } else {
    videoRef.value.play().catch(() => {});
  }
};

const toggleMute = () => {
  isMuted.value = !isMuted.value;
};

const onVolumeChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  volume.value = parseFloat(target.value);
  isMuted.value = volume.value === 0;
};

const toggleFullscreen = () => {
  if (!containerRef.value) return;
  if (!document.fullscreenElement) {
    containerRef.value.requestFullscreen().then(() => {
      isFullscreen.value = true;
    }).catch(() => {});
  } else {
    document.exitFullscreen().then(() => {
      isFullscreen.value = false;
    }).catch(() => {});
  }
};

const onError = () => {
  if (!error.value) {
    error.value = '播放出错，请检查链接';
    isLoading.value = false;
  }
};

const onFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

watch(() => props.src, () => {
  loadStream();
});

onMounted(() => {
  loadStream();
  document.addEventListener('fullscreenchange', onFullscreenChange);
});

onUnmounted(() => {
  if (hls) {
    hls.destroy();
  }
  document.removeEventListener('fullscreenchange', onFullscreenChange);
});
</script>

<style scoped>
.iptv-player {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.player-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
}

.player-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.player-loading,
.player-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  gap: 12px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.player-error svg {
  width: 40px;
  height: 40px;
  opacity: 0.6;
}

.player-error p {
  font-size: 14px;
  opacity: 0.8;
}

.btn-retry {
  padding: 8px 20px;
  background: rgba(99, 102, 241, 0.8);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-retry:hover {
  background: rgba(99, 102, 241, 1);
}

.player-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: background 0.2s;
}

.player-overlay:hover {
  background: rgba(0, 0, 0, 0.5);
}

.play-icon {
  width: 64px;
  height: 64px;
  background: rgba(99, 102, 241, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.player-overlay:hover .play-icon {
  transform: scale(1.1);
}

.play-icon svg {
  width: 28px;
  height: 28px;
  color: white;
  margin-left: 3px;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.9));
}

.ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.ctrl-btn svg {
  width: 18px;
  height: 18px;
}

.volume-slider {
  width: 80px;
  height: 4px;
  accent-color: #6366f1;
  cursor: pointer;
}

.spacer {
  flex: 1;
}
</style>
