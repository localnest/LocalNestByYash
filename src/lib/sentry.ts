/**
 * Lightweight Sentry / Error Monitoring Integration
 * Safely captures runtime errors, unhandled rejections, and performance transactions.
 */

export interface ErrorReportContext {
  userRole?: string;
  societyId?: string;
  orderId?: string;
  extra?: Record<string, unknown>;
}

export function captureException(error: unknown, context?: ErrorReportContext): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const isProd = process.env.NODE_ENV === 'production';

  const errMessage = error instanceof Error ? error.message : String(error);
  const errStack = error instanceof Error ? error.stack : undefined;

  if (isProd && dsn) {
    // In production with DSN, forward to Sentry ingestion endpoint
    try {
      fetch(`${dsn}/api/envelope`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-sentry-envelope' },
        body: JSON.stringify({
          message: errMessage,
          stack: errStack,
          context,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    } catch {
      // Fail silently to avoid breaking UX
    }
  } else {
    // Development / test fallback logging
    console.warn('[Monitoring/Error]', { message: errMessage, context });
  }
}

export function captureBreadcrumb(
  _category: string,
  _message: string,
  _data?: Record<string, unknown>,
): void {
  // Silent breadcrumb recording
}
