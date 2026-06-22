import { isPrivateIp, isReservedIp } from './ip-checker.util';

const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal', 'instance-data']);

const BLOCKED_PROTOCOLS = new Set(['file:', 'ftp:', 'gopher:', 'dict:', 'ldap:', 'jar:']);

/**
 * 验证代理 URL 是否安全（防 SSRF）。
 * 仅允许 http/https，禁止内网/保留地址和常见绕过手段。
 */
export function validateProxyUrl(
  rawUrl: string,
): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'URL 格式无效' };
  }

  if (BLOCKED_PROTOCOLS.has(url.protocol)) {
    return { ok: false, reason: `禁止的协议: ${url.protocol}` };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: `仅支持 http/https，当前: ${url.protocol}` };
  }

  const hostname = url.hostname.toLowerCase();

  if (BLOCKED_HOSTS.has(hostname)) {
    return { ok: false, reason: `禁止的主机名: ${hostname}` };
  }

  if (hostname === '[::1]' || hostname === '0.0.0.0') {
    return { ok: false, reason: `禁止的地址: ${hostname}` };
  }

  if (isPrivateIp(hostname) || isReservedIp(hostname)) {
    return { ok: false, reason: `禁止访问内网/保留地址: ${hostname}` };
  }

  if (rawUrl.includes('@') && !url.username) {
    return { ok: false, reason: 'URL 中包含可疑的 @ 字符' };
  }

  return { ok: true, url };
}
