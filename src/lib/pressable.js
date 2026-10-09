/**
 * Props that make a non-button element (a card laid out with block content)
 * act like a button: focusable, Enter / Space activate, disabled state
 * announced. Spread onto the element: <div {...pressable(open, !ready)}>.
 */
export function pressable(onActivate, disabled = false) {
  return {
    role: 'button',
    tabIndex: 0,
    'aria-disabled': disabled || undefined,
    onClick: disabled ? undefined : onActivate,
    onKeyDown: (e) => {
      if (e.target !== e.currentTarget) return; // keys inside nested controls
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); // Space would scroll the page
      if (!disabled) onActivate();
    },
  };
}
