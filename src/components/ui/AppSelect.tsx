'use client';

import React, { useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import PopoverLayer, { measurePopover, type PopoverPosition } from './PopoverLayer';

export interface AppSelectOption {
  value: string;
  label: string;
  hint?: string;
}

interface AppSelectProps {
  value: string;
  options: AppSelectOption[];
  onChange: (value: string) => void;
  id?: string;
  /** Sheet heading on phones and accessible name of the list. */
  label: string;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  /** Skip the `form-input` field chrome (for header/inline triggers that bring their own look). */
  bare?: boolean;
}

export default function AppSelect({
  value,
  options,
  onChange,
  id,
  label,
  placeholder = 'Select',
  className = '',
  style,
  disabled = false,
  bare = false,
}: AppSelectProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const listboxId = `${id ?? 'app-select'}-listbox`;

  const open = () => {
    if (disabled || !triggerRef.current) return;
    setPosition(measurePopover(triggerRef.current, 240));
    setActiveIndex(Math.max(selectedIndex, 0));
  };

  const close = () => {
    setPosition(null);
    triggerRef.current?.focus();
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    close();
  };

  const focusList = (node: HTMLDivElement | null) => {
    listRef.current = node;
    if (!node) return;
    node.focus({ preventScroll: true });
    node.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center' });
  };

  const move = (next: number) => {
    const clamped = Math.min(Math.max(next, 0), options.length - 1);
    setActiveIndex(clamped);
    listRef.current?.querySelectorAll('[role="option"]')[clamped]?.scrollIntoView({
      block: 'nearest',
    });
  };

  const onListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(activeIndex + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(activeIndex - 1);
        break;
      case 'Home':
        event.preventDefault();
        move(0);
        break;
      case 'End':
        event.preventDefault();
        move(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(activeIndex);
        break;
      case 'Escape':
      case 'Tab':
        event.preventDefault();
        close();
        break;
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={position !== null}
        aria-controls={position ? listboxId : undefined}
        disabled={disabled}
        className={`${bare ? 'bare' : 'form-input'} app-select-trigger ${className}`}
        style={style}
        onClick={open}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            open();
          }
        }}
      >
        <span className={`app-select-value ${selected ? '' : 'placeholder'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} className="app-select-chevron" aria-hidden="true" />
      </button>

      {position && (
        <PopoverLayer
          position={position}
          title={label}
          onClose={close}
          panelClassName="app-select-panel"
          onPanelKeyDown={onListKeyDown}
        >
          <div
            ref={focusList}
            id={listboxId}
            role="listbox"
            aria-label={label}
            aria-activedescendant={`${listboxId}-${activeIndex}`}
            tabIndex={-1}
            className="app-select-list"
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={option.value === value}
                className={`app-select-option ${index === activeIndex ? 'active' : ''} ${
                  option.value === value ? 'selected' : ''
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(index)}
              >
                <span className="app-select-option-text">
                  <span className="app-select-option-label">{option.label}</span>
                  {option.hint && <span className="app-select-option-hint">{option.hint}</span>}
                </span>
                {option.value === value && <Check size={18} aria-hidden="true" />}
              </div>
            ))}
          </div>
        </PopoverLayer>
      )}
    </>
  );
}
