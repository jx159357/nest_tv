<template>
  <button
    :class="[
      'app-button',
      `app-button--${variant}`,
      `app-button--${size}`,
      `app-button--${block ? 'block' : 'inline'}`,
      disabled ? 'app-button--disabled' : '',
      loading ? 'app-button--loading' : '',
      className,
    ]"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
  >
    <span v-if="loading" class="app-button__spinner">
      <span class="app-button__spinner-dot"></span>
      <span class="app-button__spinner-dot"></span>
      <span class="app-button__spinner-dot"></span>
    </span>
    <slot v-else>
      <span v-if="icon" class="app-button__icon" :class="`app-button__icon--${iconPosition}`">
        {{ icon }}
      </span>
      <span class="app-button__content">
        <slot></slot>
      </span>
    </slot>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'text'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  block?: boolean
  icon?: string
  iconPosition?: 'left' | 'right'
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  block: false,
  icon: '',
  iconPosition: 'left',
  className: '',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.app-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.5rem;
  text-align: center;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease-in-out;
  white-space: nowrap;
  outline: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.app-button:hover:not(.app-button--disabled):not(.app-button--loading) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.app-button:active:not(.app-button--disabled):not(.app-button--loading) {
  transform: translateY(0);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.app-button--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.app-button--loading {
  cursor: not-allowed;
  opacity: 0.8;
}

/* Variants */
.app-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.app-button--primary:hover:not(.app-button--disabled):not(.app-button--loading) {
  background: linear-gradient(135deg, #5a67d8 0%, #6b4b90 100%);
}

.app-button--secondary {
  background: #f3f4f6;
  color: #374151;
  border-color: #e5e7eb;
}

.app-button--secondary:hover:not(.app-button--disabled):not(.app-button--loading) {
  background: #e5e7eb;
}

.app-button--success {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.app-button--success:hover:not(.app-button--disabled):not(.app-button--loading) {
  background: #059669;
}

.app-button--danger {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.app-button--danger:hover:not(.app-button--disabled):not(.app-button--loading) {
  background: #dc2626;
}

.app-button--warning {
  background: #f59e0b;
  color: white;
  border-color: #f59e0b;
}

.app-button--warning:hover:not(.app-button--disabled):not(.app-button--loading) {
  background: #d97706;
}

.app-button--ghost {
  background: transparent;
  color: #374151;
  border-color: #d1d5db;
}

.app-button--ghost:hover:not(.app-button--disabled):not(.app-button--loading) {
  background: #f9fafb;
}

.app-button--text {
  background: transparent;
  color: #667eea;
  border-color: transparent;
  box-shadow: none;
  padding: 0.25rem 0.5rem;
}

.app-button--text:hover:not(.app-button--disabled):not(.app-button--loading) {
  background: transparent;
  color: #5a67d8;
}

/* Sizes */
.app-button--xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
  border-radius: 0.25rem;
}

.app-button--sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.813rem;
  line-height: 1.25rem;
  border-radius: 0.25rem;
}

.app-button--md {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  line-height: 1.5rem;
  border-radius: 0.375rem;
}

.app-button--lg {
  padding: 0.625rem 1.25rem;
  font-size: 1rem;
  line-height: 1.75rem;
  border-radius: 0.5rem;
}

.app-button--xl {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
  line-height: 2rem;
  border-radius: 0.5rem;
}

/* Block */
.app-button--block {
  display: flex;
  width: 100%;
}

/* Icon */
.app-button__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-button__icon--left {
  order: 1;
}

.app-button__icon--right {
  order: 3;
}

.app-button__content {
  order: 2;
}

/* Loading spinner */
.app-button__spinner {
  display: flex;
  gap: 0.25rem;
}

.app-button__spinner-dot {
  width: 4px;
  height: 4px;
  background: currentColor;
  border-radius: 50%;
  animation: spinner-dot-pulse 1.4s infinite ease-in-out both;
}

.app-button__spinner-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.app-button__spinner-dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes spinner-dot-pulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .app-button {
    padding: 0.375rem 0.75rem;
    font-size: 0.813rem;
  }
  
  .app-button--lg {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
  
  .app-button--xl {
    padding: 0.625rem 1.125rem;
    font-size: 1rem;
  }
}
</style>