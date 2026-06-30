# NestTV 全面优化 UI/UX 设计文档

## 一、设计系统

### 1.1 设计原则

1. **简洁直观**：界面简洁，操作直观，减少用户认知负担
2. **一致性**：统一的视觉语言和交互模式
3. **响应式**：适配各种屏幕尺寸，提供一致体验
4. **可访问性**：支持键盘导航、屏幕阅读器、高对比度
5. **性能优先**：动画流畅，加载快速，响应及时

### 1.2 视觉方向

**设计风格**：现代简约 + 影视氛围感
- 深色主题为主，浅色主题为辅
- 圆角卡片设计，增强层次感
- 渐变色点缀，营造影视氛围
- 微交互动画，提升用户体验

**避免的设计模式**：
- 紫/粉渐变主视觉（AI感过强）
- Emoji作为功能图标
- 默认系统字体直出
- Claude/ChatGPT式聊天壳层

### 1.3 图标库选择

**主要图标库**：Lucide Icons
- 开源免费，MIT协议
- 风格统一，线条简洁
- 支持Vue 3组件
- 覆盖常用场景

**图标使用规范**：
```vue
<template>
  <!-- 功能图标 -->
  <Play :size="24" />
  <Search :size="20" />
  <Heart :size="18" />
  
  <!-- 状态图标 -->
  <CheckCircle :size="16" class="text-success" />
  <AlertCircle :size="16" class="text-warning" />
  <XCircle :size="16" class="text-error" />
</template>

<script setup lang="ts">
import { Play, Search, Heart, CheckCircle, AlertCircle, XCircle } from 'lucide-vue-next'
</script>
```

---

## 二、设计令牌（Design Tokens）

### 2.1 颜色系统

```css
:root {
  /* 主色调 */
  --color-primary: #3B82F6;        /* 蓝色 - 主要操作 */
  --color-primary-hover: #2563EB;  /* 蓝色 - 悬停状态 */
  --color-primary-active: #1D4ED8; /* 蓝色 - 激活状态 */
  --color-primary-light: #93C5FD;  /* 蓝色 - 浅色 */
  
  /* 辅助色 */
  --color-secondary: #6B7280;      /* 灰色 - 次要元素 */
  --color-secondary-hover: #4B5563;
  --color-secondary-light: #D1D5DB;
  
  /* 语义色 */
  --color-success: #10B981;        /* 成功/在线 */
  --color-warning: #F59E0B;        /* 警告/待处理 */
  --color-error: #EF4444;          /* 错误/危险 */
  --color-info: #3B82F6;           /* 信息/提示 */
  
  /* 背景色 */
  --bg-primary: #111827;           /* 主背景 - 深色 */
  --bg-secondary: #1F2937;         /* 次背景 - 卡片 */
  --bg-tertiary: #374151;          /* 三级背景 - 输入框 */
  --bg-overlay: rgba(0, 0, 0, 0.5); /* 遮罩层 */
  
  /* 文本色 */
  --text-primary: #F9FAFB;         /* 主文本 */
  --text-secondary: #D1D5DB;       /* 次要文本 */
  --text-tertiary: #9CA3AF;        /* 三级文本 */
  --text-inverse: #111827;         /* 反色文本 */
  
  /* 边框色 */
  --border-primary: #374151;       /* 主边框 */
  --border-secondary: #4B5563;     /* 次边框 */
  --border-focus: #3B82F6;         /* 聚焦边框 */
}

/* 浅色主题 */
[data-theme="light"] {
  --bg-primary: #F9FAFB;
  --bg-secondary: #FFFFFF;
  --bg-tertiary: #F3F4F6;
  --text-primary: #111827;
  --text-secondary: #4B5563;
  --text-tertiary: #9CA3AF;
  --border-primary: #E5E7EB;
  --border-secondary: #D1D5DB;
}
```

### 2.2 字体系统

```css
:root {
  /* 字体族 */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Fira Code', 'JetBrains Mono', monospace;
  
  /* 字体大小 */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  
  /* 字体粗细 */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* 行高 */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  /* 字间距 */
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
}
```

### 2.3 间距系统

