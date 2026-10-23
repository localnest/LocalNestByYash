'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface PopoverPosition {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

/** Measures the anchor and decides whether the panel opens below or above it (desktop only). */
export function measurePopover(
  anchor: HTMLElement,
  minWidth = 0,
  desiredHeight = 260,
): PopoverPosition {
  const rect = anchor.getBoundingClientRect();
  const margin = 8;
  const width = Math.min(Math.max(rect.width, minWidth), window.innerWidth - margin * 2);
  const left = Math.min(Math.max(rect.left, margin), window.innerWidth - width - margin);
  const spaceBelow = window.innerHeight - rect.bottom - margin;
  const spaceAbove = rect.top - margin;
  const openBelow = spaceBelow >= desiredHeight || spaceBelow >= spaceAbove;
  const maxHeight = Math.max(180, Math.min(openBelow ? spaceBelow : spaceAbove, 420));
  return openBelow
    ? { left, width, maxHeight, top: rect.bottom + 6 }
    : { left, width, maxHeight, bottom: window.innerHeight - rect.top + 6 };
}

interface PopoverLayerProps {
  position: PopoverPosition;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  panelClassName?: string;
  onPanelKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * Dropdown popover on desktop, bottom sheet on phones (the switch is pure CSS, see
 * `.app-pop-*` in globals.css). Rendered in a portal so card/modal overflow never clips it.
 */
export default function PopoverLayer({
  position,
  title,
  onClose,
  children,
  panelClassName = '',
  onPanelKeyDown,
}: PopoverLayerProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = () => onClose();
    window.addEventListener('resize', close);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('resize', close);
    };
  }, [onClose]);

  const style = {
    '--pop-left': `${position.left}px`,
    '--pop-width': `${position.width}px`,
    '--pop-max': `${position.maxHeight}px`,
    '--pop-top': position.top !== undefined ? `${position.top}px` : 'auto',
    '--pop-bottom': position.bottom !== undefined ? `${position.bottom}px` : 'auto',
  } as React.CSSProperties;

  return createPortal(
    <div className="app-pop-layer">
      <div className="app-pop-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className={`app-pop-panel ${panelClassName}`}
        style={style}
        role="dialog"
        aria-label={title}
        onKeyDown={onPanelKeyDown}
      >
        <div className="app-pop-handle" aria-hidden="true" />
        <div className="app-pop-header">
          <strong>{title}</strong>
          <button type="button" className="app-pop-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
