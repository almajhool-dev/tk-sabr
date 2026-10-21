import { ApiError, sourceSchema, type AccountData } from "./analysis.ts";
type Env = Record<string, string | undefined>;
export async function requestJSON(
  url: string,
  init: RequestInit = {},
  fetcher: typeof fetch = fetch,
  retry = true,
) {
  try {
    const r = await fetcher(url, {
      ...init,
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    if (r.status === 429)
      throw new ApiError(
        429,
        "PROVIDER_RATE_LIMIT",
        "مزود البيانات بلغ حد الطلبات؛ حاول لاحقاً.",
      );
    if (r.status === 404)
      throw new ApiError(404, "NOT_FOUND", "المصدر أفاد أن الحساب غير موجود.");
    if (r.status >= 500 && retry) return requestJSON(url, init, fetcher, false);
    if (!r.ok)
      throw new ApiError(
        502,
        "PROVIDER_FAILURE",
        "تعذر الوصول إلى مزود البيانات المصرح به.",
      );
    const raw = await r.text();
    if (raw.length > 1_000_000) throw new Error("oversized");
    return JSON.parse(raw);
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(
      (e as Error).name === "TimeoutError" ? 504 : 502,
      "UPSTREAM_UNAVAILABLE",
      "انتهت المهلة أو فشل الاتصال بمزود البيانات.",
    );
  }
}
export async function fetchAccount(
  username: string,
  env: Env,
  fetcher: typeof fetch = fetch,
): Promise<AccountData & { dataSource: string }> {
  if (
    env.DATA_PROVIDER_URL &&
    env.DATA_PROVIDER_KEY &&
    env.DATA_PROVIDER_AUTHORIZED === "true"
  ) {
    const url = new URL(env.DATA_PROVIDER_URL);
    if (
      url.protocol !== "https:" ||
      !env.DATA_PROVIDER_NAME ||
      ["localhost", "127.0.0.1", "::1"].includes(url.hostname)
    )
      throw new ApiError(
        503,
        "PROVIDER_CONFIG",
        "إعداد مصدر البيانات غير مكتمل.",
      );
    const raw = await requestJSON(
      url.href,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.DATA_PROVIDER_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      },
      fetcher,
    );
    const parsed = sourceSchema.safeParse(raw);
    if (!parsed.success || parsed.data.username.toLowerCase() !== username)
      throw new ApiError(
        502,
        "INVALID_PROVIDER_DATA",
        "مزود البيانات أعاد بيانات غير متوافقة أو لحساب مختلف.",
      );
    return { ...parsed.data, dataSource: env.DATA_PROVIDER_NAME };
  }
  // Official Display API: only the account whose owner granted this access token.
  if (!env.TIKTOK_ACCESS_TOKEN)
    throw new ApiError(
      503,
      "DATA_SOURCE_NOT_CONFIGURED",
      "الفحص غير مفعّل: يحتاج الموقع مزود بيانات مخوّلاً أو موافقة صاحب الحساب عبر TikTok الرسمي. لا نعرض نتائج وهمية.",
    );
  const headers = { Authorization: `Bearer ${env.TIKTOK_ACCESS_TOKEN}` };
  const fields =
    "username,display_name,avatar_url,bio_description,is_verified,follower_count,following_count,likes_count,video_count";
  const result = await requestJSON(
    `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`,
    { headers },
    fetcher,
  );
  if (result.error?.code !== "ok")
    throw new ApiError(
      502,
      "TIKTOK_AUTHORIZATION",
      "تحقق من صلاحيات TikTok وانتهاء صلاحية الموافقة.",
    );
  const u = result.data?.user;
  if (!u?.username || u.username.toLowerCase() !== username)
    throw new ApiError(
      403,
      "OWNER_CONSENT_REQUIRED",
      "هذه الموافقة تخص حساباً آخر. فحص أي يوزر يحتاج مزوداً مخولاً يدعم ذلك.",
    );
  let videos: unknown[] = [];
  if (env.TIKTOK_VIDEO_SCOPE === "true") {
    const v = await requestJSON(
      "https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,create_time,view_count,like_count,comment_count,share_count",
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ max_count: 20 }),
      },
      fetcher,
    );
    if (v.error?.code === "ok")
      videos = (v.data?.videos || []).map((x: any) => ({
        id: x.id,
        title: x.title ?? null,
        thumbnailUrl: x.cover_image_url ?? null,
        views: x.view_count ?? null,
        likes: x.like_count ?? null,
        comments: x.comment_count ?? null,
        shares: x.share_count ?? null,
        publishedAt: x.create_time
          ? new Date(x.create_time * 1000).toISOString()
          : null,
      }));
  }
  const normalized = sourceSchema.safeParse({
    username,
    profile: {
      displayName: u.display_name ?? null,
      avatarUrl: u.avatar_url ?? null,
      bio: u.bio_description ?? null,
      verified: u.is_verified ?? null,
      followers: u.follower_count ?? null,
      following: u.following_count ?? null,
      likes: u.likes_count ?? null,
      videos: u.video_count ?? null,
    },
    videos,
  });
  if (!normalized.success)
    throw new ApiError(
      502,
      "INVALID_PROVIDER_DATA",
      "بيانات المصدر غير صالحة.",
    );
  return {
    ...normalized.data,
    dataSource: "TikTok Display API — owner consent",
  };
}
