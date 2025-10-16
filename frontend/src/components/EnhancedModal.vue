<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
      <div class="flex flex-col items-center">
        <!-- 加载动画 -->
        <div v-if="type === 'loading'" class="animate-spin mb-4">
          <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke-width="4" stroke="currentColor" stroke-dasharray="30 30" stroke-dashoffset="0" stroke-linecap="round" />
          </svg>
        </div>
        
        <!-- 成功图标 -->
        <div v-else-if="type === 'success'" class="mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <!-- 错误图标 -->
        <div v-else-if="type === 'error'" class="mb-4">
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <!-- 信息图标 -->
        <div v-else-if="type === 'info'" class="mb-4">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <!-- 标题 -->
        <h3 v-if="title" class="text-lg font-semibold text-gray-900 mb-2 text-center">
          {{ title }}
        </h3>
        
        <!-- 消息 -->
        <p v-if="message" class="text-gray-600 text-center mb-4">
          {{ message }}
        </p>
        
        <!-- 操作按钮 -->
        <div v-if="showAction" class="flex gap-2">
          <button
            v-if="confirmText"
            @click="$emit('confirm')"
            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {{ confirmText }}
          </button>
          <button
            v-if="cancelText"
            @click="$emit('cancel')"
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {{ cancelText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  type: 'loading' | 'success' | 'error' | 'info' | 'confirm';
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  showAction?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showAction: false,
  confirmText: '确认',
  cancelText: '取消'
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
  close: [];
}>();

// 自动关闭定时器
const autoCloseTimer = ref<NodeJS.Timeout | null>(null);

onMounted(() => {
  // 对于成功、错误、信息类型的模态框，自动关闭
  if (['success', 'error', 'info'].includes(props.type)) {
    autoCloseTimer.value = setTimeout(() => {
      emit('close');
    }, 3000);
  }
});

onUnmounted(() => {
  if (autoCloseTimer.value) {
    clearTimeout(autoCloseTimer.value);
  }
});
</script>