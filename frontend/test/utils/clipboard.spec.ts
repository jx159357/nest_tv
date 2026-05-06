import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyTextToClipboard } from '@/utils/clipboard';

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
const originalExecCommand = document.execCommand;
const originalBody = document.body;

const restoreClipboard = () => {
  if (originalClipboard) {
    Object.defineProperty(navigator, 'clipboard', originalClipboard);
    return;
  }

  delete (navigator as Navigator & { clipboard?: Clipboard }).clipboard;
};

const restoreExecCommand = () => {
  if (originalExecCommand) {
    Object.defineProperty(document, 'execCommand', {
      value: originalExecCommand,
      configurable: true,
    });
    return;
  }

  delete (document as Document & { execCommand?: typeof document.execCommand }).execCommand;
};

afterEach(() => {
  restoreClipboard();
  restoreExecCommand();
  if (!document.body) {
    Object.defineProperty(document, 'body', {
      value: originalBody,
      configurable: true,
    });
  }
  document.body.innerHTML = '';
});

describe('copyTextToClipboard', () => {
  it('prefers navigator.clipboard.writeText when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText } as Clipboard,
      configurable: true,
    });

    await copyTextToClipboard('demo-link');

    expect(writeText).toHaveBeenCalledWith('demo-link');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('propagates clipboard api failures without falling back to execCommand', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('write failed'));
    const execCommandMock = vi.fn();

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText } as Clipboard,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    await expect(copyTextToClipboard('demo-link')).rejects.toThrow('write failed');
    expect(writeText).toHaveBeenCalledWith('demo-link');
    expect(execCommandMock).not.toHaveBeenCalled();
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('falls back to execCommand and removes the temporary textarea', async () => {
    const execCommandMock = vi.fn().mockReturnValue(true);

    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    await copyTextToClipboard('demo-link');

    expect(execCommandMock).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('rejects with the helper fallback message when execCommand is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    delete (document as Document & { execCommand?: typeof document.execCommand }).execCommand;

    await expect(copyTextToClipboard('demo-link')).rejects.toThrow('Clipboard unavailable');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('rejects with the helper fallback message when execCommand returns false', async () => {
    const execCommandMock = vi.fn().mockReturnValue(false);

    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    await expect(copyTextToClipboard('demo-link')).rejects.toThrow('Clipboard unavailable');
    expect(execCommandMock).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('rejects immediately when document.body is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(document, 'body', {
      value: null,
      configurable: true,
    });

    try {
      await expect(copyTextToClipboard('demo-link')).rejects.toThrow('Clipboard unavailable');
    } finally {
      Object.defineProperty(document, 'body', {
        value: originalBody,
        configurable: true,
      });
    }
  });

  it('still removes the temporary textarea when fallback copy throws', async () => {
    const execCommandMock = vi.fn(() => {
      throw new Error('copy failed');
    });

    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
    });

    await expect(copyTextToClipboard('demo-link')).rejects.toThrow('copy failed');
    expect(document.querySelector('textarea')).toBeNull();
  });
});
