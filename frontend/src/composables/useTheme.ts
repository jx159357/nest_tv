import { computed, ref } from 'vue';

export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'nest-tv-theme';
const DEFAULT_THEME: AppTheme = 'dark';

const isAppTheme = (value: string | null): value is AppTheme =>
  value === 'light' || value === 'dark';

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

const applyTheme = (theme: AppTheme) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  if (themeColor) {
    themeColor.content = theme === 'dark' ? '#08090d' : '#ffffff';
  }
};

export const initializeTheme = () => {
  currentTheme.value = readStoredTheme();
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
  setTheme(currentTheme.value === 'dark' ? 'light' : 'dark');
};

export const useTheme = () => ({
  theme: currentTheme,
  isDark: computed(() => currentTheme.value === 'dark'),
  setTheme,
  toggleTheme,
});
