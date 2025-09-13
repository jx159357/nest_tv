/*
 * @Descripttion:
 * @version:
 * @Author: jxwd
 * @Date: 2025-09-10 12:17:19
 * @LastEditors: jxwd
 * @LastEditTime: 2025-09-10 14:51:08
 */
import { createI18n } from 'vue-i18n'
import { nextLocalStorage } from '@/utils/storage'
import { zhCN } from './locales/zh-CN'
import { en } from './locales/en'

// 获取存储的语言设置，默认中文
const savedLocale = nextLocalStorage.getItem('app-locale') || 'zh-CN'

// 创建i18n实例
export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'zh-CN',
  globalInjection: true,
  messages: {
    'zh-CN': zhCN,
    'en': en
  }
})

// 语言列表
export const availableLocales = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
] as const

// 检测语言是否支持
export const isLocaleSupported = (locale: string): boolean => {
  return availableLocales.some(l => l.code === locale)
}

// 获取浏览器语言
export const getBrowserLocale = (): 'zh-CN' | 'en' => {
  if (typeof navigator === 'undefined') return 'zh-CN'
  
  const browserLang = navigator.language || navigator.languages?.[0] || 'zh-CN'
  
  // 检测是否支持该语言
  if (isLocaleSupported(browserLang)) {
    return browserLang as 'zh-CN' | 'en'
  }
  
  // 尝试匹配基础语言
  const baseLang = browserLang.split('-')[0]
  if (baseLang === 'en') return 'en'
  if (baseLang === 'zh') return 'zh-CN'
  
  return 'zh-CN'
}

// 设置语言
export const setLocale = (locale: 'zh-CN' | 'en') => {
  if (!isLocaleSupported(locale)) {
    console.warn(`Unsupported locale: ${locale}`)
    return
  }

  i18n.global.locale.value = locale
  nextLocalStorage.setItem('app-locale', locale)

  // 设置HTML的lang属性
  document.documentElement.lang = locale
}

// 获取当前语言
export const getCurrentLocale = (): 'zh-CN' | 'en' => {
  const locale = i18n.global.locale.value as 'zh-CN' | 'en' || 'zh-CN'
  return locale
}