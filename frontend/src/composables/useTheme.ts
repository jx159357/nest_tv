import { computed, ref } from 'vue';

export type AppTheme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'nest-tv-theme';
const DEFAULT_THEME: AppTheme = 'system';

const isAppTheme = (value: string | null): value is AppTheme =>
  value === 'light' || value === 'dark' || value === 'system';

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

const readStoredTheme = (): AppTheme => {
  if (typeof window === 'undefined') return DEFAULT_THEME;

  try {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    return isAppTheme(savedTheme) ? savedTheme : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

const currentTheme = ref<AppTheme>(readStoredTheme());
const systemTheme = ref<ResolvedTheme>(getSystemTheme());
let mediaQuery: MediaQueryList | null = null;
let mediaQueryReady = false;

const resolveTheme = (theme: AppTheme): ResolvedTheme => {
  return theme === 'system' ? systemTheme.value : theme;
};

const applyTheme = (theme: AppTheme) => {
  if (typeof document === 'undefined') return;

  const resolvedTheme = resolveTheme(theme);
  const root = document.documentElement;
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  root.classList.toggle('dark', resolvedTheme === 'dark');
  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = theme;
  root.style.colorScheme = resolvedTheme;

  if (themeColor) {
    themeColor.content = resolvedTheme === 'dark' ? '#08090d' : '#ffffff';
  }
};

const bindSystemThemeListener = () => {
  if (mediaQueryReady || typeof window === 'undefined' || !window.matchMedia) return;

  mediaQueryReady = true;
  mediaQuery = window.matchMedia('(prefers-color-scheme: light)');

  const handleSystemThemeChange = () => {
    systemTheme.value = getSystemTheme();
    if (currentTheme.value === 'system') {
      applyTheme(currentTheme.value);
    }
  };

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleSystemThemeChange);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(handleSystemThemeChange);
  }
};

export const initializeTheme = () => {
  systemTheme.value = getSystemTheme();
  currentTheme.value = readStoredTheme();
  bindSystemThemeListener();
  applyTheme(currentTheme.value);
  return currentTheme.value;
};

export const setTheme = (theme: AppTheme) => {
  currentTheme.value = theme;

  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  } catch {
    // localStorage can be blocked in private sessions.
  }

  applyTheme(theme);
};

export const toggleTheme = () => {
  const order: AppTheme[] = ['dark', 'light', 'system'];
  const currentIndex = order.indexOf(currentTheme.value);
  const nextTheme = order[(currentIndex + 1) % order.length] || DEFAULT_THEME;
  setTheme(nextTheme);
};

export const useTheme = () => ({
  theme: currentTheme,
  effectiveTheme: computed(() => resolveTheme(currentTheme.value)),
  isDark: computed(() => resolveTheme(currentTheme.value) === 'dark'),
  isSystemTheme: computed(() => currentTheme.value === 'system'),
  setTheme,
  toggleTheme,
});