```css
:root {
  /* 基础间距 */
  --spacing-1: 0.25rem;   /* 4px */
  --spacing-2: 0.5rem;    /* 8px */
  --spacing-3: 0.75rem;   /* 12px */
  --spacing-4: 1rem;      /* 16px */
  --spacing-5: 1.25rem;   /* 20px */
  --spacing-6: 1.5rem;    /* 24px */
  --spacing-8: 2rem;      /* 32px */
  --spacing-10: 2.5rem;   /* 40px */
  --spacing-12: 3rem;     /* 48px */
  --spacing-16: 4rem;     /* 64px */
  
  /* 组件间距 */
  --gap-xs: var(--spacing-1);
  --gap-sm: var(--spacing-2);
  --gap-md: var(--spacing-4);
  --gap-lg: var(--spacing-6);
  --gap-xl: var(--spacing-8);
  
  /* 内边距 */
  --padding-xs: var(--spacing-1);
  --padding-sm: var(--spacing-2);
  --padding-md: var(--spacing-3);
  --padding-lg: var(--spacing-4);
  --padding-xl: var(--spacing-6);
}
```

### 2.4 圆角系统

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px */
  --radius-xl: 0.75rem;   /* 12px */
  --radius-2xl: 1rem;     /* 16px */
  --radius-full: 9999px;  /* 全圆角 */
}
```

### 2.5 阴影系统

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}
```

### 2.6 动画系统

```css
:root {
  /* 过渡时间 */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;
  
  /* 缓动函数 */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* 动画 */
  --animation-fade-in: fadeIn var(--duration-normal) var(--ease-out);
  --animation-slide-up: slideUp var(--duration-normal) var(--ease-out);
  --animation-scale-in: scaleIn var(--duration-fast) var(--ease-out);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

---

## 三、组件设计

### 3.1 按钮组件

```vue
<template>
  <button
    :class="[
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      { 'btn-loading': loading, 'btn-disabled': disabled }
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <Loader v-if="loading" :size="iconSize" class="animate-spin" />
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
import { Loader } from 'lucide-vue-next'

interface Props {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false
})

defineEmits(['click'])

const iconSize = computed(() => {
  const sizes = { sm: 14, md: 16, lg: 18 }
  return sizes[props.size]
})
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  font-weight: var(--font-medium);
  border-radius: var(--radius-lg);
  transition: all var(--duration-normal) var(--ease-out);
  cursor: pointer;
  border: 1px solid transparent;
}

.btn:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

.btn-sm {
  padding: var(--spacing-1) var(--spacing-3);
  font-size: var(--text-sm);
}

.btn-md {
  padding: var(--spacing-2) var(--spacing-4);
  font-size: var(--text-base);
}

