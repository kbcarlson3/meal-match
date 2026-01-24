/**
 * Meal Match Design System - "Kitchen Table Romance"
 *
 * Warm, organic minimalism with playful food-inspired accents.
 * Avoiding sterile tech colors in favor of farmers market warmth.
 */

export const colors = {
  // Primary Colors
  primary: {
    terracotta: '#D4634E',
    terracottaLight: '#E88A78',
    terracottaDark: '#B54A36',
  },

  // Secondary Colors
  secondary: {
    sage: '#8B9D83',
    sageLight: '#A8B9A1',
    sageDark: '#6F8367',
  },

  // Accent Colors
  accent: {
    golden: '#E8B445',
    goldenLight: '#F0C86A',
    goldenDark: '#D49E2E',
  },

  // Neutrals - Warm off-whites and creams
  neutral: {
    background: '#FFF8F0',      // Warm cream
    surface: '#FFFFFF',         // Pure white for cards
    border: '#E8DED0',          // Soft taupe
    text: {
      primary: '#3A3230',       // Warm dark brown
      secondary: '#6B5F5A',     // Medium brown
      tertiary: '#9D9188',      // Light brown
    },
  },

  // Semantic Colors
  semantic: {
    success: '#7C9473',         // Muted green
    error: '#C85A4F',           // Muted red
    warning: '#E8B445',         // Golden yellow
    info: '#7A8B9D',            // Muted blue
  },

  // Overlay Colors
  overlay: {
    dark: 'rgba(58, 50, 48, 0.6)',
    light: 'rgba(255, 248, 240, 0.9)',
    blur: 'rgba(255, 248, 240, 0.95)',
  },
};

export const typography = {
  // Font Families
  families: {
    display: 'Fraunces',        // Playful serif for headings
    body: 'Newsreader',          // Editorial serif for readability
    ui: 'DMSans',                // Geometric but warm for UI
  },

  // Font Sizes
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font Weights
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  // Soft, organic shadows (food photography lighting)
  sm: {
    shadowColor: colors.neutral.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.neutral.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.neutral.text.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const animations = {
  // Spring animations (ingredients settling)
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },

  // Gentle transitions (stir, fold, simmer)
  gentle: {
    duration: 300,
    easing: 'ease-in-out',
  },

  // Quick interactions
  quick: {
    duration: 150,
    easing: 'ease-out',
  },
};

// Gradient presets for recipe cards
export const gradients = {
  recipeOverlay: [
    'rgba(58, 50, 48, 0)',
    'rgba(58, 50, 48, 0.4)',
    'rgba(58, 50, 48, 0.8)',
  ],
  warmGlow: [
    colors.accent.goldenLight + '20',
    colors.primary.terracottaLight + '20',
  ],
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  gradients,
};
