import { ref, onUnmounted } from 'vue';

export interface LongPressOptions {
  delay?: number;
  moveThreshold?: number;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function useLongPress(options: LongPressOptions = {}) {
  const { delay = 500, moveThreshold = 10, onPress, onLongPress } = options;

  const isPressed = ref(false);
  const isLongPress = ref(false);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let startX = 0;
  let startY = 0;
  let triggered = false;

  const clear = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const onStart = (e: PointerEvent) => {
    startX = e.clientX;
    startY = e.clientY;
    triggered = false;
    isPressed.value = true;
    isLongPress.value = false;

    timer = setTimeout(() => {
      triggered = true;
      isLongPress.value = true;
      try { navigator.vibrate?.(30); } catch {}
      onLongPress?.();
    }, delay);
  };

  const onMove = (e: PointerEvent) => {
    if (triggered) return;
    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);
    if (dx > moveThreshold || dy > moveThreshold) {
      clear();
      isPressed.value = false;
    }
  };

  const onEnd = () => {
    if (!triggered && isPressed.value) {
      onPress?.();
    }
    clear();
    isPressed.value = false;
    isLongPress.value = false;
  };

  const onCancel = () => {
    clear();
    isPressed.value = false;
    isLongPress.value = false;
  };

  onUnmounted(() => {
    clear();
  });

  return {
    isPressed,
    isLongPress,
    handlers: {
      pointerdown: onStart,
      pointermove: onMove,
      pointerup: onEnd,
      pointercancel: onCancel,
      pointerleave: onCancel,
    },
  };
}
