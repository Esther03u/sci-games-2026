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
            sublabel="30 notes"
            items={[
              'ทำถึงมากคุณน้า',
              'ชีทำถึงเกิน',
              'โฮ่งมากกก',
              'ตัวแม่จะแคร์เพื่อ',
              'ตัวตึงคณะวิทย์',
              'เก่งมากคุณน้า',
              'ฉ่ำมากกก',
              'จึ้งเกินคุณน้า',
              'วาสนาผู้ใด',
              'ตัวมัมตัวคลอดบุตร',
              'ฟิลกู๊ดดด',
              'นอยด์อ่ะแก',
              'ช็อตฟีลขั้นสุด',
              'ไม่สนลูกใคร',
              'ตึงเปรี๊ยะ',
              'สู้ชีวิตแต่ชีวิตสู้กลับ',
              'เกินต้านมาก',
              'ใจฟูไม่ไหว',
              'ตัวพ่อสโม',
              'มงจะลงใคร',
              'อย่าเล่นกับระบบ',
              'แรงมากแกรรร',
              'ของแทร่',
              'สู้เขาดิวะอีหญิง',
              'ดึงหน้าทำไม',
              'งานไม่ใหญ่แน่นะวิ',
              'เอาดีๆ นะ',
              'ขิตแป๊บ',
              'ฟีลทีมชาติ',
              'ขอร้องงง',
            ]}
            trigger="hover"
            closeOnSelect={false}
            physics={true}
            cluster={true}
            drift={0.3}
            folderColor="#de9d1a"
            frontColor="#f2b733"
            paperColor="#ffffff"
            itemColor="var(--surface, #ffffff)"
            itemTextColor="var(--text, #18181b)"
            labelColor="#ffffff"
            width={220}
            height={144}
            radius={16}
            spread={152}
            rowHeight={15}
            lift={8}
            tilt={6}
            flapAngle={34}
            restAngle={16}
            openDuration={380}
            stagger={7}
            bounce={0.12}
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
