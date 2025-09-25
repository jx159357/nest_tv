<template>
  <div
    class="app-card"
    :class="[
      `app-card--${variant}`,
      `app-card--${elevation}`,
      `app-card--${size}`,
      { 'app-card--hoverable': hoverable },
      { 'app-card--clickable': clickable },
      { 'app-card--selected': selected },
      { 'app-card--loading': loading },
      className,
    ]"
    @click="handleClick"
  >
    <!-- 卡片头部 -->
    <div v-if="$slots.header || title || subtitle" class="app-card__header">
      <slot name="header">
        <div class="app-card__title-section">
          <h3 v-if="title" class="app-card__title">{{ title }}</h3>
          <p v-if="subtitle" class="app-card__subtitle">{{ subtitle }}</p>
        </div>
        <div v-if="$slots.actions" class="app-card__actions">
          <slot name="actions"></slot>
        </div>
      </slot>
    </div>

    <!-- 卡片媒体 -->
    <div v-if="$slots.media || image" class="app-card__media">
      <slot name="media">
        <img v-if="image" :src="image" :alt="imageAlt || title" class="app-card__image" />
      </slot>
    </div>

    <!-- 卡片内容 -->
    <div class="app-card__content">
      <slot>
        <p v-if="description" class="app-card__description">{{ description }}</p>
      </slot>
    </div>

    <!-- 卡片底部 -->
    <div v-if="$slots.footer || footer" class="app-card__footer">
      <slot name="footer">
        <div class="app-card__footer-content">
          {{ footer }}
        </div>
      </slot>
    </div>

    <!-- 加载遮罩 -->
    <div v-if="loading" class="app-card__loading-overlay">
      <div class="app-card__loading-spinner">
        <div class="app-card__loading-spinner-circle"></div>
      </div>
    </div>

    <!-- 选中状态指示器 -->
    <div v-if="selected" class="app-card__selected-indicator">
      <svg class="app-card__selected-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-5.586-5.585z" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'outlined' | 'elevated'
  elevation?: 0 | 1 | 2 | 3 | 4 | 5
  size?: 'sm' | 'md' | 'lg'
  title?: string
  subtitle?: string
  description?: string
  image?: string
  imageAlt?: string
  footer?: string
  hoverable?: boolean
  clickable?: boolean
  selected?: boolean
  loading?: boolean
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  elevation: 1,
  size: 'md',
  title: '',
  subtitle: '',
  description: '',
  image: '',
  imageAlt: '',
  footer: '',
  hoverable: false,
  clickable: false,
  selected: false,
  loading: false,
  className: '',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const slots = useSlots()

const handleClick = (event: MouseEvent) => {
  if (!props.loading && props.clickable) {
    emit('click', event)
  }
}
</script>

<style scoped>
.app-card {
  position: relative;
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

/* Variants */
.app-card--default {
  border: 1px solid #e5e7eb;
}

.app-card--outlined {
  border: 2px solid #667eea;
  background: #f9fafb;
}

.app-card--elevated {
  border: 1px solid #e5e7eb;
}

/* Elevations */
.app-card--0 {
  box-shadow: none;
}

.app-card--1 {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
}

.app-card--2 {
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
}

.app-card--3 {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
}

.app-card--4 {
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
}

.app-card--5 {
  box-shadow: 0 19px 38px rgba(0, 0, 0, 0.3), 0 15px 12px rgba(0, 0, 0, 0.22);
}

/* States */
.app-card--hoverable:hover {
  transform: translateY(-2px);
}

.app-card--clickable {
  cursor: pointer;
}

.app-card--clickable:active {
  transform: translateY(0);
}

.app-card--selected {
  border-color: #667eea;
  background: #f0f4ff;
}

.app-card--loading {
  pointer-events: none;
  opacity: 0.8;
}

/* Card Sections */
.app-card__header {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.app-card__title-section {
  flex: 1;
}

.app-card__title {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.5rem;
}

.app-card__subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.25rem;
}

.app-card__actions {
  display: flex;
  gap: 0.5rem;
  margin-left: 1rem;
}

.app-card__media {
  position: relative;
  overflow: hidden;
  background: #f9fafb;
}

.app-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.app-card__content {
  padding: 1rem;
  flex: 1;
}

.app-card__description {
  margin: 0;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5rem;
}

.app-card__footer {
  padding: 1rem;
  border-top: 1px solid #f3f4f6;
  background: #fafbfc;
}

.app-card__footer-content {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Loading State */
.app-card__loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
  z-index: 10;
}

.app-card__loading-spinner {
  width: 2rem;
  height: 2rem;
}

.app-card__loading-spinner-circle {
  width: 100%;
  height: 100%;
  border: 2px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: card-loading-spin 1s linear infinite;
}

@keyframes card-loading-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Selected State */
.app-card__selected-indicator {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 1.25rem;
  height: 1.25rem;
  background: #667eea;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.app-card__selected-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: white;
}

/* Sizes */
.app-card--sm .app-card__header {
  padding: 0.75rem;
}

.app-card--sm .app-card__title {
  font-size: 1rem;
  line-height: 1.25rem;
}

.app-card--sm .app-card__subtitle {
  font-size: 0.75rem;
  line-height: 1rem;
}

.app-card--sm .app-card__content {
  padding: 0.75rem;
}

.app-card--sm .app-card__description {
  font-size: 0.75rem;
  line-height: 1.25rem;
}

.app-card--sm .app-card__footer {
  padding: 0.75rem;
}

.app-card--lg .app-card__header {
  padding: 1.25rem;
}

.app-card--lg .app-card__title {
  font-size: 1.25rem;
  line-height: 1.75rem;
}

.app-card--lg .app-card__subtitle {
  font-size: 1rem;
  line-height: 1.5rem;
}

.app-card--lg .app-card__content {
  padding: 1.25rem;
}

.app-card--lg .app-card__description {
  font-size: 1rem;
  line-height: 1.75rem;
}

.app-card--lg .app-card__footer {
  padding: 1.25rem;
}

/* Hover Effects */
.app-card--hoverable.app-card--elevated:hover {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23);
}

.app-card--hoverable.app-card--outlined:hover {
  border-color: #764ba2;
  background: white;
}

/* Responsive */
@media (max-width: 768px) {
  .app-card {
    border-radius: 0.375rem;
  }

  .app-card__header {
    padding: 0.75rem;
  }

  .app-card__title {
    font-size: 1rem;
    line-height: 1.25rem;
  }

  .app-card__subtitle {
    font-size: 0.75rem;
    line-height: 1rem;
  }

  .app-card__content {
    padding: 0.75rem;
  }

  .app-card__description {
    font-size: 0.813rem;
    line-height: 1.25rem;
  }

  .app-card__footer {
    padding: 0.75rem;
  }

  .app-card__actions {
    margin-left: 0.75rem;
  }

  .app-card__selected-indicator {
    width: 1rem;
    height: 1rem;
    top: 0.5rem;
    right: 0.5rem;
  }

  .app-card__selected-icon {
    width: 0.75rem;
    height: 0.75rem;
  }
}
</style>