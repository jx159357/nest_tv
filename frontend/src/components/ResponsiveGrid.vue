<template>
  <div class="responsive-grid" :class="gridClasses">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  cols?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  equalHeight?: boolean
  autoFit?: boolean
  minItemWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  cols: () => ({
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 4,
    '2xl': 4
  }),
  gap: () => ({
    xs: 4,
    sm: 4,
    md: 6,
    lg: 6,
    xl: 6,
    '2xl': 6
  }),
  equalHeight: false,
  autoFit: false,
  minItemWidth: 280
})

const gridClasses = computed(() => {
  const classes = []
  
  // 基础网格类
  if (props.autoFit) {
    classes.push('grid-auto-fit')
  } else {
    // 响应式列数
    if (props.cols.xs) classes.push(`grid-cols-xs-${props.cols.xs}`)
    if (props.cols.sm) classes.push(`sm:grid-cols-sm-${props.cols.sm}`)
    if (props.cols.md) classes.push(`md:grid-cols-md-${props.cols.md}`)
    if (props.cols.lg) classes.push(`lg:grid-cols-lg-${props.cols.lg}`)
    if (props.cols.xl) classes.push(`xl:grid-cols-xl-${props.cols.xl}`)
    if (props.cols['2xl']) classes.push(`2xl:grid-cols-2xl-${props.cols['2xl']}`)
  }
  
  // 响应式间距
  if (props.gap.xs) classes.push(`gap-xs-${props.gap.xs}`)
  if (props.gap.sm) classes.push(`sm:gap-sm-${props.gap.sm}`)
  if (props.gap.md) classes.push(`md:gap-md-${props.gap.md}`)
  if (props.gap.lg) classes.push(`lg:gap-lg-${props.gap.lg}`)
  if (props.gap.xl) classes.push(`xl:gap-xl-${props.gap.xl}`)
  if (props.gap['2xl']) classes.push(`2xl:gap-2xl-${props.gap['2xl']}`)
  
  // 等高
  if (props.equalHeight) {
    classes.push('grid-equal-height')
  }
  
  return classes
})

// 动态样式
const style = computed(() => {
  if (!props.autoFit) return {}
  
  return {
    '--min-item-width': `${props.minItemWidth}px`
  }
})
</script>

<style scoped>
/* 基础网格样式 */
.responsive-grid {
  @apply grid;
}

/* 自动适应网格 */
.grid-auto-fit {
  grid-template-columns: repeat(auto-fit, minmax(var(--min-item-width, 280px), 1fr));
}

/* 响应式列数 - 移动端 */
.grid-cols-xs-1 { @apply grid-cols-1; }
.grid-cols-xs-2 { @apply grid-cols-2; }
.grid-cols-xs-3 { @apply grid-cols-3; }
.grid-cols-xs-4 { @apply grid-cols-4; }

/* 响应式列数 - 平板端 */
.sm\:grid-cols-sm-1 { @apply sm:grid-cols-1; }
.sm\:grid-cols-sm-2 { @apply sm:grid-cols-2; }
.sm\:grid-cols-sm-3 { @apply sm:grid-cols-3; }
.sm\:grid-cols-sm-4 { @apply sm:grid-cols-4; }
.sm\:grid-cols-sm-5 { @apply sm:grid-cols-5; }
.sm\:grid-cols-sm-6 { @apply sm:grid-cols-6; }

/* 响应式列数 - 桌面端 */
.md\:grid-cols-md-1 { @apply md:grid-cols-1; }
.md\:grid-cols-md-2 { @apply md:grid-cols-2; }
.md\:grid-cols-md-3 { @apply md:grid-cols-3; }
.md\:grid-cols-md-4 { @apply md:grid-cols-4; }
.md\:grid-cols-md-5 { @apply md:grid-cols-5; }
.md\:grid-cols-md-6 { @apply md:grid-cols-6; }

/* 响应式列数 - 大桌面 */
.lg\:grid-cols-lg-1 { @apply lg:grid-cols-1; }
.lg\:grid-cols-lg-2 { @apply lg:grid-cols-2; }
.lg\:grid-cols-lg-3 { @apply lg:grid-cols-3; }
.lg\:grid-cols-lg-4 { @apply lg:grid-cols-4; }
.lg\:grid-cols-lg-5 { @apply lg:grid-cols-5; }
.lg\:grid-cols-lg-6 { @apply lg:grid-cols-6; }
.lg\:grid-cols-lg-7 { @apply lg:grid-cols-7; }
.lg\:grid-cols-lg-8 { @apply lg:grid-cols-8; }

/* 响应式列数 - 超大屏幕 */
.xl\:grid-cols-xl-1 { @apply xl:grid-cols-1; }
.xl\:grid-cols-xl-2 { @apply xl:grid-cols-2; }
.xl\:grid-cols-xl-3 { @apply xl:grid-cols-3; }
.xl\:grid-cols-xl-4 { @apply xl:grid-cols-4; }
.xl\:grid-cols-xl-5 { @apply xl:grid-cols-5; }
.xl\:grid-cols-xl-6 { @apply xl:grid-cols-6; }
.xl\:grid-cols-xl-7 { @apply xl:grid-cols-7; }
.xl\:grid-cols-xl-8 { @apply xl:grid-cols-8; }

