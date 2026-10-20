/**
 * Utility functions for TikTok username sanitation and number formatting
 */

/**
 * Cleans user input to extract clean TikTok username
 * Handles:
 * - "@username"
 * - "username"
 * - "https://www.tiktok.com/@username"
 * - "https://tiktok.com/@username?lang=ar"
 * - "tiktok.com/@username/video/123"
 */
export function cleanTikTokUsername(rawInput: string): string {
  if (!rawInput) return '';
  let input = rawInput.trim();

  // If full or partial URL
  if (input.includes('tiktok.com/')) {
    try {
      // Check for /@username
      const atMatch = input.match(/@([a-zA-Z0-9_.-]+)/);
      if (atMatch && atMatch[1]) {
        return atMatch[1].replace(/[^a-zA-Z0-9_.-]/g, '');
      }
      // Or check path segment after tiktok.com/
      const urlParts = input.split('tiktok.com/');
      if (urlParts[1]) {
        const seg = urlParts[1].split('/')[0].split('?')[0];
        return seg.replace(/^@/, '').replace(/[^a-zA-Z0-9_.-]/g, '');
      }
    } catch {
      // fallback
    }
  }

  // Strip leading '@'
  input = input.replace(/^@+/, '');

  // Strip query params or trailing slashes
  input = input.split('?')[0].split('/')[0];

  return input.trim();
}

/**
 * Validates TikTok username format
 * TikTok usernames typically: 2-24 chars, letters, numbers, underscores, periods.
 */
export function isValidTikTokUsername(username: string): boolean {
  if (!username || username.length < 2 || username.length > 24) {
    return false;
  }
  // TikTok allows letters, numbers, underscores, and periods (cannot end with a period)
  const regex = /^[a-zA-Z0-9_][a-zA-Z0-9_.-]{0,22}[a-zA-Z0-9_]$/;
  return regex.test(username);
}

/**
 * Calculate engagement rate for TikTok account
 */
export function calculateEngagementRate(
  followers: number,
  likes: number,
  videos: number
): number {
  if (!followers || followers <= 0) return 0;
  // If video count is known, avg likes per video / followers * 100
  if (videos > 0) {
    const avgLikes = likes / videos;
    const rate = (avgLikes / followers) * 100;
    return Math.min(100, Math.round(rate * 10) / 10);
  }
  // Approximate based on total likes to followers ratio
  const rawRatio = (likes / (followers * 10)) * 100;
  return Math.min(100, Math.max(0.1, Math.round(rawRatio * 10) / 10));
}

/**
 * Formats numbers into human-readable Arabic abbreviations
 */
export function formatArabicNumber(num: number): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  const val = Math.abs(num);
  if (val >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toFixed(1)} مليار`;
  }
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(1)} مليون`;
  }
  if (val >= 1_000) {
    return `${(val / 1_000).toFixed(1)} ألف`;
  }
  return val.toLocaleString('en-US');
}
