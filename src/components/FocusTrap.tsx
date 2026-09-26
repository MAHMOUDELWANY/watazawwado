import React, { useEffect, useRef } from 'react';

export default function FocusTrap({ children, isActive = true }: { children: React.ReactNode, isActive?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElementsString =
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
    let focusableElements = Array.from(container.querySelectorAll<HTMLElement>(focusableElementsString));
    
    if (focusableElements.length === 0) {
      container.setAttribute('tabindex', '-1');
      container.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      const isTabPressed = e.key === 'Tab';
      if (!isTabPressed) return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element on mount
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return <div ref={containerRef} className="contents">{children}</div>;
}
