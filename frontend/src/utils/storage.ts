/**
 * 安全的本地存储工具（生产环境增强）
 */
export const nextLocalStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage访问失败:', error);
      return null;
    }
  },

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage写入失败:', error);
      // 可能是存储空间不足或隐私模式
    }
  },

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage删除失败:', error);
    }
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('localStorage清空失败:', error);
    }
  },

  // 安全的JWT存储（生产环境使用httpOnly cookie更安全）
  setJWT(token: string, key: string = import.meta.env.VITE_JWT_STORAGE_KEY || 'jwt_token'): void {
    if (import.meta.env.PROD) {
      console.warn('生产环境建议使用httpOnly cookie存储JWT令牌');
    }
    this.setItem(key, token);
  },

  getJWT(key: string = import.meta.env.VITE_JWT_STORAGE_KEY || 'jwt_token'): string | null {
    return this.getItem(key);
  },

  removeJWT(key: string = import.meta.env.VITE_JWT_STORAGE_KEY || 'jwt_token'): void {
    this.removeItem(key);
  },
};

/**
 * 会话存储工具
 */
export const nextSessionStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(key);
  },

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, value);
  },

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.clear();
  },
};