/* 响应式列数 - 2K屏幕 */
.\32xl\:grid-cols-2xl-1 { @apply 2xl:grid-cols-1; }
.\32xl\:grid-cols-2xl-2 { @apply 2xl:grid-cols-2; }
.\32xl\:grid-cols-2xl-3 { @apply 2xl:grid-cols-3; }
.\32xl\:grid-cols-2xl-4 { @apply 2xl:grid-cols-4; }
.\32xl\:grid-cols-2xl-5 { @apply 2xl:grid-cols-5; }
.\32xl\:grid-cols-2xl-6 { @apply 2xl:grid-cols-6; }
.\32xl\:grid-cols-2xl-7 { @apply 2xl:grid-cols-7; }
.\32xl\:grid-cols-2xl-8 { @apply 2xl:grid-cols-8; }
.\32xl\:grid-cols-2xl-9 { @apply 2xl:grid-cols-9; }
.\32xl\:grid-cols-2xl-10 { @apply 2xl:grid-cols-10; }
.\32xl\:grid-cols-2xl-11 { @apply 2xl:grid-cols-11; }
.\32xl\:grid-cols-2xl-12 { @apply 2xl:grid-cols-12; }

/* 响应式间距 */
.gap-xs-1 { @apply gap-1; }
.gap-xs-2 { @apply gap-2; }
.gap-xs-3 { @apply gap-3; }
.gap-xs-4 { @apply gap-4; }
.gap-xs-6 { @apply gap-6; }
.gap-xs-8 { @apply gap-8; }

.sm\:gap-sm-1 { @apply sm:gap-1; }
.sm\:gap-sm-2 { @apply sm:gap-2; }
.sm\:gap-sm-3 { @apply sm:gap-3; }
.sm\:gap-sm-4 { @apply sm:gap-4; }
.sm\:gap-sm-6 { @apply sm:gap-6; }
.sm\:gap-sm-8 { @apply sm:gap-8; }

.md\:gap-md-1 { @apply md:gap-1; }
.md\:gap-md-2 { @apply md:gap-2; }
.md\:gap-md-3 { @apply md:gap-3; }
.md\:gap-md-4 { @apply md:gap-4; }
.md\:gap-md-6 { @apply md:gap-6; }
.md\:gap-md-8 { @apply md:gap-8; }

.lg\:gap-lg-1 { @apply lg:gap-1; }
.lg\:gap-lg-2 { @apply lg:gap-2; }
.lg\:gap-lg-3 { @apply lg:gap-3; }
.lg\:gap-lg-4 { @apply lg:gap-4; }
.lg\:gap-lg-6 { @apply lg:gap-6; }
.lg\:gap-lg-8 { @apply lg:gap-8; }

.xl\:gap-xl-1 { @apply xl:gap-1; }
.xl\:gap-xl-2 { @apply xl:gap-2; }
.xl\:gap-xl-3 { @apply xl:gap-3; }
.xl\:gap-xl-4 { @apply xl:gap-4; }
.xl\:gap-xl-6 { @apply xl:gap-6; }
.xl\:gap-xl-8 { @apply xl:gap-8; }

.\32xl\:gap-2xl-1 { @apply 2xl:gap-1; }
.\32xl\:gap-2xl-2 { @apply 2xl:gap-2; }
.\32xl\:gap-2xl-3 { @apply 2xl:gap-3; }
.\32xl\:gap-2xl-4 { @apply 2xl:gap-4; }
.\32xl\:gap-2xl-6 { @apply 2xl:gap-6; }
.\32xl\:gap-2xl-8 { @apply 2xl:gap-8; }

/* 等高网格 */
.grid-equal-height {
  grid-auto-rows: 1fr;
}

/* 网格项基础样式 */
:deep(.grid-item) {
  @apply w-full;
}

/* 响应式隐藏/显示 */
@media (max-width: 639px) {
  .hide-mobile { @apply hidden; }
  .show-mobile-only { @apply block; }
}

@media (min-width: 640px) and (max-width: 767px) {
  .hide-tablet { @apply hidden; }
  .show-tablet-only { @apply block; }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .hide-desktop { @apply hidden; }
  .show-desktop-only { @apply block; }
}

@media (min-width: 1024px) {
  .hide-desktop-large { @apply hidden; }
  .show-desktop-large-only { @apply block; }
}

@media (min-width: 1280px) {
  .hide-desktop-xl { @apply hidden; }
  .show-desktop-xl-only { @apply block; }
}

@media (min-width: 1536px) {
  .hide-desktop-2xl { @apply hidden; }
  .show-desktop-2xl-only { @apply block; }
}
</style>