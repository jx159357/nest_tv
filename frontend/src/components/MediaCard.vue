<template>
  <div
    class="media-card"
    :class="cardClasses"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable && !loading ? 0 : -1"
    :aria-label="clickable ? `查看 ${media.title}` : undefined"
    v-on="longPress.handlers"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <!-- 骨架屏加载状态 -->
    <div v-if="loading" class="media-card__skeleton">
      <div class="media-card__skeleton-image"></div>
      <div class="media-card__skeleton-content">
        <div class="media-card__skeleton-title"></div>
        <div class="media-card__skeleton-meta"></div>
      </div>
    </div>

    <!-- 实际内容 -->
    <template v-else>
      <!-- 图片区域 -->
      <div ref="imageContainer" class="media-card__image">
        <!-- 图片加载占位 -->
        <div v-if="!imageLoaded && !imageError" class="media-card__image-placeholder"></div>

        <!-- 错误状态 -->
        <div v-if="imageError" class="media-card__image-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        <!-- 实际图片 -->
        <img
          v-if="media.poster && !imageError && shouldLoadImage"
          ref="imageElement"
          :src="imageSrc"
          :alt="media.title"
          class="media-card__image-img"
          :class="{
            'media-card__image-img--loaded': imageLoaded,
            'media-card__image-img--loading': !imageLoaded,
          }"
          :loading="lazyLoading ? 'lazy' : 'eager'"
          @load="handleImageLoad"
          @error="handleImageError"
        />

        <!-- 悬浮遮罩 -->
        <div class="media-card__overlay">
          <div class="media-card__play-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>

        <!-- 评分标签 -->
        <div v-if="showRating && media.rating" class="media-card__rating">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            />
          </svg>
          <span>{{ media.rating.toFixed(1) }}</span>
        </div>

        <!-- 类型标签 -->
        <div v-if="media.type" class="media-card__type">
          {{ mediaTypeLabel }}
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="media-card__content">
        <h3 class="media-card__title">{{ media.title }}</h3>

        <div v-if="showMeta" class="media-card__meta">
          <span v-if="showReleaseDate && releaseYear" class="media-card__meta-pill">
            {{ releaseYear }}
          </span>
          <span v-if="media.quality" class="media-card__meta-pill media-card__meta-pill--quality">
            {{ qualityLabel }}
          </span>
          <span v-if="sourceCount > 0" class="media-card__meta-pill"> {{ sourceCount }}源 </span>
          <span v-if="showViewCount && media.viewCount" class="media-card__views">
            {{ formattedViewCount }}次
          </span>
        </div>
      </div>
    </template>

    <!-- 移动端长按操作菜单 -->
    <Teleport to="body">
      <Transition name="sheet">
        <div v-if="showActionSheet" class="action-sheet-overlay" @click="showActionSheet = false">
          <div class="action-sheet" @click.stop>
            <div class="action-sheet__header">
              <h3>{{ media.title }}</h3>
            </div>
            <div class="action-sheet__list">
              <button class="action-sheet__item" type="button" @click="handleAction('detail')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                查看详情
              </button>
              <button class="action-sheet__item" type="button" @click="handleAction('favorite')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
                收藏
              </button>
              <button class="action-sheet__item" type="button" @click="handleAction('share')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                分享
              </button>
            </div>
            <button class="action-sheet__cancel" type="button" @click="showActionSheet = false">
              取消
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
  import { iptvApi } from '@/api/iptv';
  import type { MediaResource } from '@/types/media';
  import { useLongPress } from '@/composables/useLongPress';

  const MEDIA_TYPE_MAP: Record<string, string> = {
    movie: '电影',
    tv_series: '电视剧',
    variety: '综艺',
    anime: '动漫',
    documentary: '纪录片',
  };

  const formatViewCount = (count?: number): string => {
    if (!count) return '0';
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`;
    }
    return count.toString();
  };

  interface Props {
    media: MediaResource;
    loading?: boolean;
    showRating?: boolean;
    showViewCount?: boolean;
    showMeta?: boolean;
    showReleaseDate?: boolean;
    clickable?: boolean;
    size?: 'small' | 'medium' | 'large';
    hoverable?: boolean;
    lazyLoading?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    showRating: true,
    showViewCount: true,
    showMeta: true,
    showReleaseDate: true,
    clickable: true,
    size: 'medium',
    hoverable: true,
    lazyLoading: true,
  });

  const emit = defineEmits<{
    click: [media: MediaResource];
    favorite: [media: MediaResource];
    share: [media: MediaResource];
    imageError: [event: Event];
    imageLoad: [event: Event];
  }>();

  const showActionSheet = ref(false);

  const longPress = useLongPress({
    delay: 500,
    onLongPress: () => {
      showActionSheet.value = true;
    },
  });

  const handleAction = (action: string) => {
    showActionSheet.value = false;
    if (action === 'detail') emit('click', props.media);
    if (action === 'favorite') emit('favorite', props.media);
    if (action === 'share') emit('share', props.media);
  };

  const imageLoaded = ref(false);
  const imageError = ref(false);
  const useProxy = ref(false);
  const observer = ref<IntersectionObserver | null>(null);
  const imageElement = ref<HTMLImageElement | null>(null);
  const imageContainer = ref<HTMLDivElement | null>(null);
  const shouldLoadImage = ref(!props.lazyLoading);
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  const imageSrc = computed(() => {
    const url = props.media.poster;
    if (!url) return '';
    if (useProxy.value && (url.startsWith('http://') || url.startsWith('https://'))) {
      return iptvApi.getImageProxyUrl(url);
    }
    return url;
  });

  const mediaTypeLabel = computed(() => MEDIA_TYPE_MAP[props.media.type] || props.media.type);

  const formattedViewCount = computed(() => formatViewCount(props.media.viewCount));

  const releaseYear = computed(() => {
    if (!props.media.releaseDate) return '';
    const date =
      typeof props.media.releaseDate === 'string'
        ? new Date(props.media.releaseDate)
        : props.media.releaseDate;
    const year = date.getFullYear();
    return Number.isNaN(year) ? '' : String(year);
  });

  const qualityLabel = computed(() => {
    const map: Record<string, string> = {
      sd: 'SD',
      hd: 'HD',
      full_hd: '1080P',
      blue_ray: '蓝光',
    };
    return map[props.media.quality] || String(props.media.quality).toUpperCase();
  });

  const sourceCount = computed(() => props.media.playSources?.length ?? 0);

  const cardClasses = computed(() => [
    `media-card--${props.size}`,
    {
      'media-card--clickable': props.clickable,
      'media-card--hoverable': props.hoverable,
      'media-card--loading': props.loading,
      'media-card--pressed': longPress.isPressed.value,
      'media-card--long-pressing': longPress.isLongPress.value,
    },
  ]);

  const handleClick = () => {
    if (props.clickable && !props.loading) {
      emit('click', props.media);
    }
  };

  const handleImageLoad = (event: Event) => {
    imageLoaded.value = true;
    imageError.value = false;
    emit('imageLoad', event);
  };

  const handleImageError = (event: Event) => {
    if (!useProxy.value && props.media.poster?.startsWith('http')) {
      useProxy.value = true;
      return;
    }
    imageLoaded.value = false;
    imageError.value = true;
    emit('imageError', event);
  };

  const setupIntersectionObserver = async () => {
    if (!props.lazyLoading || !('IntersectionObserver' in window)) {
      shouldLoadImage.value = true;
      return;
    }

    await nextTick();

    const target = imageContainer.value || imageElement.value;
    if (!target) {
      shouldLoadImage.value = true;
      return;
    }

    observer.value = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            shouldLoadImage.value = true;
            clearFallbackTimer();
            observer.value?.unobserve(entry.target);
            break;
          }
        }
      },
      {
        rootMargin: '200px',
        threshold: 0.01,
      },
    );

    observer.value.observe(target);

    fallbackTimer = setTimeout(() => {
      if (!shouldLoadImage.value) {
        shouldLoadImage.value = true;
      }
    }, 1500);
  };

  const clearFallbackTimer = () => {
    if (fallbackTimer) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  };

  watch(
    () => props.media.poster,
    () => {
      imageLoaded.value = false;
      imageError.value = false;
      useProxy.value = false;
    },
  );

  onMounted(() => {
    setupIntersectionObserver();
  });

  onUnmounted(() => {
    clearFallbackTimer();
    observer.value?.disconnect();
    observer.value = null;
  });
</script>

<style scoped>
  .media-card {
    background: transparent;
    border-radius: var(--poster-radius);
    overflow: hidden;
    transition: all var(--transition-normal);
    border: 0;
    min-width: 0;
  }

  .media-card--clickable {
    cursor: pointer;
  }

  .media-card--clickable:focus-visible {
    outline: 2px solid var(--border-focus);
    outline-offset: 4px;
  }

  .media-card--loading {
    pointer-events: none;
  }

  /* 骨架屏 */
  .media-card__skeleton {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .media-card__skeleton-image {
    aspect-ratio: 2 / 3;
    background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
  }

  .media-card__skeleton-content {
    padding: var(--spacing-3);
  }

  .media-card__skeleton-title {
    height: 14px;
    background: var(--bg-secondary);
    border-radius: var(--radius-sm);
    margin-bottom: var(--spacing-2);
    width: 80%;
  }

  .media-card__skeleton-meta {
    height: 12px;
    background: var(--bg-secondary);
    border-radius: var(--radius-sm);
    width: 60%;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  /* 图片区域 */
  .media-card__image {
    position: relative;
    aspect-ratio: 2 / 3;
    overflow: hidden;
    background: var(--bg-card);
    border-radius: 8px;
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.08),
      0 10px 24px rgba(0, 0, 0, 0.22);
  }

  .media-card__image-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition:
      transform 0.5s ease,
      opacity var(--transition-normal);
  }

  .media-card__image-img--loaded {
    opacity: 1;
  }

  .media-card__image-img--loading {
    opacity: 0;
  }

  .media-card__image-placeholder {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
    animation: pulse 2s ease-in-out infinite;
  }

  .media-card__image-error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-card);
    color: var(--text-muted);
  }

  .media-card__image-error svg {
    width: 32px;
    height: 32px;
  }

  /* 悬浮遮罩 */
  .media-card__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.88) 0%,
      rgba(0, 0, 0, 0.2) 58%,
      transparent 100%
    );
    opacity: 0;
    transition: opacity var(--transition-normal);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .media-card__play-btn {
    width: 44px;
    height: 44px;
    background: var(--color-brand-primary);
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    transform: scale(0.8);
    transition: transform var(--transition-normal);
    box-shadow: 0 12px 32px var(--color-brand-glow);
  }

  .media-card__play-btn svg {
    width: 22px;
    height: 22px;
    color: var(--text-inverse);
    margin-left: 2px;
  }

  /* 评分标签 */
  .media-card__rating {
    position: absolute;
    top: var(--spacing-2);
    right: var(--spacing-2);
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    padding: var(--spacing-1) var(--spacing-2);
    background: rgba(0, 0, 0, 0.78);
    backdrop-filter: blur(8px);
    border-radius: 6px;
    font-size: var(--font-size-xs);
    color: var(--color-brand-secondary);
    font-weight: var(--font-weight-semibold);
  }

  .media-card__rating svg {
    width: 12px;
    height: 12px;
  }

  /* 类型标签 */
  .media-card__type {
    position: absolute;
    bottom: var(--spacing-2);
    left: var(--spacing-2);
    padding: var(--spacing-1) var(--spacing-2);
    background: rgba(229, 9, 20, 0.9);
    border-radius: 6px;
    font-size: 11px;
    font-weight: var(--font-weight-semibold);
    color: var(--text-inverse);
  }

  /* 内容区域 */
  .media-card__content {
    padding: 8px 1px 0;
  }

  .media-card__title {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-1);
    line-height: 1.35;
    min-height: 38px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color var(--transition-fast);
  }

  .media-card:focus-visible .media-card__overlay {
    opacity: 1;
  }

  .media-card:focus-visible .media-card__play-btn {
    transform: scale(1);
  }

  .media-card:focus-visible .media-card__title {
    color: var(--color-brand-primary-light);
  }

  .media-card__meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    min-height: 20px;
  }

  .media-card__views,
  .media-card__date,
  .media-card__meta-pill {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
  }

  .media-card__meta-pill {
    min-height: 20px;
    padding: 0 7px;
    border: 1px solid var(--border-primary);
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.045);
    color: var(--text-tertiary);
    font-weight: var(--font-weight-medium);
    line-height: 1;
    max-width: 100%;
  }

  .media-card__meta-pill--quality {
    border-color: var(--color-brand-border);
    background: var(--color-brand-overlay);
    color: var(--color-brand-primary-light);
  }

  /* 尺寸变体 */
  .media-card--small .media-card__content {
    padding: 8px 2px 0;
  }

  .media-card--small .media-card__title {
    font-size: var(--font-size-xs);
  }

  .media-card--large .media-card__content {
    padding: 12px 2px 0;
  }

  .media-card--large .media-card__title {
    font-size: var(--font-size-base);
  }

  /* 长按状态 */
  .media-card--pressed {
    transform: scale(0.97);
    transition: transform 0.15s ease;
  }

  .media-card--long-pressing {
    transform: scale(0.95);
    box-shadow: 0 0 0 2px var(--color-brand-primary);
  }

  /* 操作菜单 */
  .action-sheet-overlay {
    position: fixed;
    inset: 0;
    background: var(--bg-overlay);
    z-index: var(--z-modal);
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .action-sheet {
    width: 100%;
    max-width: 480px;
    background: var(--bg-card);
    border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
    padding: var(--spacing-2) 0 calc(var(--spacing-2) + env(safe-area-inset-bottom));
    box-shadow: var(--shadow-xl);
  }

  .action-sheet__header {
    padding: var(--spacing-4) var(--spacing-5) var(--spacing-3);
    text-align: center;
  }

  .action-sheet__header h3 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action-sheet__list {
    padding: 0 var(--spacing-2);
  }

  .action-sheet__item {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    width: 100%;
    padding: var(--spacing-3) var(--spacing-4);
    background: transparent;
    border: none;
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    font-size: var(--font-size-base);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .action-sheet__item:hover {
    background: var(--bg-secondary);
  }

  .action-sheet__item svg {
    width: 20px;
    height: 20px;
    color: var(--text-muted);
  }

  .action-sheet__cancel {
    display: block;
    width: calc(100% - var(--spacing-4));
    margin: var(--spacing-2) var(--spacing-2) 0;
    padding: var(--spacing-3);
    background: var(--bg-secondary);
    border: none;
    border-radius: var(--radius-lg);
    color: var(--text-muted);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .action-sheet__cancel:hover {
    background: var(--bg-tertiary);
  }

  @media (hover: hover) {
    .media-card--hoverable:hover {
      transform: translateY(-3px);
    }

    .media-card:hover .media-card__image-img--loaded {
      transform: scale(1.06);
    }

    .media-card:hover .media-card__overlay {
      opacity: 1;
    }

    .media-card:hover .media-card__play-btn {
      transform: scale(1);
    }

    .media-card:hover .media-card__title {
      color: var(--color-brand-primary-light);
    }
  }

  @media (max-width: 480px) {
    .media-card__rating,
    .media-card__type {
      max-width: calc(100% - 16px);
    }

    .media-card__title {
      font-size: 13px;
      min-height: 36px;
    }

    .media-card__meta {
      min-height: 18px;
    }
  }

  .sheet-enter-active,
  .sheet-leave-active {
    transition: opacity var(--transition-fast);
  }

  .sheet-enter-active .action-sheet,
  .sheet-leave-active .action-sheet {
    transition: transform var(--transition-slow) cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sheet-enter-from,
  .sheet-leave-to {
    opacity: 0;
  }

  .sheet-enter-from .action-sheet,
  .sheet-leave-to .action-sheet {
    transform: translateY(100%);
  }
</style>
