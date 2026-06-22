const RESERVED_PREFIXES = ['0.', '127.', '169.254.', '224.', '240.', '255.'];

export function isPrivateIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1') return true;

  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;

  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1], 10);
    if (second >= 16 && second <= 31) return true;
  }

  if (ip.startsWith('fc') || ip.startsWith('fd')) return true;

  return false;
}

export function isReservedIp(ip: string): boolean {
  for (const prefix of RESERVED_PREFIXES) {
    if (ip.startsWith(prefix)) return true;
  }
  return false;
}
