import { defineConfig, presetAttributify, presetIcons, presetUno } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons(),
  ],
  theme: {
    colors: {
      primary: {
        50: '#eff6ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
      },
    },
  },
  shortcuts: {
    'btn': 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    'btn-primary': 'btn bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    'btn-secondary': 'btn bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    'card': 'bg-white rounded-lg shadow-sm border border-gray-200',
    'input': 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
  },
})