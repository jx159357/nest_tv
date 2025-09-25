<template>
  <div class="app-input-wrapper" :class="[`app-input-wrapper--${size}`, className]">
    <label
      v-if="label"
      :for="inputId"
      class="app-input-label"
      :class="{ 'app-input-label--required': required, 'app-input-label--disabled': disabled }"
    >
      {{ label }}
      <span v-if="required" class="app-input-label__required">*</span>
    </label>
    
    <div class="app-input-container" :class="{ 'app-input-container--focused': isFocused, 'app-input-container--error': error, 'app-input-container--disabled': disabled }">
      <div v-if="$slots.prefix" class="app-input__prefix">
        <slot name="prefix"></slot>
      </div>
      
      <input
        :id="inputId"
        ref="inputRef"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        :class="['app-input', { 'app-input--with-prefix': $slots.prefix, 'app-input--with-suffix': $slots.suffix }]"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keyup="handleKeyup"
        @keydown="handleKeydown"
      />
      
      <div v-if="$slots.suffix" class="app-input__suffix">
        <slot name="suffix"></slot>
      </div>
      
      <div v-if="clearable && modelValue && !disabled && !readonly" class="app-input__clear" @click="handleClear">
        <svg class="app-input__clear-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    </div>
    
    <div v-if="error" class="app-input-error">
      {{ error }}
    </div>
    
    <div v-if="helperText && !error" class="app-input-helper">
      {{ helperText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, type Input, useSlots } from 'vue'

interface Props {
  modelValue?: string | number
  type?: 'text' | 'password' | 'email' | 'tel' | 'url' | 'number'
  label?: string
  placeholder?: string
  error?: string
  helperText?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  clearable?: boolean
  size?: 'sm' | 'md' | 'lg'
  autocomplete?: string
  className?: string
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  error: '',
  helperText: '',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
  size: 'md',
  autocomplete: 'off',
  className: '',
  id: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  input: [event: Event]
  keyup: [event: KeyboardEvent]
  keydown: [event: KeyboardEvent]
  clear: []
}>()

const slots = useSlots()

const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)

// 生成唯一ID
const inputId = computed(() => props.id || `app-input-${Math.random().toString(36).substr(2, 9)}`)

// 处理输入
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value

  // 如果是数字类型，转换为数字
  if (props.type === 'number') {
    value = value === '' ? '' : Number(value)
  }

  emit('update:modelValue', value)
  emit('input', event)
}

// 处理焦点
const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
}

// 处理键盘事件
const handleKeyup = (event: KeyboardEvent) => {
  emit('keyup', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
}

// 清空输入
const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
  
  // 重新聚焦到输入框
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 暴露方法给父组件
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  select: () => inputRef.value?.select(),
})
</script>

<style scoped>
.app-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.app-input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.375rem;
  transition: color 0.2s ease-in-out;
}

.app-input-label--required {
  color: #ef4444;
}

.app-input-label--disabled {
  color: #9ca3af;
}

.app-input-label__required {
  color: #ef4444;
  margin-left: 0.25rem;
}

.app-input-container {
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  transition: all 0.2s ease-in-out;
}

.app-input-container--focused {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.app-input-container--error {
  border-color: #ef4444;
}

.app-input-container--error.app-input-container--focused {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.app-input-container--disabled {
  background: #f3f4f6;
  border-color: #e5e7eb;
  opacity: 0.6;
}

.app-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: none;
  outline: none;
  background: transparent;
  color: #111827;
  font-size: 0.875rem;
  line-height: 1.25rem;
  transition: all 0.2s ease-in-out;
}

.app-input::placeholder {
  color: #9ca3af;
}

.app-input:focus {
  outline: none;
}

.app-input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.app-input:read-only {
  cursor: default;
  color: #6b7280;
}

.app-input--with-prefix {
  padding-left: 2.5rem;
}

.app-input--with-suffix {
  padding-right: 2.5rem;
}

.app-input__prefix,
.app-input__suffix {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 1rem;
  pointer-events: none;
}

.app-input__prefix {
  left: 0.75rem;
}

.app-input__suffix {
  right: 0.75rem;
}

.app-input__clear {
  position: absolute;
  right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  color: #9ca3af;
  border-radius: 50%;
  transition: all 0.2s ease-in-out;
}

.app-input__clear:hover {
  color: #6b7280;
  background: rgba(107, 114, 128, 0.1);
}

.app-input__clear-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.app-input--with-suffix ~ .app-input__clear {
  right: 2.5rem;
}

.app-input-error {
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 0.25rem;
}

.app-input-helper {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Sizes */
.app-input-wrapper--sm .app-input-label {
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.app-input-wrapper--sm .app-input-container {
  border-radius: 0.25rem;
}

.app-input-wrapper--sm .app-input {
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
}

.app-input-wrapper--sm .app-input__prefix,
.app-input-wrapper--sm .app-input__suffix {
  font-size: 0.875rem;
}

.app-input-wrapper--sm .app-input__prefix {
  left: 0.5rem;
}

.app-input-wrapper--sm .app-input__suffix {
  right: 0.5rem;
}

.app-input-wrapper--sm .app-input--with-prefix {
  padding-left: 1.75rem;
}

.app-input-wrapper--sm .app-input--with-suffix {
  padding-right: 1.75rem;
}

.app-input-wrapper--lg .app-input-label {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.app-input-wrapper--lg .app-input-container {
  border-radius: 0.5rem;
}

.app-input-wrapper--lg .app-input {
  padding: 0.625rem 1rem;
  font-size: 1rem;
  line-height: 1.5rem;
}

.app-input-wrapper--lg .app-input__prefix,
.app-input-wrapper--lg .app-input__suffix {
  font-size: 1.125rem;
}

.app-input-wrapper--lg .app-input__prefix {
  left: 1rem;
}

.app-input-wrapper--lg .app-input__suffix {
  right: 1rem;
}

.app-input-wrapper--lg .app-input--with-prefix {
  padding-left: 3rem;
}

.app-input-wrapper--lg .app-input--with-suffix {
  padding-right: 3rem;
}

/* Responsive */
@media (max-width: 768px) {
  .app-input-wrapper {
    gap: 0.125rem;
  }
  
  .app-input-label {
    font-size: 0.813rem;
    margin-bottom: 0.25rem;
  }
  
  .app-input {
    padding: 0.375rem 0.5rem;
    font-size: 0.813rem;
  }
  
  .app-input__prefix,
  .app-input__suffix {
    font-size: 0.875rem;
  }
  
  .app-input__prefix {
    left: 0.5rem;
  }
  
  .app-input__suffix {
    right: 0.5rem;
  }
  
  .app-input--with-prefix {
    padding-left: 1.75rem;
  }
  
  .app-input--with-suffix {
    padding-right: 1.75rem;
  }
}
</style>