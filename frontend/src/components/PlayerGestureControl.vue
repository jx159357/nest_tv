<template>
  <div
    ref="gestureRef"
    class="gesture-control"
    @touchstart.passive="onTouchStart"
    @touchmove.passive="onTouchMove"
    @touchend="onTouchEnd"
    @dblclick="onDoubleClick"
  >
    <!-- 进度提示 -->
    <Transition name="fade">
      <div v-if="showProgressTip" class="gesture-tip gesture-tip--progress">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>{{ progressTipText }}</span>
      </div>
    </Transition>

    <!-- 音量提示 -->
    <Transition name="fade">
      <div v-if="showVolumeTip" class="gesture-tip gesture-tip--volume">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path
            v-if="currentVolume > 0"
            d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"
          />
          <line v-else x1="23" y1="9" x2="17" y2="15" />
        </svg>
        <span>{{ Math.round(currentVolume * 100) }}%</span>
      </div>
    </Transition>

    <!-- 亮度提示 -->
    <Transition name="fade">
      <div v-if="showBrightnessTip" class="gesture-tip gesture-tip--brightness">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        <span>{{ Math.round(currentBrightness * 100) }}%</span>
      </div>
    </Transition>

    <!-- 双击提示 -->
    <Transition name="fade">
      <div
        v-if="doubleTapSide"
        class="gesture-tip gesture-tip--double"
        :class="`gesture-tip--${doubleTapSide}`"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon v-if="doubleTapSide === 'left'" points="19 20 9 12 19 4 19 20" />
          <polygon v-else points="5 4 15 12 5 20 5 4" />
        </svg>
        <span>{{ doubleTapSide === 'left' ? '快退' : '快进' }} 10秒</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue';

  interface Props {
    videoElement?: HTMLVideoElement | null;
    enabled?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    videoElement: null,
    enabled: true,
  });

  const emit = defineEmits<{
    seek: [time: number];
    volumeChange: [volume: number];
    brightnessChange: [brightness: number];
    doubleTapLeft: [];
    doubleTapRight: [];
  }>();

  const gestureRef = ref<HTMLElement>();

  const showProgressTip = ref(false);
  const showVolumeTip = ref(false);
  const showBrightnessTip = ref(false);
  const progressTipText = ref('');
  const currentVolume = ref(0.7);
  const currentBrightness = ref(1);
  const doubleTapSide = ref<'left' | 'right' | null>(null);

  let startX = 0;
  let startY = 0;
  let startVolume = 0;
  let startBrightness = 1;
  let isDragging = false;
  let dragType: 'progress' | 'volume' | 'brightness' | null = null;
  let lastTapTime = 0;
  let doubleTapTimer: ReturnType<typeof setTimeout> | null = null;

  const onTouchStart = (e: TouchEvent) => {
    if (!props.enabled || !props.videoElement) return;

    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startVolume = props.videoElement.volume;
    startBrightness = currentBrightness.value;
    isDragging = false;
    dragType = null;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!props.enabled || !props.videoElement) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    if (!isDragging) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        isDragging = true;
        const rect = gestureRef.value?.getBoundingClientRect();
        if (rect) {
          const relativeX = startX - rect.left;
          const halfWidth = rect.width / 2;

          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            dragType = 'progress';
          } else {
            dragType = relativeX < halfWidth ? 'brightness' : 'volume';
          }
        }
      }
    }

    if (isDragging && dragType) {
      const rect = gestureRef.value?.getBoundingClientRect();
      if (!rect) return;

      switch (dragType) {
        case 'progress': {
          const seekDelta = (deltaX / rect.width) * 120;
          const newTime = Math.max(
            0,
            Math.min(props.videoElement.duration || 0, props.videoElement.currentTime + seekDelta),
          );
          progressTipText.value = `${formatTime(newTime)} / ${formatTime(props.videoElement.duration || 0)}`;
          showProgressTip.value = true;
          showVolumeTip.value = false;
          showBrightnessTip.value = false;
          break;
        }
        case 'volume': {
          const volumeDelta = -(deltaY / rect.height);
          const newVolume = Math.max(0, Math.min(1, startVolume + volumeDelta));
          currentVolume.value = newVolume;
          showVolumeTip.value = true;
          showProgressTip.value = false;
          showBrightnessTip.value = false;
          break;
        }
        case 'brightness': {
          const brightnessDelta = -(deltaY / rect.height);
          const newBrightness = Math.max(0.1, Math.min(1, startBrightness + brightnessDelta));
          currentBrightness.value = newBrightness;
          showBrightnessTip.value = true;
          showProgressTip.value = false;
          showVolumeTip.value = false;
          break;
        }
      }
    }
  };

  const onTouchEnd = () => {
    if (!props.enabled || !props.videoElement) return;

    if (isDragging && dragType) {
      switch (dragType) {
        case 'progress': {
          const rect = gestureRef.value?.getBoundingClientRect();
          if (rect) {
            const deltaX = 0;
            const seekDelta = (deltaX / rect.width) * 120;
            const newTime = Math.max(
              0,
              Math.min(
                props.videoElement.duration || 0,
                props.videoElement.currentTime + seekDelta,
              ),
            );
            emit('seek', newTime);
          }
          break;
        }
        case 'volume':
          emit('volumeChange', currentVolume.value);
          break;
        case 'brightness':
          emit('brightnessChange', currentBrightness.value);
          break;
      }
    }

    isDragging = false;
    dragType = null;

    setTimeout(() => {
      showProgressTip.value = false;
      showVolumeTip.value = false;
      showBrightnessTip.value = false;
    }, 500);
  };

  const onDoubleClick = (e: MouseEvent) => {
    if (!props.enabled || !props.videoElement) return;

    const now = Date.now();
    if (now - lastTapTime < 300) {
      if (doubleTapTimer) {
        clearTimeout(doubleTapTimer);
        doubleTapTimer = null;
      }

      const rect = gestureRef.value?.getBoundingClientRect();
      if (rect) {
        const relativeX = e.clientX - rect.left;
        const halfWidth = rect.width / 2;

        if (relativeX < halfWidth) {
          doubleTapSide.value = 'left';
          emit('doubleTapLeft');
        } else {
          doubleTapSide.value = 'right';
          emit('doubleTapRight');
        }

        setTimeout(() => {
          doubleTapSide.value = null;
        }, 500);
      }
    }

    lastTapTime = now;
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  onMounted(() => {
    if (props.videoElement) {
      currentVolume.value = props.videoElement.volume;
    }
  });

  onUnmounted(() => {
    if (doubleTapTimer) {
      clearTimeout(doubleTapTimer);
    }
  });
</script>

<style scoped>
  .gesture-control {
    position: absolute;
    inset: 0;
    z-index: 50;
    touch-action: none;
  }

  .gesture-tip {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 8px;
    color: white;
    font-size: 16px;
    font-weight: 500;
    pointer-events: none;
  }

  .gesture-tip svg {
    width: 20px;
    height: 20px;
  }

  .gesture-tip--double {
    top: 40%;
  }

  .gesture-tip--left {
    left: 30%;
  }

  .gesture-tip--right {
    left: 70%;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
