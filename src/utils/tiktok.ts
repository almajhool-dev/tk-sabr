/** Strict local parsing: never fetch a user-supplied URL. */
export function cleanTikTokUsername(raw: unknown): string {
  if (typeof raw !== "string" || raw.length > 300) return "";
  let input = raw.trim();
  if (/^(https?:\/\/|(?:www\.)?tiktok\.com\/)/i.test(input)) {
    try {
      const url = new URL(
        input.startsWith("http") ? input : `https://${input}`,
      );
      if (
        url.protocol !== "https:" ||
        !["tiktok.com", "www.tiktok.com", "m.tiktok.com"].includes(
          url.hostname,
        ) ||
        url.port ||
        url.username ||
        url.password
      )
        return "";
      input = url.pathname.match(/^\/@([^/]+)(?:\/video\/\d+)?\/?$/)?.[1] || "";
    } catch {
      return "";
    }
  } else input = input.replace(/^@/, "");
  return isValidTikTokUsername(input) ? input : "";
}
export function isValidTikTokUsername(username: string): boolean {
  return (
    typeof username === "string" &&
    /^(?!.*\.$)[a-zA-Z0-9_.]{2,24}$/.test(username)
  );
}
/** Lifetime average likes/follower, NOT a sampled engagement rate. */
export function calculateEngagementRate(
  followers: number,
  likes: number,
  videos: number,
): number | null {
  return followers > 0 && videos > 0
    ? Math.round((likes / videos / followers) * 10000) / 100
    : null;
}
export function formatArabicNumber(num: number | null | undefined): string {
  if (num == null || !Number.isFinite(num)) return "البيانات غير متاحة";
  return new Intl.NumberFormat("ar", {
    notation: num >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(num);
}
