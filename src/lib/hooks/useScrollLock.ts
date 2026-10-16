'use client';

import { useEffect, useRef } from 'react';

/**
 * Global lock counter to handle nested modals / drawers cleanly.
 * Background scroll is only locked when count > 0 and unlocked when count === 0.
 */
let activeLockCount = 0;
let originalHtmlOverflow = '';
let originalBodyOverflow = '';
let originalBodyPaddingRight = '';

export function useScrollLock(isOpen: boolean, onEscape?: () => void) {
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    // Handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscapeRef.current) {
        e.preventDefault();
        onEscapeRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Apply scroll lock
    if (activeLockCount === 0) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      originalHtmlOverflow = document.documentElement.style.overflow;
      originalBodyOverflow = document.body.style.overflow;
      originalBodyPaddingRight = document.body.style.paddingRight;

      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';

      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
    }
    activeLockCount++;

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      activeLockCount--;
      if (activeLockCount <= 0) {
        activeLockCount = 0;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = originalBodyPaddingRight;
      }
    };
  }, [isOpen]);
}
