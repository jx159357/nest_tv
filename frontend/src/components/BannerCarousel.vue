<template>
  <div
    class="banner-carousel"
    @mouseenter="pauseAutoPlay"
    @mouseleave="resumeAutoPlay"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <div class="carousel-track" :style="trackStyle">
      <div
        v-for="(item, index) in items"
        :key="item.id"
        class="carousel-slide"
        :class="{ active: index === currentIndex }"
      >
        <div
          class="slide-bg"
          :class="{ 'slide-bg-placeholder': !hasHeroImage(item, index) }"
        >
          <img
            v-if="hasHeroImage(item, index)"
            :src="item.backdrop || item.poster"
            :alt="item.title"
            class="slide-bg-img"
            :class="{ loaded: loadedImages.has(index) }"
            @load="onImageLoad(index)"
            @error="onImageError(index)"
          />
          <div v-if="!hasHeroImage(item, index)" class="slide-placeholder-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <circle cx="8" cy="8" r="2" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <div class="slide-bg-overlay"></div>
        </div>

        <div class="slide-content">
          <div class="slide-info">
            <span class="slide-badge">{{ getBadgeText(item) }}</span>
            <h2 class="slide-title">{{ item.title }}</h2>
            <p v-if="item.description" class="slide-desc">{{ item.description }}</p>
            <div class="slide-meta">
              <span v-if="item.rating" class="meta-rating">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  />
                </svg>
                {{ item.rating.toFixed(1) }}
              </span>
              <span v-if="item.type" class="meta-type">{{ formatType(item.type) }}</span>
              <span v-if="item.releaseDate" class="meta-year">{{
                new Date(item.releaseDate).getFullYear()
              }}</span>
              <span v-if="item.genres?.length" class="meta-genre">{{ item.genres[0] }}</span>
            </div>
            <div class="slide-actions">
              <button class="btn-play" @click="$emit('play', item)">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                立即观看
              </button>
              <button class="btn-detail" @click="$emit('detail', item)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                详情
              </button>
            </div>
          </div>

          <div v-if="item.poster && !failedPosterImages.has(index)" class="slide-poster">
            <img :src="item.poster" :alt="item.title" @error="onPosterError(index)" />
          </div>
        </div>
      </div>
    </div>

    <button v-if="items.length > 1" class="carousel-arrow carousel-arrow--prev" @click="prev">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
    <button v-if="items.length > 1" class="carousel-arrow carousel-arrow--next" @click="next">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>

    <div v-if="items.length > 1" class="carousel-indicators">
      <button
        v-for="(_, index) in items"
        :key="index"
        class="indicator"
        :class="{ active: index === currentIndex }"
        @click="goTo(index)"
      >
        <span v-if="index === currentIndex" class="indicator-progress"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
  import type { MediaResource } from '@/types/media';

  const props = withDefaults(
    defineProps<{
      items: MediaResource[];
      interval?: number;
    }>(),
    {
      interval: 5000,
    },
  );

  defineEmits<{
    play: [item: MediaResource];
    detail: [item: MediaResource];
  }>();

  const currentIndex = ref(0);
  const loadedImages = reactive(new Set<number>());
  const failedHeroImages = reactive(new Set<number>());
  const failedPosterImages = reactive(new Set<number>());
  const isPaused = ref(false);

  let timer: ReturnType<typeof setInterval> | null = null;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let pointerMoved = false;

  const trackStyle = computed(() => ({
    transform: `translateX(-${currentIndex.value * 100}%)`,
  }));

  const formatType = (type: string) => {
    const map: Record<string, string> = {
      movie: '电影',
      tv_series: '电视剧',
      variety: '综艺',
      anime: '动漫',
      documentary: '纪录片',
    };
    return map[type] || type;
  };

  const getBadgeText = (item: MediaResource) => {
    if (item.rating && item.rating >= 9) return '口碑佳作';
    if (item.viewCount && item.viewCount > 10000) return '热门推荐';
    if (item.type === 'movie') return '精选电影';
    if (item.type === 'tv_series') return '热播剧集';
    return '精选推荐';
  };

  const hasHeroImage = (item: MediaResource, index: number) =>
    Boolean((item.backdrop || item.poster) && !failedHeroImages.has(index));

  const onImageLoad = (index: number) => {
    loadedImages.add(index);
    failedHeroImages.delete(index);
  };

  const onImageError = (index: number) => {
    loadedImages.delete(index);
    failedHeroImages.add(index);
  };

  const onPosterError = (index: number) => {
    failedPosterImages.add(index);
  };

  const goTo = (index: number) => {
    currentIndex.value = index;
    resetTimer();
  };

  const prev = () => {
    currentIndex.value = currentIndex.value === 0 ? props.items.length - 1 : currentIndex.value - 1;
    resetTimer();
  };

  const next = () => {
    currentIndex.value = currentIndex.value === props.items.length - 1 ? 0 : currentIndex.value + 1;
    resetTimer();
  };

  const startAutoPlay = () => {
    stopAutoPlay();
    if (props.items.length <= 1) return;
    timer = setInterval(() => {
      if (!isPaused.value) {
        next();
      }
    }, props.interval);
  };

  const stopAutoPlay = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const resetTimer = () => {
    stopAutoPlay();
    startAutoPlay();
  };

  const pauseAutoPlay = () => {
    isPaused.value = true;
  };

  const resumeAutoPlay = () => {
    isPaused.value = false;
  };

  const onPointerDown = (e: PointerEvent) => {
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    pointerMoved = false;
  };

  const onPointerMove = (e: PointerEvent) => {
    const dx = Math.abs(e.clientX - pointerStartX);
    const dy = Math.abs(e.clientY - pointerStartY);
    if (dx > 10 || dy > 10) pointerMoved = true;
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!pointerMoved) return;
    const dx = e.clientX - pointerStartX;
    if (Math.abs(dx) > 50) {
      dx > 0 ? prev() : next();
    }
  };

  watch(
    () => props.items,
    () => {
      loadedImages.clear();
      failedHeroImages.clear();
      failedPosterImages.clear();
      currentIndex.value = 0;
      startAutoPlay();
    },
  );

  onMounted(() => {
    startAutoPlay();
  });

  onUnmounted(() => {
    stopAutoPlay();
  });
