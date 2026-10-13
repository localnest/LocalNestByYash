# Sentry Monitoring & Uptime Alerts Setup Guide

This guide describes how to configure application error tracking and uptime monitoring for LocalNest.

---

## 1. Sentry Project Configuration

1. Create a project in [Sentry.io](https://sentry.io) named `localnest-web` (Platform: Next.js).
2. Copy the client DSN (`https://...a@o123456.ingest.sentry.io/78910`).
3. Add to your deployment environment variables:
   - `NEXT_PUBLIC_SENTRY_DSN`: Client-side error telemetry.
   - `SENTRY_AUTH_TOKEN`: (Optional) In GitHub Secrets for uploading sourcemaps on production release.

---

## 2. In-App Error Tracking

Errors caught by React Error Boundaries or API adapters use the centralized monitor:

```typescript
import { captureException } from '@/lib/sentry';

try {
  await api.process();
} catch (err) {
  captureException(err, { orderId: 'ord-123' });
}
```

---

## 3. Uptime Alerts & Heartbeats

Configure an uptime check (via Better Stack / Checkly / UptimeRobot):

- **URL to Probe:** `https://<staging-or-prod-domain>/`
- **Expected Status:** `200 OK`
- **Interval:** Every 3 minutes
- **Notification Channels:** Slack / Discord `#alerts-production` channel and SMS/Email for platform administrators.
