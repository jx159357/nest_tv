<template>
  <div
    class="rounded-xl border px-4 py-3 text-sm"
    :class="noticeClass"
    role="status"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <div v-if="title" class="font-semibold">{{ title }}</div>
        <div>{{ message }}</div>
      </div>
      <button
        v-if="dismissible"
        type="button"
        class="text-current/70 transition hover:text-current"
        aria-label="关闭提示"
        @click="$emit('dismiss')"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  interface Props {
    type?: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    message: string;
    dismissible?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    type: 'info',
    title: '',
    dismissible: false,
  });

  defineEmits<{
    dismiss: [];
  }>();

  const noticeClass = computed(() => {
    switch (props.type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-600';
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-700';
    }
  });
</script>
