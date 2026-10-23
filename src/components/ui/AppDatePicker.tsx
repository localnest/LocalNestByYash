'use client';

import React, { useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import PopoverLayer, { measurePopover, type PopoverPosition } from './PopoverLayer';

interface AppDatePickerProps {
  /** ISO calendar date, `YYYY-MM-DD`. */
  value: string;
  onChange: (value: string) => void;
  /** Earliest selectable ISO date. */
  min?: string;
  max?: string;
  id?: string;
  label: string;
  className?: string;
  style?: React.CSSProperties;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const pad = (n: number) => String(n).padStart(2, '0');

function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromIso(iso: string | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function shiftDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

const triggerFormat = new Intl.DateTimeFormat('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const monthFormat = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' });
const dayLabelFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'full' });

const ARROW_STEPS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

export default function AppDatePicker({
  value,
  onChange,
  min,
  max,
  id,
  label,
  className = '',
  style,
}: AppDatePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const [focused, setFocused] = useState<Date>(() => fromIso(value) ?? new Date());

  const selected = fromIso(value);
  const today = toIso(new Date());
  const isDisabled = (iso: string) => Boolean((min && iso < min) || (max && iso > max));

  const open = () => {
    if (!triggerRef.current) return;
    setPosition(measurePopover(triggerRef.current, 320, 360));
    setFocused(fromIso(value) ?? fromIso(min) ?? new Date());
  };

  const close = () => {
    setPosition(null);
    triggerRef.current?.focus();
  };

  const pick = (date: Date) => {
    const iso = toIso(date);
    if (isDisabled(iso)) return;
    onChange(iso);
    close();
  };

  const focusGrid = (node: HTMLDivElement | null) => node?.focus({ preventScroll: true });

  const year = focused.getFullYear();
  const month = focused.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const canGoPrev = !min || toIso(new Date(year, month, 0)) >= min;
  const canGoNext = !max || toIso(new Date(year, month + 1, 1)) <= max;

  const gotoMonth = (delta: number) => {
    const target = new Date(year, month + delta, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    setFocused(
      new Date(target.getFullYear(), target.getMonth(), Math.min(focused.getDate(), lastDay)),
    );
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key in ARROW_STEPS) {
      event.preventDefault();
      setFocused(shiftDays(focused, ARROW_STEPS[event.key]));
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      gotoMonth(event.key === 'PageUp' ? -1 : 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pick(focused);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  };

  const focusedIso = toIso(focused);
  const monthLabel = monthFormat.format(new Date(year, month, 1));

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={position !== null}
        className={`form-input app-select-trigger ${className}`}
        style={style}
        onClick={open}
      >
        <span className={`app-select-value ${selected ? '' : 'placeholder'}`}>
          {selected ? triggerFormat.format(selected) : 'Choose a date'}
        </span>
        <ChevronDown size={16} className="app-select-chevron" aria-hidden="true" />
      </button>

      {position && (
        <PopoverLayer
          position={position}
          title={label}
          onClose={close}
          panelClassName="app-date-panel"
          onPanelKeyDown={onKeyDown}
        >
          <div className="app-date-nav">
            <button
              type="button"
              className="app-date-nav-btn"
              onClick={() => gotoMonth(-1)}
              disabled={!canGoPrev}
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <strong aria-live="polite">{monthLabel}</strong>
            <button
              type="button"
              className="app-date-nav-btn"
              onClick={() => gotoMonth(1)}
              disabled={!canGoNext}
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div
            ref={focusGrid}
            className="app-date-grid"
            role="grid"
            tabIndex={-1}
            aria-label={monthLabel}
          >
            {WEEKDAYS.map((day) => (
              <span key={day} className="app-date-weekday" role="columnheader">
                {day}
              </span>
            ))}
            {cells.map((date, index) => {
              if (!date) return <span key={`blank-${index}`} aria-hidden="true" />;
              const iso = toIso(date);
              return (
                <button
                  key={iso}
                  type="button"
                  tabIndex={-1}
                  disabled={isDisabled(iso)}
                  aria-label={dayLabelFormat.format(date)}
                  aria-pressed={iso === value}
                  aria-current={iso === today ? 'date' : undefined}
                  className={`app-date-day ${iso === value ? 'selected' : ''} ${
                    iso === today ? 'today' : ''
                  } ${iso === focusedIso ? 'focused' : ''}`}
                  onClick={() => pick(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <div className="app-date-footer">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={isDisabled(today)}
              onClick={() => pick(new Date())}
            >
              Today
            </button>
          </div>
        </PopoverLayer>
      )}
    </>
  );
}
