<template>
  <div ref="wrapperRef" class="text-clamp-wrapper">
    <div v-if="disabled" class="text-content full-text">
      <slot>{{ text }}</slot>
    </div>

    <div v-else class="text-content clamped-text" :class="{ expanded: isExpanded }">
      <span class="main-text">{{ displayContent }}</span>
      <span
        v-if="showButton && isClamped"
        class="action-btn-wrapper clamp-btn-style"
        @click.stop="handleToggleExpand"
      >
        <slot name="expand-btn">
          <span>{{ isExpanded ? collapseText : expandText }}</span>
        </slot>
      </span>
    </div>

    <div ref="shadowRef" class="shadow-content" aria-hidden="true"></div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';

  interface Props {
    text: string;
    maxLines?: number | string;
    disabled?: boolean;
    showButton?: boolean;
    expandText?: string;
    collapseText?: string;
    ellipsis?: string;
    modelValue?: boolean;
    debounceTime?: number;
    btnClass?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    maxLines: 2,
    disabled: false,
    showButton: true,
    expandText: '展开',
    collapseText: '收起',
    ellipsis: ' ...',
    modelValue: false,
    debounceTime: 100,
    btnClass: '',
  });

  const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    expand: [];
    collapse: [];
    clamped: [value: boolean];
    resize: [rect: DOMRect];
    clampComplete: [data: { isClamped: boolean; originalText: string; clampedText: string; maxLines: number }];
  }>();

  const wrapperRef = ref<HTMLDivElement>();
  const shadowRef = ref<HTMLDivElement>();
  const displayContent = ref('');
  const isExpanded = ref(props.modelValue);
  const isClamped = ref(false);
  let resizeObserver: ResizeObserver | null = null;
  let resizeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  watch(
    () => props.modelValue,
    newVal => {
      isExpanded.value = newVal;
    },
  );

  watch(isExpanded, newVal => {
    emit('update:modelValue', newVal);
    if (newVal) {
      emit('expand');
    } else {
      emit('collapse');
    }
    calculateClamp();
  });

  watch(
    () => props.text,
    () => init(),
    { immediate: true },
  );

  watch(
    () => props.maxLines,
    () => init(),
  );

  watch(
    () => props.disabled,
    () => init(),
  );

  watch(
    () => props.showButton,
    () => init(),
  );

  const init = () => {
    if (props.disabled) {
      displayContent.value = props.text || '';
      isClamped.value = false;
      emit('clamped', false);
      return;
    }

    if (!props.text || props.text.trim() === '') {
      displayContent.value = '';
      isClamped.value = false;
      emit('clamped', false);
      return;
    }

    calculateClamp();
  };

  const initResizeObserver = () => {
    if (!window.ResizeObserver || props.disabled) return;

    resizeObserver = new ResizeObserver(entries => {
      clearTimeout(resizeDebounceTimer!);
      resizeDebounceTimer = setTimeout(() => {
        calculateClamp();
        emit('resize', entries[0].contentRect);
      }, props.debounceTime);
    });

    if (wrapperRef.value) {
      resizeObserver.observe(wrapperRef.value);
    }
  };

  const handleToggleExpand = () => {
    if (props.disabled || !isClamped.value) return;
    isExpanded.value = !isExpanded.value;
  };

  const calculateClamp = () => {
    if (props.disabled || !props.text) {
      isClamped.value = false;
      displayContent.value = props.text || '';
      emit('clamped', false);
      return;
    }

    window.requestAnimationFrame(() => {
      const shadow = shadowRef.value;
      const wrapper = wrapperRef.value;
      if (!shadow || !wrapper) {
        emit('clamped', false);
        return;
      }

      const styles = window.getComputedStyle(wrapper);
      const wrapperRect = wrapper.getBoundingClientRect();
      const wrapperWidth = wrapperRect.width || parseFloat(styles.width) || 0;

      const paddingLeft = parseFloat(styles.paddingLeft) || 0;
      const paddingRight = parseFloat(styles.paddingRight) || 0;
      const contentWidth = wrapperWidth - paddingLeft - paddingRight;

      if (contentWidth <= 0) {
        displayContent.value = props.text;
        isClamped.value = false;
        emit('clamped', false);
        return;
      }

      const fontSize = parseFloat(styles.fontSize) || 14;
      const lineHeight = parseFloat(styles.lineHeight) || fontSize * 1.5;
      const maxLines = Number(props.maxLines) || 2;
      const maxTextHeight = lineHeight * maxLines + 2;

      Object.assign(shadow.style, {
        width: `${contentWidth}px`,
        fontSize: styles.fontSize,
        lineHeight: styles.lineHeight,
        fontFamily: styles.fontFamily,
        fontWeight: styles.fontWeight,
        letterSpacing: styles.letterSpacing,
        wordBreak: 'break-all',
        whiteSpace: 'normal',
        boxSizing: 'content-box',
        padding: '0',
        margin: '0',
        border: 'none',
        visibility: 'hidden',
        position: 'absolute',
        top: '0',
        left: '0',
        zIndex: '-1000',
      });

      shadow.innerHTML = `<span>${props.text}</span>`;
      if (shadow.scrollHeight <= maxTextHeight) {
        isClamped.value = false;
        displayContent.value = props.text;
        emit('clamped', false);
        return;
      }

      isClamped.value = true;
      emit('clamped', true);

      if (isExpanded.value) {
        displayContent.value = props.text;
        return;
      }

      let btnHTML = '';
      if (props.showButton) {
        const btnText = props.expandText || '展开';
        const btnClass = props.btnClass ? ` ${props.btnClass}` : '';
        btnHTML = `<span class="clamp-btn-style${btnClass}" style="display:inline-block; margin-left:4px; white-space:nowrap; vertical-align:middle;"> ${btnText}</span>`;
      }

      let low = 0;
      let high = props.text.length;
      let bestIndex = 0;
      let loopCount = 0;
      const maxLoop = 1000;

      while (low <= high && loopCount < maxLoop) {
        const mid = Math.floor((low + high) / 2);
        const str = props.text.slice(0, mid) + (props.ellipsis || ' ...');
        shadow.innerHTML = `<span style="display:inline;">${str}</span>${btnHTML}`;

        if (shadow.scrollHeight <= maxTextHeight) {
          bestIndex = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
        loopCount++;
      }

      const safeEllipsis = props.ellipsis || ' ...';
      const getSimulationHTML = (idx: number) => {
        const txt = props.text.slice(0, idx) + safeEllipsis;
        return `<span style="display:inline;">${txt}</span>${btnHTML}`;
      };

      let finalIndex = bestIndex;
      shadow.innerHTML = getSimulationHTML(finalIndex);

      while (shadow.scrollHeight > maxTextHeight && finalIndex > 0) {
        finalIndex--;
        shadow.innerHTML = getSimulationHTML(finalIndex);
      }

      displayContent.value = props.text.slice(0, finalIndex) + safeEllipsis;

      emit('clampComplete', {
        isClamped: isClamped.value,
        originalText: props.text,
        clampedText: displayContent.value,
        maxLines,
      });
    });
  };

  onMounted(() => {
    init();
    initResizeObserver();
  });

  onBeforeUnmount(() => {
    if (resizeObserver) resizeObserver.disconnect();
    if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
  });
</script>

<style scoped>
  .text-clamp-wrapper {
    position: relative;
    width: 100%;
    word-break: break-all;
    box-sizing: border-box;
  }

  .text-clamp-wrapper .text-content {
    display: block;
    text-align: left;
    overflow: hidden;
    transition: max-height 0.2s ease-in-out;
    max-height: fit-content;
  }

  .text-clamp-wrapper .text-content.expanded {
    max-height: 1000px;
  }

  .text-clamp-wrapper .text-content .main-text {
    display: inline;
    vertical-align: middle;
  }

  .text-clamp-wrapper .text-content .action-btn-wrapper {
    display: inline-block;
    vertical-align: middle;
    white-space: nowrap;
  }

  .text-clamp-wrapper :deep(.clamp-btn-style) {
    color: var(--text-link, #60a5fa);
    cursor: pointer;
    font-size: inherit;
    padding: 0 2px;
    border-radius: 2px;
    transition: opacity 0.2s ease;
  }

  .text-clamp-wrapper :deep(.clamp-btn-style:hover) {
    opacity: 0.8;
  }

  .text-clamp-wrapper .shadow-content {
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1000;
    visibility: hidden;
    pointer-events: none;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: none;
  }
</style>
