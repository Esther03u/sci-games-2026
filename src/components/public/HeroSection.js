'use client';
import Link from 'next/link';
import { motion } from 'motion/react';
import FolderFloat from '@/components/ui/FolderFloat';

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
      {/* Main Festival Hero Content */}
      <motion.div
        className="hero-festival-content"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* 1. Main Title */}
        <motion.h1 variants={itemVariants} className="hero-festival-title">
          Sci Games <span className="hero-festival-accent">2026</span>
        </motion.h1>

        {/* 2. Interactive FolderFloat containing festival information */}
        <motion.div variants={itemVariants} className="hero-festival-folder-container">
          <FolderFloat
            label="Sci Games 2026"
            sublabel="4 notes"
            items={[
              '9 – 11 ตุลาคม 2569',
              'รวมพลังความสามัคคี',
              'คณะวิทยาศาสตร์และเทคโนโลยี',
              'มหาวิทยาลัยราชภัฏภูเก็ต',
            ]}
            trigger="hover"
            closeOnSelect={false}
            physics={true}
            drift={0.35}
            folderColor="#de9d1a"
            frontColor="#f2b733"
            paperColor="#ffffff"
            itemColor="#ffffff"
            itemTextColor="#18181b"
            labelColor="#ffffff"
            width={220}
            height={144}
            radius={16}
            spread={170}
            rowHeight={36}
            lift={8}
            tilt={5}
            flapAngle={34}
            restAngle={16}
            openDuration={480}
            stagger={40}
            bounce={0.15}
          />
        </motion.div>

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