.btn-lg {
  padding: var(--spacing-3) var(--spacing-6);
  font-size: var(--text-lg);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-primary:active {
  background: var(--color-primary-active);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-outline {
  background: transparent;
  border-color: var(--border-primary);
  color: var(--text-primary);
}

.btn-ghost {
  background: transparent;
  color: var(--text-primary);
}

.btn-danger {
  background: var(--color-error);
  color: white;
}

.btn-loading,
.btn-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

### 3.2 卡片组件

```vue
<template>
  <div
    :class="[
      'card',
      `card-${variant}`,
      { 'card-hoverable': hoverable, 'card-compact': compact }
    ]"
    @click="$emit('click', $event)"
  >
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>
    
    <div class="card-body">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'outlined' | 'elevated'
  hoverable?: boolean
  compact?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  hoverable: false,
  compact: false
})

defineEmits(['click'])
</script>

<style scoped>
.card {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: all var(--duration-normal) var(--ease-out);
}

.card-default {
  border: 1px solid var(--border-primary);
}

.card-outlined {
  border: 2px solid var(--border-primary);
}

.card-elevated {
  box-shadow: var(--shadow-lg);
}

.card-hoverable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-xl);
}

.card-compact .card-body {
  padding: var(--spacing-3);
}

.card-header {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--border-primary);
}

.card-body {
  padding: var(--spacing-4);
}

.card-footer {
  padding: var(--spacing-4);
  border-top: 1px solid var(--border-primary);
}
</style>
```

### 3.3 输入框组件

```vue
<template>
  <div :class="['input-wrapper', { 'input-error': error, 'input-focused': focused }]">
    <label v-if="label" :for="id" class="input-label">
      {{ label }}
      <span v-if="required" class="input-required">*</span>
    </label>
    
    <div class="input-container">
      <Search v-if="icon === 'search'" :size="18" class="input-icon" />
      <Mail v-else-if="icon === 'email'" :size="18" class="input-icon" />
      <Lock v-else-if="icon === 'password'" :size="18" class="input-icon" />
      
      <input
        :id="id"
        ref="inputRef"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        class="input"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @focus="focused = true"
        @blur="focused = false"
      />
      
      <button
        v-if="clearable && modelValue"
        class="input-clear"
        @click="$emit('update:modelValue', '')"
      >
        <X :size="16} />
      </button>
    </div>
    
    <p v-if="error" class="input-error-message">{{ error }}</p>
    <p v-else-if="hint" class="input-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search, Mail, Lock, X } from 'lucide-vue-next'

interface Props {
  id?: string
  type?: string
  modelValue?: string
  label?: string
  placeholder?: string
  icon?: 'search' | 'email' | 'password'
  error?: string
  hint?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  clearable?: boolean
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false
})

defineEmits(['update:modelValue'])

const inputRef = ref<HTMLInputElement>()
const focused = ref(false)
</script>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.input-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
}

.input-required {
  color: var(--color-error);
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: var(--spacing-3);
  color: var(--text-tertiary);
  pointer-events: none;
}

.input {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: var(--text-base);
  transition: all var(--duration-normal) var(--ease-out);
}

.input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.input-clear {
  position: absolute;
  right: var(--spacing-2);
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: var(--spacing-1);
  border-radius: var(--radius-full);
}

.input-clear:hover {
  background: var(--bg-secondary);
}

.input-error-message {
  font-size: var(--text-sm);
  color: var(--color-error);
}

.input-hint {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}
</style>
```

### 3.4 骨架屏组件

```vue
<template>
  <div :class="['skeleton', `skeleton-${variant}`]" :style="style" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text'
})

const style = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}))
</script>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--bg-secondary) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-text {
  border-radius: var(--radius-md);
  height: 1em;
}

.skeleton-circular {
  border-radius: var(--radius-full);
}

.skeleton-rectangular {
  border-radius: var(--radius-none);
}

.skeleton-rounded {
  border-radius: var(--radius-xl);
}

@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
```

---

## 四、页面设计

### 4.1 首页设计

**布局结构**：
```
┌─────────────────────────────────────────────────────────────┐
│                        Header                               │
│  Logo  |  搜索框  |  分类导航  |  用户头像/登录              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    轮播推荐区域                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  继续观看 >                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │     │ │     │ │     │ │     │ │     │                  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                  │
├─────────────────────────────────────────────────────────────┤
│  为你推荐 >                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │     │ │     │ │     │ │     │ │     │                  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                  │
├─────────────────────────────────────────────────────────────┤
│  热门影视 >                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │     │ │     │ │     │ │     │ │     │                  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                  │
├─────────────────────────────────────────────────────────────┤
│  最新更新 >                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │     │ │     │ │     │ │     │ │     │                  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                  │
├─────────────────────────────────────────────────────────────┤
│                        Footer                               │
└─────────────────────────────────────────────────────────────┘
```

**交互细节**：
- 轮播支持自动播放（5秒间隔）和手动切换
- 卡片悬停显示预览信息
- "继续观看"显示进度条
- "为你推荐"显示推荐理由
- 移动端底部显示Tab导航栏

### 4.2 详情页设计

**布局结构**：
```
┌─────────────────────────────────────────────────────────────┐
│                        Header                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   海报/背景图                        │   │
│  │  ┌─────────┐                                        │   │
│  │  │  海报   │  标题                                  │   │
│  │  │         │  评分 | 年份 | 类型                     │   │
│  │  │         │  导演 | 演员                            │   │
│  │  │         │  简介                                   │   │
│  │  └─────────┘                                        │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  立即播放  |  收藏  |  分享                   │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  播放源选择                                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                          │
│  │源1  │ │源2  │ │源3  │ │源4  │                          │
│  └─────┘ └─────┘ └─────┘ └─────┘                          │
├─────────────────────────────────────────────────────────────┤
│  剧集列表（电视剧）                                         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐       │
│  │1  │ │2  │ │3  │ │4  │ │5  │ │6  │ │7  │ │8  │       │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘       │
├─────────────────────────────────────────────────────────────┤
│  相关推荐                                                   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                          │
│  │     │ │     │ │     │ │     │                          │
│  └─────┘ └─────┘ └─────┘ └─────┘                          │
└─────────────────────────────────────────────────────────────┘
```

**交互细节**：
- 海报悬停放大效果
- 评分显示星级
- 收藏状态实时反馈
- 播放源显示质量标签
- 剧集列表支持快速定位

### 4.3 播放页设计

**布局结构**：
```
┌─────────────────────────────────────────────────────────────┐
│                        播放器                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │                    视频画面                          │   │
│  │                                                     │   │
│  │              [播放/暂停按钮]                         │   │
│  │                                                     │   │
│  │  ──────────────────────────────────────────────    │   │
│  │  00:00 ──────────────────────────────── 01:30:00   │   │
│  │  [播放] [上一集] [下一集] [音量] [倍速] [画中画] [全屏]│   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┬───────────────────────────────┐   │
│  │                     │                               │   │
│  │  视频信息           │  剧集列表                      │   │
│  │  标题               │  ┌───┐ ┌───┐ ┌───┐ ┌───┐     │   │
│  │  评分               │  │1  │ │2  │ │3  │ │4  │     │   │
│  │  更新时间           │  └───┘ └───┘ └───┘ └───┘     │   │
│  │                     │  ┌───┐ ┌───┐ ┌───┐ ┌───┐     │   │
│  │  相关推荐           │  │5  │ │6  │ │7  │ │8  │     │   │
│  │  ┌─────┐ ┌─────┐   │  └───┘ └───┘ └───┘ └───┘     │   │
│  │  │     │ │     │   │                               │   │
│  │  └─────┘ └─────┘   │                               │   │
│  └─────────────────────┴───────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**交互细节**：
- 点击播放/暂停
- 双击全屏/退出全屏
- 左右滑动/拖动调整进度
- 左侧上下滑动调整亮度
- 右侧上下滑动调整音量
- 长按2倍速播放
- 手势锁定功能
- 画中画模式
- 弹幕开关

### 4.4 搜索页设计

**布局结构**：
```
┌─────────────────────────────────────────────────────────────┐
│                        Header                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🔍 搜索关键词...                    [搜索]         │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  热门搜索                                                   │
│  [关键词1] [关键词2] [关键词3] [关键词4] [关键词5]           │
├─────────────────────────────────────────────────────────────┤
│  搜索历史                                                   │
│  [历史1] [历史2] [历史3]                    [清除历史]       │
├─────────────────────────────────────────────────────────────┤
│  搜索结果                                                   │
│  筛选: [全部] [电影] [电视剧] [综艺] [动漫]                 │
│  排序: [相关度] [最新] [评分] [热度]                         │
│                                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │     │ │     │ │     │ │     │ │     │                  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                  │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│  │     │ │     │ │     │ │     │ │     │                  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                  │
├─────────────────────────────────────────────────────────────┤
│  分页: < 1 2 3 4 5 >                                        │
└─────────────────────────────────────────────────────────────┘
```

**交互细节**：
- 输入时实时显示搜索建议
- 搜索建议包含历史记录和热门搜索
- 筛选条件实时更新结果
- 排序切换平滑过渡
- 分页支持快速跳转

### 4.5 个人中心设计

**布局结构**：
```
┌─────────────────────────────────────────────────────────────┐
│                        Header                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  用户信息                                           │   │
│  │  ┌─────┐  用户名                                   │   │
│  │  │头像 │  邮箱                                     │   │
│  │  └─────┘  注册时间                                 │   │
│  │           [编辑资料] [修改密码]                     │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  统计数据                                                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │观看时长  │ │观看数量  │ │收藏数量  │ │弹幕数量  │          │
│  │ 120小时 │ │ 50部    │ │ 30部    │ │ 200条   │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
├─────────────────────────────────────────────────────────────┤
│  功能入口                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  观看历史    │ │  我的收藏    │ │  搜索历史    │          │
│  │  >          │ │  >          │ │  >          │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  推荐设置    │ │  账号安全    │ │  关于我们    │          │
│  │  >          │ │  >          │ │  >          │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  [退出登录]                                                 │
└─────────────────────────────────────────────────────────────┘
```

**交互细节**：
- 头像支持点击更换
- 统计数据实时更新
- 功能入口图标清晰
- 退出登录二次确认

---

## 五、响应式设计

### 5.1 断点系统

```css
:root {
  /* 断点 */
  --breakpoint-sm: 640px;    /* 手机横屏 */
  --breakpoint-md: 768px;    /* 平板竖屏 */
  --breakpoint-lg: 1024px;   /* 平板横屏 */
  --breakpoint-xl: 1280px;   /* 笔记本 */
  --breakpoint-2xl: 1536px;  /* 桌面 */
}

/* 响应式工具类 */
@media (min-width: var(--breakpoint-sm)) { ... }
@media (min-width: var(--breakpoint-md)) { ... }
@media (min-width: var(--breakpoint-lg)) { ... }
@media (min-width: var(--breakpoint-xl)) { ... }
@media (min-width: var(--breakpoint-2xl)) { ... }
```

### 5.2 移动端适配

**底部导航栏**：
```vue
<template>
  <nav class="mobile-nav">
    <router-link to="/" class="nav-item">
      <Home :size="24" />
      <span>首页</span>
    </router-link>
    <router-link to="/search" class="nav-item">
      <Search :size="24" />
      <span>搜索</span>
    </router-link>
    <router-link to="/favorites" class="nav-item">
      <Heart :size="24" />
      <span>收藏</span>
    </router-link>
    <router-link to="/profile" class="nav-item">
      <User :size="24" />
      <span>我的</span>
    </router-link>
  </nav>
</template>

<style scoped>
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  padding: var(--spacing-2) 0;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-primary);
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  color: var(--text-tertiary);
  text-decoration: none;
  font-size: var(--text-xs);
}

