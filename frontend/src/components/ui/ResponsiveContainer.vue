<template>
  <div class="responsive-container" :class="containerClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  fluid?: boolean;
  padding?: boolean;
  center?: boolean;
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'lg',
  fluid: false,
  padding: true,
  center: true,
  className: '',
});

const containerClasses = computed(() => {
  const classes = ['responsive-container'];

  // 尺寸类
  if (!props.fluid) {
    switch (props.size) {
      case 'sm':
        classes.push('container-sm');
        break;
      case 'md':
        classes.push('container-md');
        break;
      case 'lg':
        classes.push('container-lg');
        break;
      case 'xl':
        classes.push('container-xl');
        break;
      case 'full':
        classes.push('container-full');
        break;
      default:
        classes.push('container-lg');
    }
  } else {
    classes.push('container-fluid');
  }

  // 内边距
  if (props.padding) {
    classes.push('container-padding');
  }

  // 居中
  if (props.center) {
    classes.push('container-center');
  }

  // 自定义类
  if (props.className) {
    classes.push(props.className);
  }

  return classes;
});
</script>

<style scoped>
/* 响应式容器样式 */
.responsive-container {
  width: 100%;
  margin: 0 auto;
}

/* 固定宽度容器 */
.container-sm {
  max-width: 640px;
}

.container-md {
  max-width: 768px;
}

.container-lg {
  max-width: 1024px;
}

.container-xl {
  max-width: 1280px;
}

.container-full {
  max-width: 100%;
}

/* 流式容器 */
.container-fluid {
  max-width: none;
  padding-left: 16px;
  padding-right: 16px;
}

/* 内边距 */
.container-padding {
  padding-left: 16px;
  padding-right: 16px;
}

/* 居中 */
.container-center {
  margin-left: auto;
  margin-right: auto;
}

/* 响应式内边距 */
@media (max-width: 640px) {
  .container-padding {
    padding-left: 12px;
    padding-right: 12px;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .container-padding {
    padding-left: 20px;
    padding-right: 20px;
  }
}

@media (min-width: 1025px) {
  .container-padding {
    padding-left: 24px;
    padding-right: 24px;
  }
}
</style>