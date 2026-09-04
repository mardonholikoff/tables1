/**
 * Client IP address detection service
 * Safely fetches the client's public IP address with caching and fallbacks.
 */

let cachedClientIp: string | null = null;

export async function fetchClientIp(): Promise<string> {
  if (cachedClientIp) {
    return cachedClientIp;
  }

  // Check sessionStorage first
  try {
    const saved = sessionStorage.getItem('daewoo_client_ip');
    if (saved && saved.length > 6) {
      cachedClientIp = saved;
      return saved;
    }
  } catch (e) {
    // ignore
  }

  // Try ipify
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        cachedClientIp = data.ip;
        try {
          sessionStorage.setItem('daewoo_client_ip', data.ip);
        } catch (err) {}
        return data.ip;
      }
    }
  } catch (e) {
    // Try secondary fallback (api64)
    try {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 2500);
      const res2 = await fetch('https://api64.ipify.org?format=json', {
        signal: controller2.signal,
      });
      clearTimeout(timeoutId2);
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2 && data2.ip) {
          cachedClientIp = data2.ip;
          try {
            sessionStorage.setItem('daewoo_client_ip', data2.ip);
          } catch (err) {}
          return data2.ip;
        }
      }
    } catch (e2) {
      // offline or unreachable
    }
  }

  // Fallback if network blocked / offline
  const fallbackIp = '192.168.1.' + (Math.floor(Math.random() * 80) + 20);
  cachedClientIp = fallbackIp;
  return fallbackIp;
}

export function getCachedClientIp(): string {
  if (cachedClientIp) return cachedClientIp;
  try {
    const saved = sessionStorage.getItem('daewoo_client_ip');
    if (saved) {
      cachedClientIp = saved;
      return saved;
    }
  } catch (e) {}
  return '192.168.1.45';
}
