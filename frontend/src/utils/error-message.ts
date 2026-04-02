export const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object') {
    const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
    const message = response?.data?.message;

    if (Array.isArray(message)) {
      return message.join('；');
    }

    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return error instanceof Error ? error.message : fallback;
};
