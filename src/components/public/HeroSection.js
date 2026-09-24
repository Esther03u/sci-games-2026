'use client';
import Link from 'next/link';
import { motion } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function HeroSection() {
  return (
    <section className="hero-festival-wrapper">
      {/* Ambient Aura Background with gentle breathing pulse */}
      <motion.div
        className="hero-festival-glow"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.75, 0.95, 0.75],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Main Festival Hero Content */}
      <motion.div
        className="hero-festival-content"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* 1. Header Pill Badge */}
        <motion.div variants={itemVariants} className="hero-festival-badge">
          <span>9 – 11 ตุลาคม 2569</span>
        </motion.div>

        {/* 2. Main Title */}
        <motion.h1 variants={itemVariants} className="hero-festival-title">
          Sci Games <span className="hero-festival-accent">2026</span>
        </motion.h1>

        {/* 3. Subtitle / Venue */}
        <motion.p variants={itemVariants} className="hero-festival-subtitle">
          <span>รวมพลังความสามัคคี คณะวิทยาศาสตร์และเทคโนโลยี</span>
          <span className="hero-festival-venue">ณ มหาวิทยาลัยราชภัฏภูเก็ต</span>
        </motion.p>

        {/* 4. Action Buttons with Spring Touch/Hover */}
        <motion.div variants={itemVariants} className="hero-festival-actions">
          <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Link href="/schedule" className="btn-festival-primary">
              <span>ดูตารางการแข่งขัน</span>
            </Link>
          </motion.div>
          <div className="hero-festival-secondary-group">
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Link href="/results" className="btn-festival-secondary">
                <span>สรุปผลการแข่งขัน</span>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Link href="/handbook" className="btn-festival-secondary">
                <span>สูจิบัตร</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
