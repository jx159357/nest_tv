import { defineStore } from 'pinia';

interface LoadingState {
  isLoading: boolean;
  loadingText: string;
  loadingType: 'global' | 'partial' | 'route';
  loadingProgress: number;
  loadingActions: string[];
  error: string | null;
}

interface LoadingOptions {
  text?: string;
  type?: 'global' | 'partial' | 'route';
  showProgress?: boolean;
  actions?: string[];
}

export const useLoadingStore = defineStore('loading', {
  state: (): LoadingState => ({
    isLoading: false,
    loadingText: '',
    loadingType: 'global',
    loadingProgress: 0,
    loadingActions: [],
    error: null,
  }),

  getters: {
    // 获取加载状态
    isLoading: state => state.isLoading,

    // 获取加载文本
    loadingText: state => state.loadingText,

    // 获取加载类型
    loadingType: state => state.loadingType,

    // 获取加载进度
    loadingProgress: state => state.loadingProgress,

    // 获取加载动作
    loadingActions: state => state.loadingActions,

    // 获取错误信息
    error: state => state.error,

    // 检查是否是全局加载
    isGlobalLoading: state => state.isLoading && state.loadingType === 'global',

    // 检查是否是路由加载
    isRouteLoading: state => state.isLoading && state.loadingType === 'route',

    // 检查是否是局部加载
    isPartialLoading: state => state.isLoading && state.loadingType === 'partial',

    // 获取加载状态信息
    loadingInfo: state => ({
      isLoading: state.isLoading,
      text: state.loadingText,
      type: state.loadingType,
      progress: state.loadingProgress,
      actions: state.loadingActions,
      error: state.error,
    }),
  },

  actions: {
    /**
     * 开始加载
     */
    startLoading(options: LoadingOptions = {}) {
      const { text = '加载中...', type = 'global', showProgress = false, actions = [] } = options;

      this.isLoading = true;
      this.loadingText = text;
      this.loadingType = type;
      this.loadingProgress = 0;
      this.loadingActions = actions;
      this.error = null;

      // 如果显示进度条，启动进度模拟
      if (showProgress) {
        this.startProgressSimulation();
      }
    },

    /**
     * 更新加载文本
     */
    updateLoadingText(text: string) {
      this.loadingText = text;
    },

    /**
     * 更新加载进度
     */
    updateProgress(progress: number) {
      this.loadingProgress = Math.max(0, Math.min(100, progress));

      // 进度完成时自动停止加载
      if (progress >= 100) {
        setTimeout(() => {
          this.stopLoading();
        }, 300);
      }
    },

    /**
     * 添加加载动作
     */
    addAction(action: string) {
      if (!this.loadingActions.includes(action)) {
        this.loadingActions.push(action);
      }
    },

    /**
     * 移除加载动作
     */
    removeAction(action: string) {
      const index = this.loadingActions.indexOf(action);
      if (index > -1) {
        this.loadingActions.splice(index, 1);
      }
    },

    /**
     * 设置加载错误
     */
    setLoadingError(error: string) {
      this.error = error;
      this.isLoading = false;
    },

    /**
     * 停止加载
     */
    stopLoading() {
      this.isLoading = false;
      this.loadingProgress = 0;
      this.loadingActions = [];
      // 保留错误信息，让用户可以看到最后一次错误
    },

    /**
     * 清理错误
     */
    clearError() {
      this.error = null;
    },

    /**
     * 重置状态
     */
    reset() {
      this.isLoading = false;
      this.loadingText = '';
      this.loadingType = 'global';
      this.loadingProgress = 0;
      this.loadingActions = [];
      this.error = null;
    },

    /**
     * 启动进度模拟
     */
    startProgressSimulation() {
      const simulateProgress = () => {
        if (this.isLoading && this.loadingProgress < 100) {
          // 随机增加进度，模拟真实的加载过程
          const increment = Math.random() * 15 + 5; // 5-20的随机增量
          this.updateProgress(Math.min(this.loadingProgress + increment, 95));

          // 根据当前进度调整下次更新时间
          const delay = this.loadingProgress < 50 ? 200 : this.loadingProgress < 80 ? 300 : 400;
          setTimeout(simulateProgress, delay);
        }
      };

      setTimeout(simulateProgress, 100);
    },

    /**
     * 路由加载开始
     */
    startRouteLoading(from?: string, to?: string) {
      const loadingText = to ? `正在跳转到 ${to}` : '页面加载中...';
      this.startLoading({
        text: loadingText,
        type: 'route',
        showProgress: false,
      });
    },

    /**
     * 路由加载完成
     */
    finishRouteLoading() {
      if (this.loadingType === 'route') {
        this.stopLoading();
      }
    },

    /**
     * API请求加载
     */
    startApiLoading(action?: string) {
      const loadingText = action ? `正在${action}...` : '请求数据中...';
      this.startLoading({
        text: loadingText,
        type: 'partial',
        showProgress: false,
        actions: action ? [action] : [],
      });
    },

    /**
     * API请求完成
     */
    finishApiLoading() {
      if (this.loadingType === 'partial') {
        this.stopLoading();
      }
    },

    /**
     * 文件上传加载
     */
    startFileUpload(filename: string) {
      this.startLoading({
        text: `正在上传 ${filename}...`,
        type: 'partial',
        showProgress: true,
        actions: ['文件上传'],
      });
    },

    /**
     * 更新上传进度
     */
    updateUploadProgress(progress: number) {
      if (this.loadingType === 'partial' && this.loadingActions.includes('文件上传')) {
        this.updateProgress(progress);
      }
    },
  },
});
