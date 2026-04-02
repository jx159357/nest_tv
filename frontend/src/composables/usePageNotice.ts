import { ref } from 'vue';

export type PageNoticeType = 'success' | 'error' | 'warning' | 'info';

export interface PageNoticeState {
  type: PageNoticeType;
  message: string;
  title?: string;
}

export const usePageNotice = () => {
  const notice = ref<PageNoticeState | null>(null);

  const setNotice = (type: PageNoticeType, message: string, title?: string) => {
    notice.value = { type, message, title };
  };

  const clearNotice = () => {
    notice.value = null;
  };

  return {
    notice,
    setNotice,
    clearNotice,
  };
};