.nav-item.router-link-active {
  color: var(--color-primary);
}

@media (min-width: 768px) {
  .mobile-nav {
    display: none;
  }
}
</style>
```

**媒体卡片响应式**：
```vue
<template>
  <div class="media-grid">
    <MediaCard v-for="item in mediaList" :key="item.id" :media="item" />
  </div>
</template>

<style scoped>
.media-grid {
  display: grid;
  gap: var(--gap-md);
  grid-template-columns: repeat(1, 1fr);
}

@media (min-width: 640px) {
  .media-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .media-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .media-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1280px) {
  .media-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
```

---

## 六、动画设计

### 6.1 页面切换动画

```vue
<template>
  <router-view v-slot="{ Component, route }">
    <transition :name="route.meta.transition || 'fade'" mode="out-in">
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>

<style>
/* 淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-normal) var(--ease-out);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滑动 */
.slide-enter-active,
.slide-leave-active {
  transition: transform var(--duration-normal) var(--ease-out);
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}

/* 缩放 */
.scale-enter-active,
.scale-leave-active {
  transition: transform var(--duration-normal) var(--ease-out);
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.95);
  opacity: 0;
}
</style>
```

### 6.2 列表动画

```vue
<template>
  <transition-group name="list" tag="div" class="media-grid">
    <MediaCard
      v-for="(item, index) in mediaList"
      :key="item.id"
      :media="item"
      :style="{ animationDelay: `${index * 50}ms` }"
    />
  </transition-group>
