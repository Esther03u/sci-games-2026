'use client';

import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1], // fluid easeOutCubic/Quint
      }}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}
