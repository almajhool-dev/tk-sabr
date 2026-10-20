# TK_SABR | محلل حسابات تيك توك

This is the private source repository for the TK_SABR TikTok analysis website.

## Current status
The source package `TK_SABR_deploy.zip` was prepared in ChatGPT from the user's AI Studio export, but **has not been added to this repository yet**.

This repository's GitHub Actions workflow can validate and build the source archive when it is added.

**Do not claim this website is publicly deployed until a hosting deployment actually succeeds.**

## Architecture
- React + TypeScript + Vite frontend
- Express + TypeScript backend (needed for `/api/tiktok/scan` and Gemini)
- Firebase Authentication (must be configured for the final public domain)
- No real payments: checkout endpoints are intentionally disabled until a real merchant integration exists.

## Hosting
GitHub Pages only hosts static files. The scanning API needs a separate Node.js server. GitHub Free doesn't support Pages for private repositories. Keep the source private and host the entire application on a Node-enabled platform if public access with private code is desired.

## Security
Never commit live `.env` files, tokens, merchant secrets, or Google AI Studio project credentials. Configure production secrets in the hosting platform.

