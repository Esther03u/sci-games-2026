'use client';
import { useEffect, useState } from 'react';

/**
 * @typedef {Object} ToastItem
 * @property {string} id
 * @property {'success' | 'error' | 'warn' | 'info'} type
 * @property {string} [title]
 * @property {string} message
 * @property {number} duration
 * @property {number} createdAt
 * @property {{ label: string, onClick: () => void }} [action]
 */

class ToastStore {
  constructor() {
    /** @type {ToastItem[]} */
    this.toasts = [];
    /** @type {Set<(toasts: ToastItem[]) => void>} */
    this.listeners = new Set();
  }

  getSnapshot = () => this.toasts;

  subscribe = (listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  notify = () => {
    const copy = [...this.toasts];
    this.listeners.forEach((listener) => listener(copy));
  };

  /**
   * @param {'success' | 'error' | 'warn' | 'info'} type
   * @param {string | Partial<ToastItem>} messageOrOpts
   * @param {Partial<ToastItem>} [opts]
   * @returns {string} Toast ID
   */
  add = (type, messageOrOpts, opts = {}) => {
    const defaults = {
      duration: type === 'error' ? 4500 : 3500,
    };

    let item;
    if (typeof messageOrOpts === 'string') {
      item = {
        id: opts.id || `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type,
        message: messageOrOpts,
        title: opts.title,
        duration: opts.duration ?? defaults.duration,
        action: opts.action,
        createdAt: Date.now(),
      };
    } else {
      const merged = { ...defaults, ...messageOrOpts };
      item = {
        id: merged.id || `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type,
        message: merged.message || '',
        title: merged.title,
        duration: merged.duration,
        action: merged.action,
        createdAt: Date.now(),
      };
    }

    // Limit to latest 10 in memory queue
    this.toasts = [item, ...this.toasts.filter((t) => t.id !== item.id)].slice(0, 10);
    this.notify();
    return item.id;
  };

  success = (msg, opts) => this.add('success', msg, opts);
  error = (msg, opts) => this.add('error', msg, opts);
  warn = (msg, opts) => this.add('warn', msg, opts);
  info = (msg, opts) => this.add('info', msg, opts);

  dismiss = (id) => {
    if (!id) {
      if (this.toasts.length === 0) return;
      this.toasts = [];
      this.notify();
      return;
    }
    const next = this.toasts.filter((t) => t.id !== id);
    if (next.length !== this.toasts.length) {
      this.toasts = next;
      this.notify();
    }
  };
}

export const toast = new ToastStore();

/** React hook for subscribing to toasts inside components */
export function useToast() {
  const [toasts, setToasts] = useState(toast.getSnapshot());

  useEffect(() => {
    setToasts(toast.getSnapshot());
    return toast.subscribe(setToasts);
  }, []);

  return { toasts, toast };
}
