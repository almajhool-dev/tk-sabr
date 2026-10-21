# TK_SABR API

All JSON; failures return `{status:"error",code,message}`. Frontend never holds data-provider/AI/service-role secrets.

- `GET /api/health`: configuration availability, not proof of upstream connectivity.
- `GET /api/settings`: maintenance and scanning switches.
- `POST /api/tiktok/analyze` body `{username:"@creator"}`: returns `{status,username,profile,videos,analysis,dataSource,fetchedAt}`. Fields missing upstream remain null. No private statistics are inferred.
- `POST /api/reports/generate` body `{username}`: reuses server data. Returns `{report:{type:"rules"|"ai",summary,recommendations,disclaimer,...}}`. Client-supplied profile metrics are never trusted.
- `GET /api/reports`, `POST /api/reports` body `{username}`, `DELETE /api/reports/:uuid`: verified bearer session required. Save only a fresh server-cached scan, explicitly requested by the user.
- `GET /api/admin/overview`, `POST /api/admin/settings` body `{enabled:boolean,maintenance:boolean}`: verified bearer user AND server-side admin table membership required.

## Authorized data sources

1. Official Display API `https://open.tiktokapis.com/v2/user/info/` with an owner-authorized token. Relevant scopes: user.info.basic, user.info.profile, user.info.stats. Only that owner's username is accepted. A short-lived static server token is supported; automatic TikTok OAuth onboarding and refresh are not implemented. Never use Research API credentials for this commercial platform.
2. A **separately contracted, authorized** provider, configured only by the operator. No provider has been selected, contracted, or verified in this delivery. `DATA_PROVIDER_AUTHORIZED=true` is the operator's explicit configuration, not independent proof of licensing. The adapter POSTs `{username}` to a fixed HTTPS URL using `Authorization: Bearer ...`. It expects:

```json
{"username":"creator","profile":{"displayName":null,"avatarUrl":null,"verified":null,"followers":null,"following":null,"likes":null,"videos":null,"bio":null,"private":null},"videos":[]}
```

A video has `{id,title,thumbnailUrl,views,likes,comments,shares,publishedAt}`; unknown optional values null, timestamps ISO UTC. Return HTTP 404 only for a confirmed missing account, 429 for limits, 5xx for failures. Private accounts may return their permitted metadata with `private:true`. Provider data must match the requested username. No server scraping or short-link resolution is used.

Official list endpoint: `POST /v2/video/list/`, scope video.list. Set `TIKTOK_VIDEO_SCOPE=true` only after authorization. Up to 20 available videos are fetched, not a complete account history. Missing video access yields no derived engagement estimate.

Engagement = sum(likes + comments + shares) / sum(views) × 100, only over videos with all required metrics. Score is an explicitly arbitrary completeness/content-availability heuristic, not a validated cybersecurity model. No follower-authenticity or penalty inference.

Errors: 400 invalid input/JSON, 401 invalid session, 403 role/owner/origin denial, 404 confirmed missing account, 409 scan required, 413 oversized body, 429 local/provider limit, 502 upstream failure/schema error, 503 unconfigured/maintenance/DB failure, 504 upstream timeout. A failure to access a profile is never labelled "account deleted" without provider evidence.

No persistent cookies on this API: sessions use bearer tokens and explicit allowed origins; conventional cookie CSRF is not applicable. Supabase manages email/Google OAuth sessions. HTTPS is required at the hosting edge; the Node listener itself relies on that reverse proxy.