</template>

<style>
.list-enter-active {
  animation: slideUp var(--duration-normal) var(--ease-out) both;
}

.list-leave-active {
  animation: fadeOut var(--duration-fast) var(--ease-out) both;
}

.list-move {
  transition: transform var(--duration-normal) var(--ease-out);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
```

### 6.3 微交互动画

```vue
<template>
  <!-- 按钮点击效果 -->
  <button class="btn-click-effect" @click="handleClick">
    <span class="ripple" />
    Click Me
  </button>
  
  <!-- 收藏动画 -->
  <button class="favorite-btn" @click="toggleFavorite">
    <Heart
      :size="24"
      :class="{ 'heart-active': isFavorite }"
    />
  </button>
  
  <!-- 加载动画 -->
  <div class="loading-spinner">
    <Loader :size="24" class="animate-spin" />
  </div>
</template>

<style>
/* 按钮点击波纹效果 */
.btn-click-effect {
  position: relative;
  overflow: hidden;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: ripple 0.6s linear;
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* 收藏动画 */
.heart-active {
  animation: heartBeat 0.3s var(--ease-bounce);
}

@keyframes heartBeat {
  0% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(1); }
  75% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* 加载动画 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
```

---

## 七、可访问性设计

### 7.1 焦点管理

```css
/* 焦点样式 */
:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

/* 跳过链接 */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-2) var(--spacing-4);
  z-index: 100;
  transition: top var(--duration-normal);
}

