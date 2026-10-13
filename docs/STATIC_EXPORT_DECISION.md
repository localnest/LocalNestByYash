# Architectural Decision Record: Single App Architecture & Next.js 16 Static Export Spike (S20.1)

**Status:** Accepted  
**Authors:** Rohit, Sagar, Yash  
**Date:** October 2026

---

## 1. Context & Problem Statement

LocalNest serves three distinct personas within gated societies:

1. **Residents:** Browse catalog, book services, track arrivals, chat with providers, manage wallet.
2. **Providers:** Receive dispatch broadcasts, atomic claim, verify OTPs, manage coverage radius.
3. **Society Admins:** Dispatch supervision, manual claims, payout approvals, conflict resolution.

We must decide:

- **Decision 1:** Should we build two separate applications (Resident App vs Provider App) or a unified single application?
- **Decision 2:** Should we use Next.js 16 Static HTML Export (`output: 'export'`) for Capacitor / Android native bundling, and what are the trade-offs?

---

## 2. Decision 1: One App vs. Two Apps

### Options Evaluated

| Dimension                  | Option A: Unified Single App (Selected)                              | Option B: Two Separate Apps                                |
| :------------------------- | :------------------------------------------------------------------- | :--------------------------------------------------------- |
| **Code Duplication**       | Zero duplication; shared geo engine, pricing calculators, and models | High duplication of types, sockets, and mock stores        |
| **Team Velocity (3 Devs)** | **Fast:** All 3 engineers work in a single unified codebase          | **Slow:** Dual CI pipelines, cross-repo dependency updates |
| **User Experience**        | Seamless role switching (resident who also offers home cooking)      | User must install and maintain two distinct applications   |
| **Release Management**     | Single deployment / single bundle                                    | Independent deployment coordination                        |

### Verdict: **Option A (Unified Single App)**

We will maintain a single unified application. Role-based view switching is handled through authentication roles and active profile context (`CUSTOMER`, `PROVIDER`, `ADMIN`).

---

## 3. Decision 2: Next.js 16 Static Export (`output: 'export'`) Spike

### Technical Assessment for Android / Capacitor Bundling

Next.js 16 App Router supports static HTML export via `output: 'export'` in `next.config.ts`.

#### Key Findings:

1. **Compatibility with Supabase & Client State:**
   - Because LocalNest's presentation layer connects to Supabase via client-side PostgREST SDK and in-memory mock adapters, all application routes (`/`, `/_not-found`) compile to pure static HTML/JS bundles.
2. **Turbopack Build Performance:**
   - Next.js 16 Turbopack statically generates all pages in under 800ms.
3. **Native Packaging (Capacitor):**
   - The generated `out/` directory can be directly embedded into Capacitor Android WebView (`npx cap sync android`).

### Configuration Strategy

We will support conditional export via an environment variable flag so standard web hosting (Vercel / Node) retains dynamic capabilities while Android builds use static export:

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const isStaticExport = process.env.BUILD_TARGET === 'export';

const nextConfig: NextConfig = {
  output: isStaticExport ? 'export' : undefined,
  images: {
    unoptimized: isStaticExport,
  },
};

export default nextConfig;
```

---

## 4. Consequences & Migration Path

1. **Routing:** Keep routes purely client-rendered or static-prerendered; avoid server-only headers (`cookies()`, `headers()`) on client entry pages.
2. **Assets:** All images, icons, and fonts must be hosted locally in `public/` or statically optimized.
3. **Capacitor Integration (Sprint S20):** Ready to initialize Capacitor Android wrapper (`@capacitor/core`, `@capacitor/android`) directly targeting `out/`.
