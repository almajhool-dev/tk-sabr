import React, { lazy, Suspense, useEffect, useState } from "react";
import { CyberBackground } from "./components/CyberBackground.tsx";
import { watchAuth, logout, firebaseConfigured } from "./utils/firebaseAuth.ts";
import { api } from "./utils/api.ts";
import { cleanTikTokUsername } from "./utils/tiktok.ts";
import type { UserAccount } from "./types/index.ts";
const Results = lazy(() =>
  import("./components/Results.tsx").then((m) => ({ default: m.Results })),
);
const AuthModal = lazy(() =>
  import("./components/AuthModal.tsx").then((m) => ({ default: m.AuthModal })),
);
function SavedReports({ onLoad }: { onLoad: (r: any) => void }) {
  const [items, setItems] = useState<any[]>([]),
    [error, setError] = useState("");
  const load = () =>
    api("/api/reports")
      .then((d) => setItems(d.reports))
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  return (
    <section className="panel p-6 space-y-4">
      <h2 className="text-xl">التقارير المحفوظة / Saved reports</h2>
      {error && <p role="alert">{error}</p>}
      {items.length === 0 && <p>لا توجد تقارير متاحة / No reports available</p>}
      {[...new Set(items.map((r) => r.username))].map((name) => {
        const pair = items.filter((r) => r.username === name).slice(0, 2);
        if (pair.length < 2) return null;
        return (
          <article className="stat" key={name}>
            <h3>@{name} — مقارنة آخر تقريرين محفوظين</h3>
            <p className="text-xs text-slate-400 mt-2">
              {pair[1].result.fetchedAt} → {pair[0].result.fetchedAt}
            </p>
            <div className="flex flex-wrap gap-5 mt-3">
              {["followers", "likes", "videos"].map((k) => {
                const current = pair[0].result.profile[k],
                  previous = pair[1].result.profile[k];
                return (
                  <span key={k}>
                    {k}:{" "}
                    {current === null || previous === null
                      ? "غير متاح"
                      : current - previous}
                  </span>
                );
              })}
            </div>
          </article>
        );
      })}
      {items.map((r) => (
        <div className="stat flex justify-between gap-3" key={r.id}>
          <button onClick={() => onLoad(r.result)}>
            @{r.username} — {new Date(r.created_at).toLocaleDateString()}
          </button>
          <button
            className="button"
            onClick={async () => {
              try {
                await api(`/api/reports/${r.id}`, undefined, "DELETE");
                await load();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            حذف / Delete
          </button>
        </div>
      ))}
    </section>
  );
}
function Admin() {
  const [d, setD] = useState<any>(null),
    [error, setError] = useState("");
  const load = () =>
    api("/api/admin/overview")
      .then(setD)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  return (
    <section className="panel p-6 space-y-5">
      <h2 className="text-xl">لوحة الإدارة / Admin</h2>
      {error && <p role="alert">{error}</p>}
      {d && (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            {Object.entries({ ...d.stats, ...d.counts }).map(([k, v]) => (
              <div key={k} className="stat">
                {k}: {String(v)}
              </div>
            ))}
          </div>
          <p>
            المصدر {d.provider ? "مهيأ" : "غير مهيأ"} · AI{" "}
            {d.ai ? "مهيأ" : "غير مهيأ"}
          </p>
          <p className="text-xs text-slate-400">
            عدادات الطلبات منذ آخر تشغيل للخادم؛ لا تعني اختبار اتصال المزود.
          </p>
          <label className="flex flex-wrap gap-3 items-center">
            حد الطلبات لكل دقيقة لكل عنوان اتصال
            <input
              type="number"
              min="1"
              max="120"
              className="bg-slate-900 border border-slate-600 p-2 rounded w-24"
              defaultValue={d.settings.scan_limit_per_minute || 20}
              onBlur={async (e) => {
                try {
                  await api("/api/admin/settings", {
                    enabled: d.settings.enabled,
                    maintenance: d.settings.maintenance,
                    scan_limit_per_minute: Number(e.target.value),
                  });
                  await load();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            />
          </label>
          {d.recentErrors?.length > 0 && (
            <details>
              <summary>سجل الأخطاء المختصر</summary>
              <ul className="text-xs space-y-2 mt-3">
                {d.recentErrors.map((x: any, i: number) => (
                  <li key={i}>
                    {x.time} · {x.code} · HTTP {x.status}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {["enabled", "maintenance"].map((k) => (
            <label className="flex gap-3" key={k}>
              <input
                type="checkbox"
                checked={d.settings[k]}
                onChange={async (e) => {
                  try {
                    await api("/api/admin/settings", {
                      enabled: d.settings.enabled,
                      maintenance: d.settings.maintenance,
                      [k]: e.target.checked,
                    });
                    await load();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              />
              {k === "enabled" ? "تفعيل الفحص" : "وضع الصيانة"}
            </label>
          ))}
        </>
      )}
    </section>
  );
}
export default function App() {
  const [english, setEnglish] = useState(false),
    [reduced, setReduced] = useState(
      () =>
        localStorage.getItem("reduced-motion") === "true" ||
        matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState<any>(null),
    [user, setUser] = useState<UserAccount | null>(null),
    [authOpen, setAuthOpen] = useState(false),
    [view, setView] = useState("scanner"),
    [health, setHealth] = useState<any>(null);
  const t = (ar: string, en: string) => (english ? en : ar);
  useEffect(() => watchAuth(setUser), []);
  useEffect(() => {
    document.documentElement.lang = english ? "en" : "ar";
    document.documentElement.dir = english ? "ltr" : "rtl";
  }, [english]);
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduced);
    localStorage.setItem("reduced-motion", String(reduced));
  }, [reduced]);
  useEffect(() => {
    api("/api/health")
      .then(setHealth)
      .catch(() => setHealth({ offline: true }));
  }, []);
  async function scan(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const username = cleanTikTokUsername(input);
    if (!username) {
      setError(
        t(
          "أدخل يوزراً صحيحاً أو رابط حساب TikTok الكامل.",
          "Enter a valid username or full TikTok profile URL.",
        ),
      );
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await api("/api/tiktok/analyze", { username }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen relative">
      <CyberBackground reduced={reduced} />
      <header className="relative z-10 border-b border-slate-800/60">
        <nav
          className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between gap-4 flex-wrap"
          aria-label="Main"
        >
          <button
            className="font-black text-2xl tracking-wider"
            onClick={() => setView("scanner")}
            dir="ltr"
          >
            TK<span className="text-cyan-300">_</span>SABR
            <span className="text-cyan-300 text-xs align-top"> ◇</span>
          </button>
          <div className="flex flex-wrap gap-3 items-center text-xs sm:text-sm">
            <button className="button" onClick={() => setEnglish(!english)}>
              {english ? "العربية" : "English"}
            </button>
            <button
              className="button"
              aria-pressed={reduced}
              onClick={() => setReduced(!reduced)}
            >
              {t(
                reduced ? "تشغيل الحركة" : "تقليل الحركة",
                reduced ? "Enable motion" : "Reduce motion",
              )}
            </button>
            {user ? (
              <>
                <button className="button" onClick={() => setView("saved")}>
                  {t("تقاريري", "My reports")}
                </button>
                {user.role === "admin" && (
                  <button className="button" onClick={() => setView("admin")}>
                    {t("الإدارة", "Admin")}
                  </button>
                )}
                <button
                  className="button"
                  onClick={async () => {
                    await logout();
                    setView("scanner");
                  }}
                >
                  {t("خروج", "Sign out")}
                </button>
              </>
            ) : firebaseConfigured ? (
              <button className="button" onClick={() => setAuthOpen(true)}>
                {t("تسجيل الدخول", "Sign in")}
              </button>
            ) : (
              <span className="text-slate-500">
                {t("الدخول غير مهيأ", "Sign-in not configured")}
              </span>
            )}
          </div>
        </nav>
      </header>
      <main className="relative z-10 max-w-6xl mx-auto px-5 pb-16">
        {view === "scanner" ? (
          <>
            <section className="max-w-3xl mx-auto pt-16 sm:pt-24 pb-14 text-center intro">
              <p
                className="text-xs tracking-[.15em] text-cyan-300 mb-6"
                dir="ltr"
              >
                PUBLIC DATA · CLEAR INSIGHTS
              </p>
              <h1 className="text-4xl sm:text-6xl font-black leading-[1.45]">
                {t("محلل حسابات TikTok", "TikTok account analytics")}
                <br />
                <span className="text-cyan-300">
                  {t("الذكي", "with clarity.")}
                </span>
              </h1>
              <p className="text-slate-400 mt-6 max-w-xl mx-auto leading-8">
                {t(
                  "افهم البيانات المتاحة لحسابك، واكتشف فرص تطوير محتواك. نتائج من مصدر مخوّل، وتوصيات واضحة بحدود معلنة.",
                  "Understand available account data and discover opportunities to improve your content. Authorized sources, transparent limits.",
                )}
              </p>
              <form
                className="panel p-5 sm:p-7 mt-9 text-start"
                onSubmit={scan}
              >
                <label htmlFor="username" className="block text-sm mb-3">
                  {t("أدخل يوزر حساب تيك توك", "Enter a TikTok username")}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    id="username"
                    dir="ltr"
                    className="min-w-0 flex-1 bg-slate-950 border border-slate-700 rounded-xl p-4 outline-none focus:border-cyan-300"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={300}
                    disabled={busy}
                    placeholder="@username · https://www.tiktok.com/@username"
                    autoComplete="off"
                  />
                  <button className="button primary px-6" disabled={busy}>
                    {busy
                      ? t("جاري الفحص…", "Analyzing…")
                      : t("ابدأ فحص الحساب", "Analyze account")}{" "}
                    <span aria-hidden="true">↗</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  {t(
                    "اليوزر أو @ أو رابط الحساب الكامل. لا نطلب كلمة مرور TikTok.",
                    "Username, @handle or full profile URL. No TikTok password required.",
                  )}
                </p>
                {busy && (
                  <div
                    className="flex items-center justify-center gap-3 p-5 text-cyan-300"
                    role="status"
                  >
                    <span className="spinner" />
                    {t(
                      "التحقق من اليوزر وطلب البيانات المصرح بها…",
                      "Validating username and requesting authorized data…",
                    )}
                  </div>
                )}
                {error && (
                  <p
                    role="alert"
                    className="mt-5 p-4 rounded-xl bg-amber-950/30 border border-amber-600/30 text-amber-200 leading-7"
                  >
                    {error}
                  </p>
                )}
              </form>
              {health && (
                <p className="mt-5 text-xs text-slate-400" role="status">
                  {health.offline
                    ? t(
                        "الخادم غير متصل أو عنوانه غير مضبوط.",
                        "Backend unreachable or not configured.",
                      )
                    : health.dataConfigured
                      ? t(
                          "مصدر البيانات مهيأ؛ الوصول يعتمد على صلاحياته.",
                          "Data source configured; access depends on its permissions.",
                        )
                      : t(
                          "الفحص بانتظار إعداد مصدر بيانات مخوّل. لا توجد نتائج تجريبية.",
                          "Analysis awaits an authorized data source. No simulated results.",
                        )}
                </p>
              )}
            </section>
            {result ? (
              <Suspense
                fallback={
                  <p role="status">
                    {t("تحضير النتائج…", "Preparing results…")}
                  </p>
                }
              >
                <Results
                  key={result.username + result.fetchedAt}
                  data={result}
                  english={english}
                  signedIn={!!user}
                  onReset={() => {
                    setResult(null);
                    setInput("");
                    document.getElementById("username")?.focus();
                  }}
                />
              </Suspense>
            ) : (
              <section className="grid sm:grid-cols-3 gap-4 mb-10">
                {[
                  [
                    t("01 / بيانات حقيقية", "01 / Real data"),
                    t(
                      "القيمة المفقودة تبقى غير متاحة، ولا تتحول إلى صفر.",
                      "Missing values stay unavailable, never fabricated.",
                    ),
                  ],
                  [
                    t("02 / تحليل مفهوم", "02 / Transparent analysis"),
                    t(
                      "نوضح مصدر الأرقام وطريقة حساب التفاعل وحدود العينة.",
                      "Clear provenance, formulas and sample limitations.",
                    ),
                  ],
                  [
                    t("03 / خصوصية أولاً", "03 / Privacy first"),
                    t(
                      "الحفظ اختياري للحساب المسجل؛ والتقارير خاصة بصاحبها.",
                      "Optional saving for signed-in users, with private reports.",
                    ),
                  ],
                ].map(([h, p]) => (
                  <article className="panel p-6" key={h}>
                    <h2 className="font-bold text-cyan-200 text-sm">{h}</h2>
                    <p className="text-slate-400 text-sm mt-4 leading-7">{p}</p>
                  </article>
                ))}
              </section>
            )}
          </>
        ) : view === "admin" ? (
          <div className="py-12">
            <Admin />
          </div>
        ) : user ? (
          <div className="py-12">
            <SavedReports
              onLoad={(r) => {
                setResult(r);
                setView("scanner");
              }}
            />
          </div>
        ) : null}
      </main>
      <footer className="relative z-10 border-t border-slate-800/60 text-center px-5 py-8 text-xs text-slate-400 print:hidden">
        <p>
          {t(
            "نسبة أمان الحساب تقييم تقديري للمؤشرات العامة؛ لا يكشف الاختراق أو عقوبات TikTok.",
            "Account safety is an estimated public indicator, not a compromise or penalty detector.",
          )}
        </p>
        <p className="mt-4 text-cyan-200">
          {t(
            "تم التطوير بواسطة المبرمج المجهول",
            "Developed by المبرمج المجهول",
          )}{" "}
          · TK_SABR
        </p>
      </footer>
      {authOpen && (
        <Suspense fallback={<p role="status">Loading…</p>}>
          <AuthModal
            isOpen={authOpen}
            onClose={() => setAuthOpen(false)}
            onLoginSuccess={(u) => {
              setUser(u);
              setAuthOpen(false);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
