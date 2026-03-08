// Badge type definitions and all badge configurations

export type BadgeCategory = 'hours' | 'grinds' | 'streak';

export interface BadgeDefinition {
  id: string;
  category: BadgeCategory;
  threshold: number;
  title: string;
  description: string;
  imageFileName: string;
}

// All 23 badge definitions (8 hours + 8 grinds + 7 streak)
export const BADGES: BadgeDefinition[] = [
  // Hours badges (8 total)
  {
    id: 'hours-3',
    category: 'hours',
    threshold: 3,
    title: '3 Hours',
    description: 'Record 3 hours total',
    imageFileName: '3_hours.png',
  },
  {
    id: 'hours-5',
    category: 'hours',
    threshold: 5,
    title: '5 Hour Grinder',
    description: 'Record 5 hours total',
    imageFileName: '5_hours.png',
  },
  {
    id: 'hours-10',
    category: 'hours',
    threshold: 10,
    title: 'Dedicated',
    description: 'Record 10 hours total',
    imageFileName: '10_hours.png',
  },
  {
    id: 'hours-25',
    category: 'hours',
    threshold: 25,
    title: 'Committed',
    description: 'Record 25 hours total',
    imageFileName: '25_hours.png',
  },
  {
    id: 'hours-40',
    category: 'hours',
    threshold: 40,
    title: 'Relentless',
    description: 'Record 40 hours total',
    imageFileName: '40_hours.png',
  },
  {
    id: 'hours-50',
    category: 'hours',
    threshold: 50,
    title: 'Powerhouse',
    description: 'Record 50 hours total',
    imageFileName: '50_hours.png',
  },
  {
    id: 'hours-75',
    category: 'hours',
    threshold: 75,
    title: 'Elite',
    description: 'Record 75 hours total',
    imageFileName: '75_hours.png',
  },
  {
    id: 'hours-100',
    category: 'hours',
    threshold: 100,
    title: 'Centurion',
    description: 'Record 100 hours total',
    imageFileName: '100_hours.png',
  },

  // Grinds badges (8 total)
  {
    id: 'grinds-1',
    category: 'grinds',
    threshold: 1,
    title: 'First Grind',
    description: 'Complete 1 session',
    imageFileName: 'Grind_1.png',
  },
  {
    id: 'grinds-5',
    category: 'grinds',
    threshold: 5,
    title: 'Getting Started',
    description: 'Complete 5 sessions',
    imageFileName: 'Grind_5.png',
  },
  {
    id: 'grinds-10',
    category: 'grinds',
    threshold: 10,
    title: 'Consistent',
    description: 'Complete 10 sessions',
    imageFileName: 'Grind_10.png',
  },
  {
    id: 'grinds-20',
    category: 'grinds',
    threshold: 20,
    title: 'Focused',
    description: 'Complete 20 sessions',
    imageFileName: 'Grind_20.png',
  },
  {
    id: 'grinds-30',
    category: 'grinds',
    threshold: 30,
    title: 'Determined',
    description: 'Complete 30 sessions',
    imageFileName: 'Grind_30.png',
  },
  {
    id: 'grinds-50',
    category: 'grinds',
    threshold: 50,
    title: 'Half Century',
    description: 'Complete 50 sessions',
    imageFileName: 'Grind_50.png',
  },
  {
    id: 'grinds-75',
    category: 'grinds',
    threshold: 75,
    title: 'Unstoppable',
    description: 'Complete 75 sessions',
    imageFileName: 'Grind_75.png',
  },
  {
    id: 'grinds-100',
    category: 'grinds',
    threshold: 100,
    title: 'Grind Master',
    description: 'Complete 100 sessions',
    imageFileName: 'Grind_100.png',
  },

  // Streak badges (7 total)
  {
    id: 'streak-3',
    category: 'streak',
    threshold: 3,
    title: '3 Day Streak',
    description: 'You showed up 3 days in a row — momentum is building',
    imageFileName: '3_streak.png',
  },
  {
    id: 'streak-5',
    category: 'streak',
    threshold: 5,
    title: '5 Day Streak',
    description: 'A full work week of focus — you\'re getting serious',
    imageFileName: '5_streak.png',
  },
  {
    id: 'streak-10',
    category: 'streak',
    threshold: 10,
    title: '10 Day Streak',
    description: 'Double digits — discipline is becoming your default',
    imageFileName: '10_streak.png',
  },
  {
    id: 'streak-21',
    category: 'streak',
    threshold: 21,
    title: 'Habit Formed',
    description: '21 days in — they say that\'s when habits stick',
    imageFileName: '21_streak.png',
  },
  {
    id: 'streak-30',
    category: 'streak',
    threshold: 30,
    title: 'Monthly Master',
    description: 'A full month locked in — you\'re built different',
    imageFileName: '30_streak.png',
  },
  {
    id: 'streak-40',
    category: 'streak',
    threshold: 40,
    title: 'Iron Will',
    description: '40 days of pure consistency — nothing can break you',
    imageFileName: '40_streak.png',
  },
  {
    id: 'streak-50',
    category: 'streak',
    threshold: 50,
    title: 'Legendary',
    description: '50 days straight — this is what legends are made of',
    imageFileName: '50_streak.png',
  },
];

// Helper: Get badges by category
export const BADGES_BY_CATEGORY: Record<BadgeCategory, BadgeDefinition[]> = {
  hours: BADGES.filter((b) => b.category === 'hours'),
  grinds: BADGES.filter((b) => b.category === 'grinds'),
  streak: BADGES.filter((b) => b.category === 'streak'),
};

// Helper: Get badge by ID
export const getBadgeById = (id: string): BadgeDefinition | undefined => {
  return BADGES.find((b) => b.id === id);
};

// Helper: Get badge image path
export const getBadgeImagePath = (badge: BadgeDefinition): string => {
  switch (badge.category) {
    case 'hours':
      return `assets/images/grindhours/${badge.imageFileName}`;
    case 'grinds':
      return `assets/images/number_0f_grinds/${badge.imageFileName}`;
    case 'streak':
      return `assets/images/streak_badges/${badge.imageFileName}`;
  }
};
