import { BadgeCategory, BadgeDefinition } from '@/constants/Badges';

export type AnalyticsTab = 'daily' | 'weekly' | 'monthly';

export interface StatItem {
  label: string;
  value: string;
  subtitle?: string;
  subtitleColor?: string;
  icon?: string;
  iconFamily?: 'Ionicons' | 'MaterialCommunityIcons';
}

export interface HourlyData {
  hour: number;
  minutes: number;
}

export interface BadgeProgressItem {
  category: BadgeCategory;
  badge: BadgeDefinition;
  current: number;
  target: number;
  progress: number; // 0-1
}
