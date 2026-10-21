import test from "node:test";
import assert from "node:assert/strict";
import {
  analyze,
  parseUsername,
  sourceSchema,
  ApiError,
} from "../backend/analysis.ts";
import { fetchAccount } from "../backend/provider.ts";
import { createApp } from "../backend/app.ts";
const account = () =>
  sourceSchema.parse({
    username: "creator",
    profile: {
      displayName: "Creator",
      bio: "Tech tutorials",
      avatarUrl: "https://example.com/a.jpg",
      followers: 100,
      following: 0,
      likes: 0,
      videos: 0,
    },
    videos: [],
  });
for (const value of [
  "creator",
  "@creator",
  "https://www.tiktok.com/@creator",
  "tiktok.com/@creator/video/123?lang=ar",
])
  test(`accept ${value}`, () =>
    assert.equal(parseUsername({ username: value }), "creator"));
for (const value of [
  null,
  {},
  123,
  "http://tiktok.com/@creator",
  "https://tiktok.com.evil.org/@creator",
  "https://evil.org/tiktok.com/@creator",
  "https://tiktok.com/@creator/extra",
  "@@creator",
  "bad-user",
  "user.",
  "https://127.0.0.1/@creator",
])
  test(`reject ${JSON.stringify(value)}`, () =>
    assert.throws(() => parseUsername({ username: value }), ApiError));
