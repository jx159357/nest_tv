<template>
  <div 
    :class="[
      'w-full',
      mobileClass,
      tabletClass,
      desktopClass
    ]"
    :style="containerStyle"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getDeviceType, onResize } from '@/utils/responsive'

const props = defineProps({
  mobileClass: {
    type: String,
    default: ''
  },
  tabletClass: {
    type: String,
    default: ''
  },
  desktopClass: {
    type: String,
    default: ''
  },
  maxWidth: {
    type: [String, Number],
    default: '100%'
  }
})

const deviceType = ref(getDeviceType())

const containerStyle = computed(() => ({
  maxWidth: typeof props.maxWidth === 'number' ? `${props.maxWidth}px` : props.maxWidth
}))

const cleanup = onResize(() => {
  deviceType.value = getDeviceType()
})

onUnmounted(() => {
  if (cleanup) cleanup()
})
</script>