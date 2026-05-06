import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type Theme = 'light' | 'dark' | 'auto';

export const useThemeStore = defineStore('theme', () => {
  // 状态
  const theme = ref<Theme>('auto'); // 默认跟随系统
  const darkModeOverride = ref<boolean | null>(null); // 用户手动覆盖

  // 计算当前主题
  const currentTheme = computed<Theme>(() => {
    // 优先使用用户手动设置
    if (darkModeOverride.value !== null) {
      return darkModeOverride.value ? 'dark' : 'light';
    }

    // 如果设置为 auto，则检查系统偏好
    if (theme.value === 'auto') {
      // 检查系统是否支持暗黑模式
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    }

    return theme.value;
  });

  // 判断是否为暗黑模式
  const isDarkMode = computed<boolean>(() => {
    return currentTheme.value === 'dark';
  });

  // 应用主题到文档
  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement;

    // 移除可能存在的主题类
    html.classList.remove('light-theme', 'dark-theme');

    // 添加对应的主题类
    if (newTheme === 'dark') {
      html.classList.add('dark-theme');
    } else if (newTheme === 'light') {
      html.classList.add('light-theme');
    }

    // 设置主题属性供CSS使用
    html.setAttribute('data-theme', newTheme);
  };

  // 设置主题
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme;
    darkModeOverride.value = null; // 重置手动覆盖
    applyTheme(newTheme);

    // 保存到本地存储
    localStorage.setItem('theme', newTheme);
  };

  // 手动切换暗黑模式
  const toggleDarkMode = () => {
    darkModeOverride.value = !isDarkMode.value;
    const newTheme = darkModeOverride.value ? 'dark' : 'light';
    applyTheme(newTheme);

    // 保存到本地存储
    localStorage.setItem('darkModeOverride', darkModeOverride.value.toString());
  };

  // 初始化主题
  const initTheme = () => {
    // 从本地存储恢复设置
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedOverride = localStorage.getItem('darkModeOverride');

    if (savedTheme) {
      theme.value = savedTheme;
    }

    if (savedOverride) {
      darkModeOverride.value = savedOverride === 'true';
    }

    // 应用当前主题
    applyTheme(currentTheme.value);

    // 监听系统主题变化（仅在 auto 模式下）
    if (theme.value === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      mediaQuery.addEventListener('change', e => {
        if (darkModeOverride.value === null) {
          const newTheme = e.matches ? 'dark' : 'light';
          applyTheme(newTheme);
        }
      });
    }
  };

  // 暴露方法和状态
  return {
    // 状态
    theme,
    currentTheme,
    isDarkMode,
    darkModeOverride,

    // 方法
    setTheme,
    toggleDarkMode,
    initTheme,

    // 计算属性
    isAuto: computed(() => theme.value === 'auto' && darkModeOverride.value === null),
    themeIcon: computed(() => {
      if (isDarkMode.value) return '🌙️';
      return '☀️';
    }),
  };
});
