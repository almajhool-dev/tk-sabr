import React, { useState } from "react";
import { formatArabicNumber as number } from "../utils/tiktok.ts";
import { api } from "../utils/api.ts";
export function Results({
  data,
  english = false,
  signedIn = false,
  onReset,
}: {
  data: any;
  english?: boolean;
  signedIn?: boolean;
  onReset: () => void;
}) {
  const [report, setReport] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const p = data.profile,
    a = data.analysis,
    url = `https://www.tiktok.com/@${data.username}`;
  const t = (ar: string, en: string) => (english ? en : ar);
  async function generate() {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      setReport(
        (await api("/api/reports/generate", { username: data.username }))
          .report,
      );
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    try {
      await api("/api/reports", { username: data.username });
      setNotice(t("تم حفظ التقرير", "Report saved"));
    } catch (e) {
      setNotice((e as Error).message);
    }
  }
  return (
    <section
      id="results"
      className="results space-y-6"
      aria-label={t("نتائج الفحص", "Analysis results")}
    >
      <article className="panel p-6 sm:p-8">
        <div className="flex flex-wrap gap-5 items-center">
          {p.avatarUrl && (
            <img
              src={p.avatarUrl}
              alt={t("صورة الحساب الأصلية", "Original account avatar")}
              width="80"
              height="80"
              referrerPolicy="no-referrer"
              className="rounded-2xl object-cover"
              onError={(e) => {
                e.currentTarget.hidden = true;
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-cyan-300 text-xs">{data.dataSource}</p>
            <h2 className="text-2xl font-bold mt-2">
              {p.displayName ?? t("الاسم غير متاح", "Name unavailable")}{" "}
              {p.verified === true && "✓"}
            </h2>
            <a
              className="text-cyan-300"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              @{data.username} ↗
            </a>
          </div>
          <p className="text-xs text-slate-400">
            {new Date(data.fetchedAt).toLocaleString(english ? "en" : "ar-IQ")}
          </p>
        </div>
        <p className="my-5 whitespace-pre-wrap break-words text-slate-300">
          {p.bio ?? t("الوصف غير متاح", "Bio unavailable")}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            [t("المتابعون", "Followers"), p.followers],
            [t("المتابَعون", "Following"), p.following],
            [t("الإعجابات", "Likes"), p.likes],
            [t("الفيديوهات", "Videos"), p.videos],
          ].map(([label, value]) => (
            <div key={label as string} className="stat">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-xl mt-2 font-bold">
                {value === null
                  ? t("البيانات غير متاحة", "Unavailable")
                  : number(value as number)}
              </p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-6 print:hidden">
          <button
            className="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setNotice(t("تم نسخ الرابط", "Link copied"));
              } catch {
                setNotice(
                  t(
                    "تعذر النسخ؛ استخدم رابط الحساب أعلاه",
                    "Copy failed; use profile link above",
                  ),
                );
              }
            }}
          >
            {t("نسخ الرابط", "Copy link")}
          </button>
          <button className="button" onClick={() => window.print()}>
            {t("تنزيل PDF عبر الطباعة", "Save PDF via print")}
          </button>
          {signedIn && (
            <button className="button" onClick={save}>
              {t("حفظ التقرير", "Save report")}
            </button>
          )}
          <button className="button" onClick={onReset}>
            {t("فحص حساب آخر", "Another account")}
          </button>
        </div>
      </article>
      <div className="grid md:grid-cols-2 gap-6">
        <article className="panel p-6">
          <h3 className="text-lg font-bold">
            {t("نسبة أمان الحساب", "Account safety score")}
          </h3>
          <div
            className="gauge"
            style={
              {
                "--score": `${a.estimatedAccountScore ?? 0}%`,
              } as React.CSSProperties
            }
          >
            <strong>
              {a.estimatedAccountScore === null
                ? "—"
                : `${a.estimatedAccountScore}%`}
            </strong>
          </div>
          <p className="text-sm text-slate-300">
            {a.estimatedAccountScore === null
              ? t(
                  "البيانات غير كافية لعرض درجة رقمية",
                  "Insufficient data for a score",
                )
              : t(
                  "تقدير لمؤشرات الملف العامة",
                  "Estimated public profile indicators",
                )}
          </p>
          <p className="text-xs text-slate-400 mt-3">{a.scoreDisclaimer}</p>
          <ul className="mt-4 space-y-2">
            {a.factors.map((f: any) => (
              <li key={f.name} className="flex justify-between text-sm">
                <span>{f.name}</span>
                <span>
                  {f.points}/{f.max}
                </span>
              </li>
            ))}
          </ul>
        </article>
        <article className="panel p-6">
          <h3 className="text-lg font-bold">
            {t("تفاعل العينة المتاحة", "Available sample engagement")}
          </h3>
          <p className="text-4xl text-cyan-300 mt-8">
            {a.engagementRate === null ? "—" : `${a.engagementRate}%`}
          </p>
          <p className="text-xs text-slate-400 mt-4" dir="ltr">
            (Likes + comments + shares) / views × 100
          </p>
          <p className="text-sm mt-4">
            {t(
              "عدد الفيديوهات المكتملة المقاييس:",
              "Videos with complete metrics:",
            )}{" "}
            {a.sampleSize}
          </p>
          <p className="text-sm mt-3">
            {t(
              "متوسط الفاصل بين تواريخ المنشورات المتاحة بالأيام:",
              "Average gap between available publication dates (days):",
            )}{" "}
            {a.averagePostingGapDays === null
              ? "—"
              : a.averagePostingGapDays.toFixed(1)}
          </p>
          <p className="text-xs text-slate-400 mt-5">
            {t(
              "العينة لا تمثل كامل تاريخ الحساب. لا نستنتج العقوبات أو أصالة المتابعين من الأعداد.",
              "The sample does not represent full account history. Counts cannot establish penalties or follower authenticity.",
            )}
          </p>
        </article>
      </div>
      <article className="panel p-6">
        <h3 className="text-lg font-bold mb-5">
          {t("المشكلات والملاحظات المكتشفة", "Findings and observations")}
        </h3>
        {a.issues.length === 0 ? (
          <p>
            {t(
              "لا توجد ملاحظات ضمن القواعد المحدودة المتاحة. هذا لا يثبت سلامة الحساب.",
              "No findings under available rules. This does not establish account security.",
            )}
          </p>
        ) : (
          a.issues.map((i: any, index: number) => (
            <div key={index} className="stat mb-3">
              <small className="text-cyan-300">
                {i.type === "fact"
                  ? t("حقيقة من المصدر", "Source fact")
                  : i.type === "estimate"
                    ? t("تقدير", "Estimate")
                    : t("حدود البيانات", "Data limitation")}
              </small>
              <h4 className="my-2 font-bold">{i.title}</h4>
              <p className="text-sm text-slate-300">{i.recommendation}</p>
            </div>
          ))
        )}
      </article>
      {data.videos.length > 0 && (
        <article className="panel p-6">
          <h3 className="text-lg font-bold mb-5">
            {t("الفيديوهات المتاحة", "Available videos")}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.videos.map((v: any) => (
              <div className="stat" key={v.id}>
                {v.thumbnailUrl && (
                  <img
                    loading="lazy"
                    src={v.thumbnailUrl}
                    alt={v.title || ""}
                    referrerPolicy="no-referrer"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
                <p className="mt-3 break-words">{v.title}</p>
                <p className="text-xs text-slate-400 my-3">
                  {t("مشاهدات / إعجابات / تعليقات", "Views / likes / comments")}
                  : {number(v.views)} / {number(v.likes)} / {number(v.comments)}
                </p>
                {v.views !== null && (
                  <div
                    role="img"
                    aria-label={`${t("المشاهدات", "Views")}: ${v.views}`}
                    className="h-2 bg-slate-800 rounded"
                  >
                    <div
                      className="h-full bg-cyan-400 rounded"
                      style={{
                        width: `${Math.max(1, (v.views / Math.max(1, ...data.videos.map((x: any) => x.views ?? 0))) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">
            {t(
              "الأشرطة تقارن مشاهدات الفيديوهات المتاحة فقط، وليست تاريخ نمو الحساب.",
              "Bars compare available video views, not account growth history.",
            )}
          </p>
        </article>
      )}
      <article className="panel p-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <h3 className="text-lg font-bold">
            {t("التقرير الذكي", "Smart report")}
          </h3>
          <button
            className="button primary print:hidden"
            onClick={generate}
            disabled={busy}
          >
            {busy
              ? t("جاري التوليد…", "Generating…")
              : t("توليد التقرير الذكي", "Generate report")}
          </button>
        </div>
        {report && (
          <div className="mt-5 space-y-4">
            <p className="text-cyan-300 text-sm">
              {report.type === "rules"
                ? t("تقرير محسوب بالقواعد البرمجية", "Rule-based report")
                : t("تقرير مولد بالذكاء الاصطناعي", "AI-generated report")}
            </p>
            <p className="whitespace-pre-wrap">{report.summary}</p>
            <ul className="list-disc list-inside space-y-2">
              {report.recommendations.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
            <p className="text-xs text-slate-400">{report.disclaimer}</p>
          </div>
        )}
      </article>
      {notice && (
        <p role="status" className="panel p-4">
          {notice}
        </p>
      )}
    </section>
  );
}
