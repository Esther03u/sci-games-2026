import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Toast Store', () => {
  let toast;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/lib/toast');
    toast = mod.toast;
    toast.dismiss();
  });

  it('adds success, error, warn, and info toasts with defaults', () => {
    const id = toast.success('บันทึกสำเร็จ');
    expect(typeof id).toBe('string');
    const items = toast.getSnapshot();
    expect(items.length).toBe(1);
    expect(items[0].message).toBe('บันทึกสำเร็จ');
    expect(items[0].type).toBe('success');
    expect(items[0].duration).toBe(3500);
  });

  it('supports options with title, custom duration, and action', () => {
    const actionFn = vi.fn();
    toast.error('มีข้อผิดพลาด', {
      title: 'ล้มเหลว',
      duration: 6000,
      action: { label: 'ลองใหม่', onClick: actionFn },
    });

    const items = toast.getSnapshot();
    expect(items.length).toBe(1);
    expect(items[0].type).toBe('error');
    expect(items[0].title).toBe('ล้มเหลว');
    expect(items[0].duration).toBe(6000);
    expect(items[0].action.label).toBe('ลองใหม่');
  });

  it('supports object as first argument', () => {
    toast.info({ title: 'อัปเดต', message: 'มีคะแนนใหม่' });
    const items = toast.getSnapshot();
    expect(items[0].title).toBe('อัปเดต');
    expect(items[0].message).toBe('มีคะแนนใหม่');
    expect(items[0].type).toBe('info');
  });

  it('notifies subscribers on add and dismiss', () => {
    const listener = vi.fn();
    const unsubscribe = toast.subscribe(listener);

    const id1 = toast.success('ข้อความ 1');
    expect(listener).toHaveBeenCalledTimes(1);

    const id2 = toast.warn('ข้อความ 2');
    expect(listener).toHaveBeenCalledTimes(2);

    toast.dismiss(id1);
    expect(listener).toHaveBeenCalledTimes(3);
    expect(toast.getSnapshot().map((t) => t.id)).toEqual([id2]);

    toast.dismiss(); // dismiss all
    expect(listener).toHaveBeenCalledTimes(4);
    expect(toast.getSnapshot()).toEqual([]);

    unsubscribe();
    toast.info('ข้อความ 3');
    expect(listener).toHaveBeenCalledTimes(4); // not called after unsub
  });
});