.skip-link:focus {
  top: 0;
}
```

### 7.2 键盘导航

```vue
<template>
  <div
    role="navigation"
    aria-label="主导航"
    @keydown="handleKeydown"
  >
    <button
      v-for="(item, index) in navItems"
      :key="item.id"
      :tabindex="index === activeIndex ? 0 : -1"
      :aria-selected="index === activeIndex"
      @click="setActive(index)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault()
      setActive((activeIndex.value + 1) % navItems.length)
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault()
      setActive((activeIndex.value - 1 + navItems.length) % navItems.length)
      break
    case 'Home':
      event.preventDefault()
      setActive(0)
      break
    case 'End':
      event.preventDefault()
      setActive(navItems.length - 1)
      break
  }
}
</script>
```

### 7.3 屏幕阅读器支持

```vue
<template>
  <!-- ARIA标签 -->
  <button
    :aria-label="isPlaying ? '暂停' : '播放'"
    :aria-pressed="isPlaying"
    @click="togglePlay"
  >
    <Play v-if="!isPlaying" :size="24" />
    <Pause v-else :size="24" />
  </button>
  
  <!-- 进度条 -->
  <div
    role="progressbar"
    :aria-valuenow="progress"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="`播放进度 ${progress}%`"
  >
    <div :style="{ width: `${progress}%` }" />
  </div>
  
  <!-- 状态提示 -->
  <div
    role="status"
    aria-live="polite"
    class="sr-only"
  >
    {{ statusMessage }}
  </div>
</template>

<style>
/* 屏幕阅读器专用 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
```

### 7.4 高对比度模式

```css
@media (prefers-contrast: high) {
  :root {
    --bg-primary: #000000;
    --bg-secondary: #1a1a1a;
    --text-primary: #ffffff;
    --text-secondary: #e0e0e0;
    --border-primary: #ffffff;
    --color-primary: #4da6ff;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 八、设计规范总结

### 8.1 核心规范

1. **颜色**：使用CSS变量，支持深色/浅色主题切换
2. **字体**：Inter字体族，清晰易读
3. **间距**：4px为基础单位，保持一致性
4. **圆角**：8px为标准圆角，卡片使用12px
5. **阴影**：三层阴影系统，增强层次感
6. **动画**：200ms为标准时长，使用ease-out缓动

### 8.2 组件规范

1. **按钮**：5种变体，3种尺寸，支持加载状态
2. **卡片**：3种变体，支持悬停效果
3. **输入框**：支持图标、清除、错误提示
4. **骨架屏**：4种形状，脉冲动画

### 8.3 交互规范

1. **反馈**：操作后立即提供视觉反馈
2. **动画**：页面切换、列表加载、状态变化
3. **可访问性**：键盘导航、屏幕阅读器、高对比度
4. **响应式**：移动端优先，断点适配

### 8.4 图标规范

1. **图标库**：Lucide Icons
2. **尺寸**：16px、20px、24px、32px
3. **颜色**：继承文本颜色
4. **状态**：支持悬停、激活、禁用状态

---

*文档版本: v1.0*
*生成时间: 2026-06-30*
*设计师: [待定]*
