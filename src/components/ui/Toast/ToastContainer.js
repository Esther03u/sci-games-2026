'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { toast, useToast } from '@/lib/toast';
import ToastItem from './ToastItem';
import './toast.css';

export default function ToastContainer() {
  const { toasts } = useToast();
  const [isHovered, setIsHovered] = useState(false);

  if (!toasts || toasts.length === 0) return null;

  // Show up to 3 visible toasts
  const visible = toasts.slice(0, 3);

  return (
    <div
      className="sg-toast-viewport"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {visible.map((item, index) => (
          <ToastItem
            key={item.id}
            toast={item}
            index={index}
            isHovered={isHovered}
            onDismiss={toast.dismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
