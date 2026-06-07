/*
 * @Descripttion:
 * @version:
 * @Author: jxwd
 * @Date: 2025-09-10 12:17:19
 * @LastEditors: jxwd
 * @LastEditTime: 2025-09-10 14:51:08
 */
import { createI18n } from 'vue-i18n';
import { nextLocalStorage } from '@/utils/storage';
import { log } from '@/utils/logger';
import { zhCN } from './locales/zh-CN';

const DEFAULT_LOCALE = 'zh-CN';

// 语言列表
export const availableLocales = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;

export type SupportedLocale = (typeof availableLocales)[number]['code'];
type LocaleMessages = typeof zhCN;

// 检测语言是否支持
export const isLocaleSupported = (locale: string): locale is SupportedLocale => {
  return availableLocales.some(l => l.code === locale);
};

const getSavedLocale = (): SupportedLocale => {
  const savedLocale = nextLocalStorage.getItem('app-locale');
  return savedLocale && isLocaleSupported(savedLocale) ? savedLocale : DEFAULT_LOCALE;
};

const loadedLocales = new Set<SupportedLocale>([DEFAULT_LOCALE]);

// 获取存储的语言设置，默认中文
const savedLocale = getSavedLocale();

// 创建i18n实例
export const i18n = createI18n<[LocaleMessages], SupportedLocale, false>({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: DEFAULT_LOCALE,
  globalInjection: true,
  messages: {
    'zh-CN': zhCN,
  } as Record<SupportedLocale, LocaleMessages>,
});

const loadLocaleMessages = async (locale: SupportedLocale): Promise<LocaleMessages> => {
  switch (locale) {
    case 'zh-CN':
      return zhCN;
    case 'en': {
      const messages = await import('./locales/en');
      return messages.en;
    }
  }
};

const ensureLocaleMessages = async (locale: SupportedLocale): Promise<void> => {
  if (loadedLocales.has(locale)) return;

  const messages = await loadLocaleMessages(locale);
  i18n.global.setLocaleMessage(locale, messages);
  loadedLocales.add(locale);
};

// 获取浏览器语言
export const getBrowserLocale = (): SupportedLocale => {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;

  const browserLang = navigator.language || navigator.languages?.[0] || DEFAULT_LOCALE;

  // 检测是否支持该语言
  if (isLocaleSupported(browserLang)) {
    return browserLang;
  }

  // 尝试匹配基础语言
  const baseLang = browserLang.split('-')[0];
  if (baseLang === 'en') return 'en';
  if (baseLang === 'zh') return DEFAULT_LOCALE;

  return DEFAULT_LOCALE;
};

// 设置语言
export const setLocale = async (locale: SupportedLocale): Promise<void> => {
  if (!isLocaleSupported(locale)) {
    log.warn('I18n', `Unsupported locale: ${locale}`);
    return;
  }

  await ensureLocaleMessages(locale);

  i18n.global.locale.value = locale;
  nextLocalStorage.setItem('app-locale', locale);

  // 设置HTML的lang属性
  document.documentElement.lang = locale;
};

export const initializeI18nLocale = async (): Promise<void> => {
  await setLocale(savedLocale);
};

// 获取当前语言
export const getCurrentLocale = (): SupportedLocale => {
  const locale = (i18n.global.locale.value as SupportedLocale) || DEFAULT_LOCALE;
  return locale;
};
