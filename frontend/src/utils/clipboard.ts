export const copyTextToClipboard = async (value: string) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === 'undefined' || !document.body) {
    throw new Error('Clipboard unavailable');
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  textarea.style.pointerEvents = 'none';

  document.body.appendChild(textarea);
  try {
    textarea.focus();
    textarea.select();

    const copied = typeof document.execCommand === 'function' && document.execCommand('copy');
    if (!copied) {
      throw new Error('Clipboard unavailable');
    }
  } finally {
    textarea.remove();
  }
};
