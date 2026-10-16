'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Info,
  X,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  referenceId?: string; // e.g. "Order #ORD-1024" or "Ref #TXN-8819"
  durationMs?: number; // default 4000ms
  timestamp: number;
}

export interface ConfirmationOptions {
  title: string;
  message: string;
  consequence?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'warning';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface NotificationContextValue {
  toasts: Toast[];
  notify: {
    success: (
      message: string,
      options?: { title?: string; referenceId?: string; durationMs?: number },
    ) => void;
    error: (
      message: string,
      options?: { title?: string; referenceId?: string; durationMs?: number },
    ) => void;
    warning: (
      message: string,
      options?: { title?: string; referenceId?: string; durationMs?: number },
    ) => void;
    info: (
      message: string,
      options?: { title?: string; referenceId?: string; durationMs?: number },
    ) => void;
    dismiss: (id: string) => void;
    clearAll: () => void;
  };
  confirmDialog: (options: ConfirmationOptions) => void;
  closeConfirmDialog: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmation, setConfirmation] = useState<ConfirmationOptions | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const recentMessagesRef = useRef<Map<string, number>>(new Map());

  // Clean recent messages cache every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      recentMessagesRef.current.forEach((time, msg) => {
        if (now - time > 4000) {
          recentMessagesRef.current.delete(msg);
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const addToast = useCallback(
    (
      type: ToastType,
      message: string,
      options?: { title?: string; referenceId?: string; durationMs?: number },
    ) => {
      if (!message || !message.trim()) return;

      const trimmed = message.trim();
      const now = Date.now();

      // Deduplication: prevent identical message within 2.5 seconds
      const lastShown = recentMessagesRef.current.get(trimmed);
      if (lastShown && now - lastShown < 2500) {
        return;
      }
      recentMessagesRef.current.set(trimmed, now);

      const id = `toast-${now}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = options?.durationMs ?? (type === 'error' ? 5000 : 4000);

      const newToast: Toast = {
        id,
        type,
        title: options?.title,
        message: trimmed,
        referenceId: options?.referenceId,
        durationMs: duration,
        timestamp: now,
      };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // max 5 toasts stacked

      // Auto dismiss
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const confirmDialog = useCallback((options: ConfirmationOptions) => {
    setConfirmation(options);
    setIsConfirming(false);
  }, []);

  const closeConfirmDialog = useCallback(() => {
    if (confirmation?.onCancel) {
      confirmation.onCancel();
    }
    setConfirmation(null);
    setIsConfirming(false);
  }, [confirmation]);

  const handleConfirmAction = async () => {
    if (!confirmation) return;
    try {
      setIsConfirming(true);
      await confirmation.onConfirm();
    } catch {
      addToast('error', 'The requested action could not be completed. Please try again.');
    } finally {
      setIsConfirming(false);
      setConfirmation(null);
    }
  };

  const notify = {
    success: (msg: string, opts?: { title?: string; referenceId?: string; durationMs?: number }) =>
      addToast('success', msg, opts),
    error: (msg: string, opts?: { title?: string; referenceId?: string; durationMs?: number }) =>
      addToast('error', msg, opts),
    warning: (msg: string, opts?: { title?: string; referenceId?: string; durationMs?: number }) =>
      addToast('warning', msg, opts),
    info: (msg: string, opts?: { title?: string; referenceId?: string; durationMs?: number }) =>
      addToast('info', msg, opts),
    dismiss: dismissToast,
    clearAll: clearAllToasts,
  };

  return (
    <NotificationContext.Provider value={{ toasts, notify, confirmDialog, closeConfirmDialog }}>
      {children}

      {/* ===== ACCESSIBLE TOAST CONTAINER (Top Right on Desktop, Top Center on Mobile) ===== */}
      <div
        role="region"
        aria-label="Notifications"
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: 'min(420px, calc(100vw - 32px))',
          width: '100%',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          let bg = '#0f172a';
          let border = '#334155';
          let icon = <Info size={18} color="#38bdf8" />;

          if (toast.type === 'success') {
            bg = '#064e3b';
            border = '#059669';
            icon = <CheckCircle size={18} color="#34d399" />;
          } else if (toast.type === 'error') {
            bg = '#7f1d1d';
            border = '#dc2626';
            icon = <AlertOctagon size={18} color="#f87171" />;
          } else if (toast.type === 'warning') {
            bg = '#78350f';
            border = '#d97706';
            icon = <AlertTriangle size={18} color="#fbbf24" />;
          }

          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
              style={{
                background: bg,
                border: `1px solid ${border}`,
                color: '#ffffff',
                borderRadius: '12px',
                padding: '12px 14px',
                boxShadow:
                  '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                pointerEvents: 'auto',
                animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ flexShrink: 0, marginTop: '2px' }}>{icon}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {toast.title && (
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '2px' }}>
                    {toast.title}
                  </div>
                )}
                <div style={{ fontSize: '0.82rem', lineHeight: 1.45, opacity: 0.95 }}>
                  {toast.message}
                </div>
                {toast.referenceId && (
                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      background: 'rgba(255, 255, 255, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                  >
                    Ref: {toast.referenceId}
                  </div>
                )}
              </div>

              <button
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ===== GLOBAL ACCESSIBLE CONFIRMATION MODAL ===== */}
      {confirmation && (
        <div
          className="modal-overlay"
          onClick={closeConfirmDialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          style={{ zIndex: 10000 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '440px',
              padding: '24px',
              borderRadius: 'var(--radius-xl)',
              background: '#ffffff',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background:
                    confirmation.variant === 'danger'
                      ? '#fee2e2'
                      : confirmation.variant === 'warning'
                        ? '#fef3c7'
                        : '#ccfbf1',
                  color:
                    confirmation.variant === 'danger'
                      ? '#dc2626'
                      : confirmation.variant === 'warning'
                        ? '#d97706'
                        : '#0d9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {confirmation.variant === 'danger' ? (
                  <AlertOctagon size={22} />
                ) : confirmation.variant === 'warning' ? (
                  <ShieldAlert size={22} />
                ) : (
                  <CheckCircle size={22} />
                )}
              </div>

              <div style={{ flex: 1 }}>
                <h3
                  id="confirm-modal-title"
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    margin: '0 0 6px',
                  }}
                >
                  {confirmation.title}
                </h3>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {confirmation.message}
                </p>
              </div>
            </div>

            {confirmation.consequence && (
              <div
                style={{
                  background: confirmation.variant === 'danger' ? '#fef2f2' : '#f8fafc',
                  border: `1px solid ${confirmation.variant === 'danger' ? '#fecaca' : 'var(--border-light)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  fontSize: '0.78rem',
                  color: confirmation.variant === 'danger' ? '#991b1b' : 'var(--text-main)',
                  marginBottom: '18px',
                  lineHeight: 1.5,
                }}
              >
                <strong>Notice:</strong> {confirmation.consequence}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={closeConfirmDialog}
                disabled={isConfirming}
                className="btn btn-secondary"
                style={{ minWidth: '90px' }}
              >
                {confirmation.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isConfirming}
                className={`btn ${
                  confirmation.variant === 'danger' ? 'btn-danger' : 'btn-primary'
                }`}
                style={{
                  minWidth: '100px',
                  background: confirmation.variant === 'danger' ? '#dc2626' : undefined,
                  borderColor: confirmation.variant === 'danger' ? '#dc2626' : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {isConfirming && <Loader2 size={14} className="spin" />}
                {confirmation.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    // Graceful fallback for components or tests outside provider
    return {
      toasts: [],
      notify: {
        success: () => {},
        error: () => {},
        warning: () => {},
        info: () => {},
        dismiss: () => {},
        clearAll: () => {},
      },
      confirmDialog: (opts) => opts.onConfirm(),
      closeConfirmDialog: () => {},
    };
  }
  return context;
}
