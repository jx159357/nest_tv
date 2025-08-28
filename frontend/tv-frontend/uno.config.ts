import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(), // 默认UnoCSS预设
    presetIcons({
      scale: 1.2,
      warn: true,
    }), // 图标预设
  ],
  theme: {
    colors: {
      // 自定义主题颜色
      primary: '#007AFF',
      secondary: '#34C759',
      accent: '#FF9500',
      danger: '#FF3B30',
      warning: '#FFCC00',
      info: '#5AC8FA',
      light: '#F8F9FA',
      dark: '#212529',
    }
  },
  shortcuts: {
    // 自定义快捷类
    'btn': 'px-4 py-2 rounded font-medium transition-all duration-200',
    'btn-primary': 'btn bg-primary text-white hover:bg-blue-600',
    'btn-secondary': 'btn bg-secondary text-white hover:bg-green-600',
    'card': 'bg-white rounded-lg shadow-md p-4',
    'container': 'max-w-6xl mx-auto px-4',
  }
})