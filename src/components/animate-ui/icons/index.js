'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import * as LucideIcons from 'lucide-react';

// Icons ที่ไม่มี micro-interaction: ใช้ lucide ตรง ๆ (ทุกที่ที่ใช้ส่ง size เอง)
// เดิมเป็นไฟล์ Animate UI registry แต่ไม่มีใครส่ง animate* prop จึง render เป็น svg นิ่งอยู่แล้ว
export const Search = LucideIcons.Search;
export const Clock = LucideIcons.Clock;
export const MapPin = LucideIcons.MapPin;
export const Check = LucideIcons.Check;
export const Bell = LucideIcons.Bell;
export const ChartLine = LucideIcons.ChartLine;
export const Activity = LucideIcons.Activity;
export const Trash2 = LucideIcons.Trash2;
export const Plus = LucideIcons.Plus;
export const X = LucideIcons.X;
export const Menu = LucideIcons.Menu;
export const Timer = LucideIcons.Timer;
export const Sparkles = LucideIcons.Sparkles;
export const Send = LucideIcons.Send;
export const Users = LucideIcons.Users;
export const User = LucideIcons.User;
export const RotateCcw = LucideIcons.RotateCcw;
export const Play = LucideIcons.Play;

// Helper to create Motion-animated Lucide icon adhering to Animate UI micro-interactions
function createMotionIcon(LucideIcon, defaultHoverAnimation = { scale: 1.15, rotate: [0, -6, 6, 0] }) {
  const Component = React.forwardRef(function MotionIcon(
    {
      size = 20,
      animateOnHover = true,
      animateOnTap = true,
      className,
      style,
      ...props
    },
    ref
  ) {
    return (
      <motion.span
        ref={ref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          verticalAlign: 'middle',
          ...style,
        }}
        whileHover={
          animateOnHover
            ? {
                ...defaultHoverAnimation,
                transition: { duration: 0.35, ease: 'easeOut' },
              }
            : undefined
        }
        whileTap={animateOnTap ? { scale: 0.92 } : undefined}
        className={className}
      >
        <LucideIcon size={size} {...props} />
      </motion.span>
    );
  });
  Component.displayName = `Motion(${LucideIcon.displayName || LucideIcon.name || 'Icon'})`;
  return Component;
}

// Additional animated icons crafted with matching Animate UI micro-interactions
export const Trophy = createMotionIcon(LucideIcons.Trophy, { scale: 1.2, y: -2 });
export const Calendar = createMotionIcon(LucideIcons.Calendar, { scale: 1.15, rotate: [0, -5, 5, 0] });
export const Medal = createMotionIcon(LucideIcons.Medal, { scale: 1.2, rotate: [0, -10, 10, 0] });
export const Award = createMotionIcon(LucideIcons.Award, { scale: 1.18, y: -2 });
export const Zap = createMotionIcon(LucideIcons.Zap, { scale: 1.25, rotate: [0, -12, 12, 0] });
export const Flame = createMotionIcon(LucideIcons.Flame, { scale: 1.2, y: -2 });
export const Flag = createMotionIcon(LucideIcons.Flag, { scale: 1.15, rotate: [0, 8, -8, 0] });
export const Building2 = createMotionIcon(LucideIcons.Building2, { scale: 1.12, y: -1 });
export const Megaphone = createMotionIcon(LucideIcons.Megaphone, { scale: 1.18, rotate: [0, -8, 8, 0] });
export const FileText = createMotionIcon(LucideIcons.FileText, { scale: 1.15, y: -2 });
export const LayoutDashboard = createMotionIcon(LucideIcons.LayoutDashboard, { scale: 1.15 });
export const Pin = createMotionIcon(LucideIcons.Pin, { scale: 1.2, rotate: -15 });
export const AlertTriangle = createMotionIcon(LucideIcons.AlertTriangle, { scale: 1.2, rotate: [0, -8, 8, 0] });
export const Pencil = createMotionIcon(LucideIcons.Pencil, { scale: 1.15, rotate: -15 });
export const Shield = createMotionIcon(LucideIcons.Shield, { scale: 1.15, y: -1 });
export const Package = createMotionIcon(LucideIcons.Package, { scale: 1.15, y: -2 });
export const Download = createMotionIcon(LucideIcons.Download, { scale: 1.15, y: 2 });
export const Dumbbell = createMotionIcon(LucideIcons.Dumbbell, { scale: 1.2, rotate: 20 });
export const LogOut = createMotionIcon(LucideIcons.LogOut, { scale: 1.15, x: 2 });
export const ExternalLink = createMotionIcon(LucideIcons.ExternalLink, { scale: 1.15, x: 1, y: -1 });
export const ChevronRight = createMotionIcon(LucideIcons.ChevronRight, { x: 3 });
export const ChevronDown = createMotionIcon(LucideIcons.ChevronDown, { y: 2 });
export const CheckCircle2 = createMotionIcon(LucideIcons.CheckCircle2, { scale: 1.15 });
export const Info = createMotionIcon(LucideIcons.Info, { scale: 1.15 });
export const Phone = createMotionIcon(LucideIcons.Phone, { scale: 1.15, rotate: [0, -10, 10, 0] });
export const Eye = createMotionIcon(LucideIcons.Eye, { scale: 1.15 });
export const EyeOff = createMotionIcon(LucideIcons.EyeOff, { scale: 1.15 });
export const Lock = createMotionIcon(LucideIcons.Lock, { scale: 1.15 });
export const BarChart3 = createMotionIcon(LucideIcons.BarChart3, { scale: 1.15, y: -2 });
export const CircleDot = createMotionIcon(LucideIcons.CircleDot, { scale: 1.2 });
export const Home = createMotionIcon(LucideIcons.Home, { scale: 1.18, y: -2 });
export const Radio = createMotionIcon(LucideIcons.Radio, { scale: 1.2, rotate: [0, -8, 8, 0] });
export const SlidersHorizontal = createMotionIcon(LucideIcons.SlidersHorizontal, { scale: 1.15 });
export const BadgeCheck = createMotionIcon(LucideIcons.BadgeCheck, { scale: 1.2, rotate: [0, -8, 8, 0] });
export const ClipboardCheck = createMotionIcon(LucideIcons.ClipboardCheck, { scale: 1.2, y: -2 });
export const UserCheck = createMotionIcon(LucideIcons.UserCheck, { scale: 1.2, y: -2 });
export const Crown = createMotionIcon(LucideIcons.Crown, { scale: 1.25, y: -3, rotate: [0, -6, 6, 0] });
export const Star = createMotionIcon(LucideIcons.Star, { scale: 1.2, rotate: [0, 15, -15, 0] });
export const Filter = createMotionIcon(LucideIcons.Filter, { scale: 1.15 });
export const BookOpen = createMotionIcon(LucideIcons.BookOpen, { scale: 1.18, y: -2 });
export const CheckCircle = CheckCircle2;
