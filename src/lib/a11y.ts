import type React from 'react';

/**
 * Keyboard activation for clickable non-button elements (use with role="button" tabIndex={0}):
 * Enter/Space trigger the element's own onClick, matching native button behaviour.
 */
export function activateOnKey(e: React.KeyboardEvent<HTMLElement>) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.currentTarget.click();
  }
}
