// Badge type definitions and all badge configurations

export type BadgeCategory = 'hours' | 'grinds' | 'streak';

export interface BadgeDefinition {
  id: string;
  category: BadgeCategory;
  threshold: number;
  title: string;
  description: string;
  svgFileName: string;
}

// All 18 badge definitions
export const BADGES: BadgeDefinition[] = [
  // Hours badges (6 total)
  {
    id: 'hours-1',
    category: 'hours',
    threshold: 1,
    title: 'First Hour',
    description: 'Record 1 hour total',
    svgFileName: 'grindhour1.svg',
  },
  {
    id: 'hours-5',
    category: 'hours',
    threshold: 5,
    title: '5 Hour Grinder',
    description: 'Record 5 hours total',
    svgFileName: 'grindhours5.svg',
  },
  {
    id: 'hours-10',
    category: 'hours',
    threshold: 10,
    title: 'Dedicated',
    description: 'Record 10 hours total',
    svgFileName: 'grindhours10.svg',
  },
  {
    id: 'hours-25',
    category: 'hours',
    threshold: 25,
    title: 'Committed',
    description: 'Record 25 hours total',
    svgFileName: 'grindhours25.svg',
  },
  {
    id: 'hours-50',
    category: 'hours',
    threshold: 50,
    title: 'Powerhouse',
    description: 'Record 50 hours total',
    svgFileName: 'grindhours50.svg',
  },
  {
    id: 'hours-100',
    category: 'hours',
    threshold: 100,
    title: 'Centurion',
    description: 'Record 100 hours total',
    svgFileName: 'grindhours100.svg',
  },

  // Grinds badges (7 total)
  {
    id: 'grinds-1',
    category: 'grinds',
    threshold: 1,
    title: 'First Grind',
    description: '  Complete 1 session',
    svgFileName: 'grinds1.svg',
  },
  {
    id: 'grinds-5',
    category: 'grinds',
    threshold: 5,
    title: 'Getting Started',
    description: 'Complete 5 sessions',
    svgFileName: 'grinds5.svg',
  },
  {
    id: 'grinds-10',
    category: 'grinds',
    threshold: 10,
    title: 'Consistent',
    description: 'Complete 10 sessions',
    svgFileName: 'grinds10.svg',
  },
  {
    id: 'grinds-20',
    category: 'grinds',
    threshold: 20,
    title: 'Focused',
    description: 'Complete 20 sessions',
    svgFileName: 'grinds20.svg',
  },
  {
    id: 'grinds-50',
    category: 'grinds',
    threshold: 50,
    title: 'Half Century',
    description: 'Complete 50 sessions',
    svgFileName: 'grinds50.svg',
  },
  {
    id: 'grinds-75',
    category: 'grinds',
    threshold: 75,
    title: 'Unstoppable',
    description: 'Complete 75 sessions',
    svgFileName: 'grinds75.svg',
  },
  {
    id: 'grinds-100',
    category: 'grinds',
    threshold: 100,
    title: 'Grind Master',
    description: 'Complete 100 sessions',
    svgFileName: 'grinds100.svg',
  },

  // Streak badges (5 total)
  {
    id: 'streak-3',
    category: 'streak',
    threshold: 3,
    title: '3 Day Streak',
    description: 'Maintain a 3 day streak',
    svgFileName: 'streak3.svg',
  },
  {
    id: 'streak-5',
    category: 'streak',
    threshold: 5,
    title: '5 Day Streak',
    description: 'Maintain a 5 day streak',
    svgFileName: 'streak5.svg',
  },
  {
    id: 'streak-10',
    category: 'streak',
    threshold: 10,
    title: '10 Day Streak',
    description: 'Maintain a 10 day streak',
    svgFileName: 'streak10.svg',
  },
  {
    id: 'streak-21',
    category: 'streak',
    threshold: 21,
    title: 'Habit Formed',
    description: 'Maintain a 21 day streak',
    svgFileName: 'streak21.svg',
  },
  {
    id: 'streak-30',
    category: 'streak',
    threshold: 30,
    title: 'Monthly Master',
    description: 'Maintain a 30 day streak',
    svgFileName: 'streak30.svg',
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

// Helper: Get badge SVG path
export const getBadgeSvgPath = (svgFileName: string): string => {
  return `assets/images/lockinbadges/${svgFileName}`;
};
