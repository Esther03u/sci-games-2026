'use client';

import * as React from 'react';
import { motion } from 'motion/react';
import * as LucideIcons from 'lucide-react';

// Re-export core Animate UI components
export { AnimateIcon, IconWrapper, useAnimateIconContext } from '@/components/animate-ui/icons/icon';

// Re-export installed Animate UI official registry icons
export { Search, SearchIcon } from '@/components/animate-ui/icons/search';
export { Clock, ClockIcon } from '@/components/animate-ui/icons/clock';
export { MapPin, MapPinIcon } from '@/components/animate-ui/icons/map-pin';
export { Check, CheckIcon } from '@/components/animate-ui/icons/check';
export { Bell, BellIcon } from '@/components/animate-ui/icons/bell';
export { ChartLine, ChartLineIcon } from '@/components/animate-ui/icons/chart-line';
export { Activity, ActivityIcon } from '@/components/animate-ui/icons/activity';
export { Trash2, Trash2Icon } from '@/components/animate-ui/icons/trash-2';
export { Plus, PlusIcon } from '@/components/animate-ui/icons/plus';
export { X, XIcon } from '@/components/animate-ui/icons/x';
export { Menu, MenuIcon } from '@/components/animate-ui/icons/menu';
export { Timer, TimerIcon } from '@/components/animate-ui/icons/timer';
export { Sparkles, SparklesIcon } from '@/components/animate-ui/icons/sparkles';
export { Send, SendIcon } from '@/components/animate-ui/icons/send';
export { Users, UsersIcon } from '@/components/animate-ui/icons/users';
export { User, UserIcon } from '@/components/animate-ui/icons/user';

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
export const BadgeCheckIcon = BadgeCheck;
export const ClipboardCheck = createMotionIcon(LucideIcons.ClipboardCheck, { scale: 1.2, y: -2 });
export const UserCheck = createMotionIcon(LucideIcons.UserCheck, { scale: 1.2, y: -2 });
export const Crown = createMotionIcon(LucideIcons.Crown, { scale: 1.25, y: -3, rotate: [0, -6, 6, 0] });
export const Star = createMotionIcon(LucideIcons.Star, { scale: 1.2, rotate: [0, 15, -15, 0] });
export const Filter = createMotionIcon(LucideIcons.Filter, { scale: 1.15 });
export const CheckCircle = CheckCircle2;
