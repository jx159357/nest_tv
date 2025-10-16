import { ref, reactive } from 'vue'

// 模态框状态
export const modalState = reactive({
  isVisible: false,
  type: 'info' as 'loading' | 'success' | 'error' | 'info' | 'confirm',
  title: '',
  message: '',
  confirmText: '确认',
  cancelText: '取消',
  showAction: false,
  onConfirm: () => {},
  onCancel: () => {},
})

// 显示模态框
export const showModal = (options: {
  type?: 'loading' | 'success' | 'error' | 'info' | 'confirm'
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  showAction?: boolean
  onConfirm?: () => void
  onCancel?: () => void
}) => {
  Object.assign(modalState, {
    isVisible: true,
    type: options.type || 'info',
    title: options.title || '',
    message: options.message || '',
    confirmText: options.confirmText || '确认',
    cancelText: options.cancelText || '取消',
    showAction: options.showAction || false,
    onConfirm: options.onConfirm || (() => {}),
    onCancel: options.onCancel || (() => {}),
  })
}

// 隐藏模态框
export const hideModal = () => {
  modalState.isVisible = false
}

// 显示加载中
export const showLoading = (message = '加载中...') => {
  showModal({
    type: 'loading',
    title: '请稍候',
    message,
    showAction: false,
  })
}

// 显示成功
export const showSuccess = (message: string, title = '成功') => {
  showModal({
    type: 'success',
    title,
    message,
    showAction: false,
  })
}

// 显示错误
export const showError = (message: string, title = '错误') => {
  showModal({
    type: 'error',
    title,
    message,
    showAction: false,
  })
}

// 显示信息
export const showInfo = (message: string, title = '提示') => {
  showModal({
    type: 'info',
    title,
    message,
    showAction: false,
  })
}

// 显示确认对话框
export const showConfirm = (
  message: string,
  onConfirm: () => void,
  title = '确认',
  confirmText = '确认',
  cancelText = '取消'
) => {
  showModal({
    type: 'confirm',
    title,
    message,
    confirmText,
    cancelText,
    showAction: true,
    onConfirm,
    onCancel: hideModal,
  })
}

// 通知系统
export interface Notification {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

export const notifications = ref<Notification[]>([])

let notificationId = 0

// 显示通知
export const showNotification = (options: {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}) => {
  const id = ++notificationId
  const notification: Notification = {
    id,
    type: options.type,
    title: options.title,
    message: options.message,
    duration: options.duration || 5000,
  }
  
  notifications.value.push(notification)
  
  // 自动移除通知
  setTimeout(() => {
    removeNotification(id)
  }, notification.duration)
}

// 移除通知
export const removeNotification = (id: number) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

// 快捷方法
export const notifySuccess = (title: string, message: string) => {
  showNotification({ type: 'success', title, message })
}

export const notifyError = (title: string, message: string) => {
  showNotification({ type: 'error', title, message })
}

export const notifyWarning = (title: string, message: string) => {
  showNotification({ type: 'warning', title, message })
}

export const notifyInfo = (title: string, message: string) => {
  showNotification({ type: 'info', title, message })
}