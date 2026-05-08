// Safe JWT payload decoder for React Native
// atob is available in RN 0.72+ via Hermes, this is a safe fallback
export function decodeJwtPayload(token: string): Record<string, any> {
  try {
    const base64 = token.split('.')[1];
    // Normalize base64 padding
    const padded = base64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4;
    const normalized = pad ? padded + '==='.slice(0, 4 - pad) : padded;

    // Try native atob first (RN 0.72+)
    if (typeof atob === 'function') {
      return JSON.parse(atob(normalized));
    }

    // Fallback: manual base64 decode
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    while (i < normalized.length) {
      const a = chars.indexOf(normalized[i++]);
      const b = chars.indexOf(normalized[i++]);
      const c = chars.indexOf(normalized[i++]);
      const d = chars.indexOf(normalized[i++]);
      result += String.fromCharCode((a << 2) | (b >> 4));
      if (c !== 64) result += String.fromCharCode(((b & 0xf) << 4) | (c >> 2));
      if (d !== 64) result += String.fromCharCode(((c & 0x3) << 6) | d);
    }
    return JSON.parse(decodeURIComponent(escape(result)));
  } catch {
    return {};
  }
}
