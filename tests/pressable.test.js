import { describe, expect, it, vi } from 'vitest';
import { pressable } from '@/lib/pressable';

const key = (props, k, target) => {
  const e = { key: k, preventDefault: vi.fn() };
  e.target = target ?? (e.currentTarget = {});
  if (!e.currentTarget) e.currentTarget = {};
  props.onKeyDown(e);
  return e;
};

describe('pressable', () => {
  it('is a focusable button activated by click, Enter and Space', () => {
    const fn = vi.fn();
    const p = pressable(fn);
    expect(p.role).toBe('button');
    expect(p.tabIndex).toBe(0);
    expect(p['aria-disabled']).toBeUndefined();
    p.onClick();
    expect(key(p, 'Enter').preventDefault).toHaveBeenCalled();
    key(p, ' ');
    key(p, 'a');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('disabled: still focusable, announced, never activates', () => {
    const fn = vi.fn();
    const p = pressable(fn, true);
    expect(p.tabIndex).toBe(0);
    expect(p['aria-disabled']).toBe(true);
    expect(p.onClick).toBeUndefined();
    key(p, 'Enter');
    expect(fn).not.toHaveBeenCalled();
  });

  it('ignores keys pressed on a nested control', () => {
    const fn = vi.fn();
    key(pressable(fn), 'Enter', { nested: true });
    expect(fn).not.toHaveBeenCalled();
  });
});
