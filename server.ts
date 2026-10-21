import "dotenv/config";
import path from "node:path";
import express from "express";
import { createApp } from "./backend/app.ts";
const app = createApp();
if (process.env.NODE_ENV === "production") {
  app.use((_req, res, next) => {
    res.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    next();
  });
  app.use(express.static(path.resolve("dist"), { maxAge: "1h" }));
  app.get("*", (_req, res) => res.sendFile(path.resolve("dist/index.html")));
} else {
  const { createServer } = await import("vite");
  app.use(
    (await createServer({ server: { middlewareMode: true }, appType: "spa" }))
      .middlewares,
  );
}
app.listen(Number(process.env.PORT || 3000), "0.0.0.0", () =>
  console.log("TK_SABR server ready"),
);