test("missing statistics stay null; zero remains zero; no unsupported score", () => {
  const d = sourceSchema.parse({ username: "creator", profile: {} });
  assert.equal(d.profile.followers, null);
  assert.equal(analyze(d).estimatedAccountScore, null);
  assert.equal(analyze(d).engagementRate, null);
  assert.equal(account().profile.following, 0);
  assert.ok(analyze(account()).issues.some((i) => i.type === "fact"));
});
test("private account never receives score", () => {
  const d = account();
  d.profile.private = true;
  assert.equal(analyze(d).estimatedAccountScore, null);
});
test("engagement uses only complete sampled video metrics", () => {
  const d = account();
  d.videos = [
    {
      id: "1",
      title: null,
      thumbnailUrl: null,
      views: 100,
      likes: 20,
      comments: 5,
      shares: 5,
      publishedAt: null,
    },
  ];
  assert.equal(analyze(d).engagementRate, 30);
  d.videos[0].comments = null;
  assert.equal(analyze(d).engagementRate, null);
});
test("no API credentials fails explicitly", async () => {
  await assert.rejects(
    fetchAccount("creator", {}),
    (e) => e instanceof ApiError && e.status === 503,
  );
});
const env = {
  DATA_PROVIDER_URL: "https://licensed.example/data",
  DATA_PROVIDER_KEY: "test-only",
  DATA_PROVIDER_AUTHORIZED: "true",
  DATA_PROVIDER_NAME: "Contracted provider",
};
test("provider missing/nonexistent/rate limit/failure/timeout are distinct", async () => {
  for (const status of [404, 429, 500])
    await assert.rejects(
      fetchAccount("creator", env, async () => new Response("{}", { status })),
      (e) =>
        e instanceof ApiError && e.status === (status === 500 ? 502 : status),
    );
  await assert.rejects(
    fetchAccount("creator", env, async () => {
      throw new DOMException("timeout", "TimeoutError");
    }),
    (e) => e instanceof ApiError && e.status === 504,
  );
});
test("provider contract validated and username cannot be substituted", async () => {
  await assert.rejects(
    fetchAccount("creator", env, async () =>
      Response.json({ ...account(), username: "different" }),
    ),
    ApiError,
  );
  await assert.rejects(
    fetchAccount("creator", env, async () =>
      Response.json({ ...account(), profile: { followers: -1 } }),
    ),
    ApiError,
  );
});
test("API routes, invalid bodies, CORS, cache, rate limit and admin denial", async () => {
  let calls = 0;
  const app = createApp({ ...env, RATE_LIMIT_PER_MINUTE: "10" }, async () => {
    calls++;
    return Response.json(account());
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const addr = server.address() as any;
  const base = `http://127.0.0.1:${addr.port}`;
  try {
    const post = (path: string, body: any) =>
      fetch(base + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    assert.equal(
      (await post("/api/tiktok/analyze", { username: {} })).status,
      400,
    );
    assert.equal(
      (
        await fetch(base + "/api/health", {
          headers: { Origin: "https://evil.org" },
        })
      ).status,
      403,
    );
    const one = await post("/api/tiktok/analyze", { username: "creator" });
    assert.equal(one.status, 200);
    assert.equal((await one.json()).profile.followers, 100);
    await post("/api/tiktok/analyze", { username: "@creator" });
    assert.equal(calls, 1);
    const report = await post("/api/reports/generate", { username: "creator" });
    assert.equal((await report.json()).report.type, "rules");
    assert.equal((await fetch(base + "/api/admin/overview")).status, 503);
    for (let i = 0; i < 11; i++) await fetch(base + "/api/health");
    assert.equal((await fetch(base + "/api/health")).status, 429);
  } finally {
    await new Promise<void>((r, e) => server.close((x) => (x ? e(x) : r())));
  }
});
test("verified sessions: anonymous and normal user cannot administer, owner filters applied", async () => {
  const queries: any[] = [];
  const db = {
    auth: {
      getUser: async (token: string) =>
        token === "valid"
          ? { data: { user: { id: "owner-a" } }, error: null }
          : { data: { user: null }, error: {} },
    },
    from: (table: string) => {
      const q: any = {
        table,
        filters: [],
        select() {
          return this;
        },
        eq(k: string, v: string) {
          this.filters.push([k, v]);
          return this;
        },
        gt() {
          return this;
        },
        order() {
          return this;
        },
        limit() {
          queries.push(this);
          return Promise.resolve({ data: [], error: null });
        },
        maybeSingle() {
          return Promise.resolve({ data: null, error: null });
        },
      };
      return q;
    },
  };
  const server = createApp({}, fetch, db).listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  try {
    assert.equal((await fetch(base + "/api/admin/overview")).status, 401);
    assert.equal(
      (
        await fetch(base + "/api/admin/overview", {
          headers: { Authorization: "Bearer invalid" },
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await fetch(base + "/api/admin/overview", {
          headers: { Authorization: "Bearer valid" },
        })
      ).status,
      403,
    );
    const r = await fetch(base + "/api/reports?user_id=victim", {
      headers: { Authorization: "Bearer valid" },
    });
    assert.equal(r.status, 200);
    assert.deepEqual(queries[0].filters, [["user_id", "owner-a"]]);
    assert.equal(
      (
        await fetch(base + "/api/admin/settings", {
          method: "POST",
          headers: {
            Authorization: "Bearer valid",
            "Content-Type": "application/json",
          },
          body: '{"enabled":false,"maintenance":true}',
        })
      ).status,
      403,
    );
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
});
test("admin settings validate limits and update the active limiter", async () => {
  const updates: any[] = [];
  const db = {
    auth: {
      getUser: async () => ({ data: { user: { id: "admin" } }, error: null }),
    },
    from: (table: string) => ({
      select() {
        return this;
      },
      eq() {
        return this;
      },
      maybeSingle: async () => ({ data: { uid: "admin" }, error: null }),
      update(value: any) {
        updates.push(value);
        return { eq: async () => ({ error: null }) };
      },
    }),
  };
  const server = createApp({}, fetch, db).listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  try {
    const post = (body: any) =>
      fetch(base + "/api/admin/settings", {
        method: "POST",
        headers: {
          Authorization: "Bearer valid",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    assert.equal(
      (
        await post({
          enabled: true,
          maintenance: false,
          scan_limit_per_minute: 0,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await post({
          enabled: true,
          maintenance: false,
          scan_limit_per_minute: 2,
        })
      ).status,
      200,
    );
    assert.equal(updates[0].scan_limit_per_minute, 2);
    assert.equal((await fetch(base + "/api/health")).status, 429);
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
});
