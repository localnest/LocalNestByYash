'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface ScrollableNavTabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}

export default function ScrollableNavTabs({
  tabs,
  activeId,
  onChange,
  ariaLabel = 'Navigation tabs',
  className = '',
}: ScrollableNavTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      checkScroll();
      setHasInteracted(true);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    // Initial check after paint
    const timer = setTimeout(checkScroll, 100);

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, [checkScroll, tabs]);

  const scrollByDirection = (direction: 'left' | 'right') => {
    setHasInteracted(true);
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -180 : 180;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleTabClick = (tabId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    setHasInteracted(true);
    onChange(tabId);
    event.currentTarget.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  };

  return (
    <div className={`scrollable-nav-wrapper ${className}`}>
      {/* Left edge shadow gradient & chevron */}
      {canScrollLeft && (
        <div className="scrollable-nav-edge scrollable-nav-edge-left">
          <button
            type="button"
            className="scrollable-nav-arrow-btn"
            onClick={() => scrollByDirection('left')}
            aria-label="Scroll left"
            title="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      )}

      {/* Main scrolling track */}
      <div
        ref={scrollContainerRef}
        className="scrollable-nav-track"
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={`scrollable-nav-tab ${isActive ? 'active' : ''}`}
              onClick={(e) => handleTabClick(tab.id, e)}
            >
              {tab.icon && <span className="scrollable-nav-tab-icon">{tab.icon}</span>}
              <span className="scrollable-nav-tab-label">{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`scrollable-nav-tab-badge ${isActive ? 'active' : ''}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right edge shadow gradient & chevron */}
      {canScrollRight && (
        <div className="scrollable-nav-edge scrollable-nav-edge-right">
          {!hasInteracted && (
            <div className="scrollable-nav-hint-pill" onClick={() => scrollByDirection('right')}>
              <span>More</span>
              <ChevronRight size={13} />
            </div>
          )}
          <button
            type="button"
            className="scrollable-nav-arrow-btn"
            onClick={() => scrollByDirection('right')}
            aria-label="Scroll right"
            title="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
