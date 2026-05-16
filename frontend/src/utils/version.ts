const APP_VERSION = '1.0.0';

const VERSION_KEY = 'nest_tv_app_version';
const LAST_CHECK_KEY = 'nest_tv_version_check';
const CHECK_INTERVAL = 30 * 60 * 1000;

export function getAppVersion(): string {
  return APP_VERSION;
}

export function getStoredVersion(): string | null {
  try {
    return localStorage.getItem(VERSION_KEY);
  } catch {
    return null;
  }
}

export function setStoredVersion(v: string): void {
  try {
    localStorage.setItem(VERSION_KEY, v);
  } catch {
    // ignore storage errors
  }
}

export function isNewVersion(serverVersion: string): boolean {
  const local = getStoredVersion();
  if (!local) return false;
  return serverVersion !== local;
}

export function shouldCheckVersion(): boolean {
  try {
    const last = localStorage.getItem(LAST_CHECK_KEY);
    if (!last) return true;
    return Date.now() - Number(last) > CHECK_INTERVAL;
  } catch {
    return true;
  }
}

export function markVersionChecked(): void {
  try {
    localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
  } catch {
    // ignore storage errors
  }
}

export async function checkForUpdates(): Promise<{ hasUpdate: boolean; version: string } | null> {
  if (!shouldCheckVersion()) return null;
  try {
    markVersionChecked();
    const res = await fetch('/api/version');
    if (!res.ok) return null;
    const data = await res.json();
    const serverVersion = data.version as string;
    const stored = getStoredVersion();
    if (stored) {
      setStoredVersion(serverVersion);
      if (serverVersion !== stored) return { hasUpdate: true, version: serverVersion };
    } else {
      setStoredVersion(serverVersion);
    }
    return { hasUpdate: false, version: serverVersion };
  } catch {
    return null;
  }
}

export function initVersion(): void {
  const stored = getStoredVersion();
  if (!stored) setStoredVersion(APP_VERSION);
}