</script>

<style scoped>
  .banner-carousel {
    position: relative;
    width: 100%;
    aspect-ratio: 21 / 9;
    min-height: 360px;
    max-height: 560px;
    border-radius: var(--panel-radius);
    overflow: hidden;
    background: var(--bg-cinema-soft);
    box-shadow: 0 30px 76px rgba(0, 0, 0, 0.42);
    touch-action: pan-y;
  }

  .carousel-track {
    display: flex;
    width: 100%;
    height: 100%;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .carousel-slide {
    flex: 0 0 100%;
    position: relative;
  }

  .slide-bg {
    position: absolute;
    inset: 0;
  }

  .slide-bg-placeholder {
    background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .slide-placeholder-icon {
    width: 80px;
    height: 80px;
    color: var(--text-muted);
    opacity: 0.4;
  }

  .slide-placeholder-icon svg {
    width: 100%;
    height: 100%;
  }

  .slide-bg-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.5s ease;
    filter: brightness(0.5) saturate(1.08);
    transform: scale(1.05);
  }

  .slide-bg-img.loaded {
    opacity: 1;
  }

  .slide-bg-overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(to top, rgba(5, 6, 9, 0.94) 0%, rgba(5, 6, 9, 0.18) 52%),
      linear-gradient(to right, rgba(5, 6, 9, 0.98) 0%, rgba(5, 6, 9, 0.66) 42%, rgba(5, 6, 9, 0.16) 100%);
  }

  .slide-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 54px 58px 70px;
    gap: 32px;
  }

  .slide-info {
    flex: 1;
    max-width: 610px;
  }

  .slide-badge {
    display: inline-block;
    padding: 5px 12px;
    background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent));
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-inverse);
    margin-bottom: 14px;
  }

  .slide-title {
    font-size: clamp(30px, 4vw, 46px);
    font-weight: 700;
    color: var(--text-inverse);
    line-height: 1.25;
    margin-bottom: 12px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .slide-desc {
    font-size: 14px;
    color: rgba(226, 232, 240, 0.76);
    line-height: 1.6;
    margin-bottom: 16px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .slide-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .meta-rating {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--color-warning-light);
    font-weight: 600;
    font-size: 14px;
  }

  .meta-rating svg {
    width: 16px;
    height: 16px;
  }

  .meta-type,
  .meta-year,
  .meta-genre {
    padding: 3px 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    font-size: 12px;
    color: var(--text-tertiary);
  }

  .slide-actions {
    display: flex;
    gap: 12px;
  }

  .btn-play {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent));
    border: none;
    border-radius: 8px;
    color: var(--text-inverse);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-play:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px var(--color-brand-glow);
  }

  .btn-play svg {
    width: 16px;
    height: 16px;
  }

  .btn-detail {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-detail:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  .btn-detail svg {
    width: 16px;
    height: 16px;
  }

  .slide-poster {
    flex-shrink: 0;
    width: 190px;
    height: 266px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  }

  .slide-poster img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .carousel-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 50%;
    color: var(--text-inverse);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.2s;
    z-index: 5;
  }

  .banner-carousel:hover .carousel-arrow {
    opacity: 1;
  }

  .carousel-arrow:hover {
    background: rgba(229, 9, 20, 0.72);
  }

  .carousel-arrow svg {
    width: 20px;
    height: 20px;
  }

  .carousel-arrow--prev {
    left: 16px;
  }

  .carousel-arrow--next {
    right: 16px;
  }

  .carousel-indicators {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    z-index: 5;
  }

  .indicator {
    width: 24px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.3);
    border: none;
    cursor: pointer;
    overflow: hidden;
    padding: 0;
    transition: width 0.3s ease;
  }

  .indicator.active {
    width: 36px;
    background: rgba(255, 255, 255, 0.5);
  }

  .indicator-progress {
    display: block;
    height: 100%;
    background: var(--color-brand-primary);
    border-radius: 2px;
    animation: progress 5s linear forwards;
  }

  @keyframes progress {
    from {
      width: 0%;
    }
    to {
      width: 100%;
    }
  }

  @media (max-width: 768px) {
    .banner-carousel {
      aspect-ratio: 16 / 9;
      min-height: 250px;
      border-radius: var(--panel-radius);
    }

    .slide-content {
      padding: 28px 24px 48px;
    }

    .slide-title {
      font-size: 22px;
    }

    .slide-desc {
      display: none;
    }

    .slide-poster {
      width: 110px;
      height: 154px;
    }

    .carousel-arrow {
      display: none;
    }

    .btn-play,
    .btn-detail {
      padding: 10px 16px;
      font-size: 13px;
    }
  }

  @media (max-width: 480px) {
    .banner-carousel {
      min-height: 230px;
    }

    .slide-poster {
      display: none;
    }

    .slide-info {
      max-width: 100%;
    }

    .slide-title {
      font-size: 20px;
    }

    .slide-actions {
      flex-direction: column;
    }

    .btn-play,
    .btn-detail {
      width: 100%;
      justify-content: center;
    }
  }
</style>
