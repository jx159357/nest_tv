<template>
  <div class="form-field" :class="fieldClasses">
    <!-- 标签 -->
    <label
      v-if="label"
      :for="inputId"
      class="form-field__label"
      :class="{ 'form-field__label--required': required }"
    >
      {{ label }}
    </label>

    <!-- 输入框容器 -->
    <div class="form-field__input-wrapper">
      <!-- 前缀图标 -->
      <div v-if="$slots.prefix || prefixIcon" class="form-field__prefix">
        <slot name="prefix">
          <svg v-if="prefixIcon" class="form-field__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="prefixIcon" />
          </svg>
        </slot>
      </div>

      <!-- 输入框 -->
      <input
        :id="inputId"
        ref="inputRef"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :autocomplete="autocomplete"
        class="form-field__input"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <!-- 后缀图标 -->
      <div v-if="$slots.suffix || suffixIcon" class="form-field__suffix">
        <slot name="suffix">
          <svg v-if="suffixIcon" class="form-field__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="suffixIcon" />
          </svg>
        </slot>
      </div>

      <!-- 清除按钮 -->
      <button
        v-if="clearable && modelValue"
        class="form-field__clear"
        type="button"
        aria-label="清除"
        @click="handleClear"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- 帮助文本或错误信息 -->
    <div v-if="errorMessage || helpText" class="form-field__message">
      <p v-if="errorMessage" class="form-field__error">
        <svg class="form-field__error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {{ errorMessage }}
      </p>
      <p v-else-if="helpText" class="form-field__help">{{ helpText }}</p>
    </div>

    <!-- 字数统计 -->
    <div v-if="maxlength && showCount" class="form-field__count">
      {{ modelValue?.length || 0 }}/{{ maxlength }}
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';

  interface Props {
    modelValue?: string;
    type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search';
    label?: string;
    placeholder?: string;
    helpText?: string;
    errorMessage?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    clearable?: boolean;
    showCount?: boolean;
    maxlength?: number;
    autocomplete?: string;
    prefixIcon?: string;
    suffixIcon?: string;
    size?: 'small' | 'medium' | 'large';
  }

  const props = withDefaults(defineProps<Props>(), {
    type: 'text',
    size: 'medium',
    clearable: false,
    showCount: false,
    disabled: false,
    readonly: false,
    required: false,
  });

  const emit = defineEmits<{
    'update:modelValue': [value: string];
    blur: [event: FocusEvent];
    focus: [event: FocusEvent];
    clear: [];
  }>();

  const inputRef = ref<HTMLInputElement | null>(null);
  const isFocused = ref(false);

  const inputId = computed(() => `form-field-${Math.random().toString(36).substr(2, 9)}`);

  const fieldClasses = computed(() => [
    `form-field--${props.size}`,
    {
      'form-field--disabled': props.disabled,
      'form-field--readonly': props.readonly,
      'form-field--error': props.errorMessage,
      'form-field--focused': isFocused.value,
    },
  ]);

  const inputClasses = computed(() => [
    `form-field__input--${props.size}`,
    {
      'form-field__input--error': props.errorMessage,
      'form-field__input--disabled': props.disabled,
      'form-field__input--readonly': props.readonly,
    },
  ]);

  const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    emit('update:modelValue', target.value);
  };

  const handleBlur = (event: FocusEvent) => {
    isFocused.value = false;
    emit('blur', event);
  };

  const handleFocus = (event: FocusEvent) => {
    isFocused.value = true;
    emit('focus', event);
  };

  const handleClear = () => {
    emit('update:modelValue', '');
    emit('clear');
    inputRef.value?.focus();
  };
</script>

<style scoped>
  .form-field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .form-field__label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
  }

  .form-field__label--required::after {
    content: ' *';
    color: var(--color-error);
  }

  .form-field__input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .form-field__prefix,
  .form-field__suffix {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    pointer-events: none;
  }

  .form-field__prefix {
    left: var(--spacing-3);
  }

  .form-field__suffix {
    right: var(--spacing-3);
  }

  .form-field__icon {
    width: 1rem;
    height: 1rem;
  }

  .form-field__input {
    width: 100%;
    background: var(--bg-primary);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    transition: all var(--transition-fast);
    outline: none;
  }

  .form-field__input::placeholder {
    color: var(--text-muted);
  }

  .form-field__input:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .form-field__input--error {
    border-color: var(--border-error);
  }

  .form-field__input--error:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .form-field__input--disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--bg-secondary);
  }

  .form-field__input--readonly {
    background: var(--bg-secondary);
    cursor: default;
  }

  /* 尺寸变体 */
  .form-field__input--small {
    padding: var(--spacing-2) var(--spacing-3);
    font-size: var(--font-size-xs);
  }

  .form-field__input--medium {
    padding: var(--spacing-3) var(--spacing-4);
  }

  .form-field__input--large {
    padding: var(--spacing-4) var(--spacing-5);
    font-size: var(--font-size-base);
  }

  .form-field--small .form-field__prefix {
    left: var(--spacing-2);
  }

  .form-field--small .form-field__suffix {
    right: var(--spacing-2);
  }

  .form-field--large .form-field__prefix {
    left: var(--spacing-4);
  }

  .form-field--large .form-field__suffix {
    right: var(--spacing-4);
  }

  .form-field__input--small.has-prefix {
    padding-left: var(--spacing-8);
  }

  .form-field__input--medium.has-prefix {
    padding-left: var(--spacing-10);
  }

  .form-field__input--large.has-prefix {
    padding-left: var(--spacing-12);
  }

  /* 清除按钮 */
  .form-field__clear {
    position: absolute;
    right: var(--spacing-2);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    background: var(--bg-secondary);
    border: none;
    border-radius: var(--radius-full);
    color: var(--text-muted);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .form-field__clear:hover {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
  }

  .form-field__clear svg {
    width: 0.75rem;
    height: 0.75rem;
  }

  /* 消息 */
  .form-field__message {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-1);
  }

  .form-field__error {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    font-size: var(--font-size-xs);
    color: var(--color-error);
  }

  .form-field__error-icon {
    width: 0.875rem;
    height: 0.875rem;
    flex-shrink: 0;
  }

  .form-field__help {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
  }

  /* 字数统计 */
  .form-field__count {
    font-size: var(--font-size-xs);
    color: var(--text-muted);
    text-align: right;
  }

  /* 暗色模式 */
  [data-theme="dark"] .form-field__input,
  .dark .form-field__input {
    background: var(--bg-primary);
    border-color: var(--border-primary);
    color: var(--text-primary);
  }

  [data-theme="dark"] .form-field__input:focus,
  .dark .form-field__input:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  }

  [data-theme="dark"] .form-field__label,
  .dark .form-field__label {
    color: var(--text-primary);
  }
</style>
