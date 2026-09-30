/**
 * Global Color System for Calory AI
 * Primary Brand Color: #298f50 (Forest / Athletic Emerald Green)
 */

export const AppColors = {
  // Brand Primary & Variations
  primary: '#298f50',
  primaryDark: '#1f6d3d',
  primaryDeep: '#185530',
  primaryLight: '#38a862',
  primaryLighter: '#4ec57c',
  primaryPale: '#eef9f2',

  // Opacity variations for primary color (RGB: 41, 143, 80)
  primarySoft: 'rgba(41, 143, 80, 0.12)',
  primaryMuted: 'rgba(41, 143, 80, 0.18)',
  primaryBorder: 'rgba(41, 143, 80, 0.35)',
  primaryGlow: 'rgba(41, 143, 80, 0.45)',

  // Brand Gradients
  primaryGradient: ['#38a862', '#298f50'] as const,
  primaryDarkGradient: ['#298f50', '#1c5c35'] as const,

  // Secondary & Accents
  accentCyan: '#06B6D4',
  accentLime: '#84CC16',
  accentAmber: '#F59E0B',

  // Dark Theme Surfaces (Modern Dribbble Luxury Aesthetic)
  background: '#090C10',
  surface: '#12161F',
  surfaceElevated: '#161B26',
  surfaceCard: '#1A2130',
  surfaceOverlay: 'rgba(9, 12, 16, 0.85)',

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.12)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textSubdued: '#475569',

  // Feedback & Status
  success: '#298f50',
  successSoft: 'rgba(41, 143, 80, 0.12)',
  successText: '#6ee7b7',
  error: '#EF4444',
  errorSoft: 'rgba(239, 68, 68, 0.12)',
  errorText: '#FCA5A5',
  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.12)',
  info: '#3B82F6',
  infoSoft: 'rgba(59, 130, 246, 0.12)',

  // Nutrition Macros (for future calorie & nutrient tracking)
  calories: '#298f50',
  protein: '#3B82F6',
  carbs: '#F59E0B',
  fat: '#EC4899',
  water: '#06B6D4',

  // Light Mode Equivalents (when light theme is active)
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#F1F5F9',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    border: 'rgba(0, 0, 0, 0.08)',
  },
} as const;

/**
 * Helper function to generate primary color with custom opacity.
 */
export function primaryRgba(alpha: number = 1): string {
  return `rgba(41, 143, 80, ${alpha})`;
}

export type ColorToken = keyof typeof AppColors;
export default AppColors;
