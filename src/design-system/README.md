# Meal Match Design System

**"Kitchen Table Romance"** - Warm, organic minimalism with playful food-inspired accents.

## Philosophy

This design system avoids sterile tech colors in favor of farmers market warmth. Think sun-drenched kitchen counters, handwritten recipe cards, and the organic imperfection of homemade meals.

## Color Palette

### Primary Colors
- **Terracotta** (`#D4634E`) - Main accent color, warm and inviting
- Light & Dark variants available

### Secondary Colors
- **Sage** (`#8B9D83`) - Calming, herbal accent
- Light & Dark variants available

### Accent Colors
- **Golden** (`#E8B445`) - Highlight color, reminiscent of honey and saffron

### Neutrals
- Warm off-whites and creams for backgrounds
- Brown-based text colors for warmth

## Typography

### Font Families

1. **Fraunces** (Display)
   - Playful serif for headings
   - Weights: Regular (400), Medium (500), SemiBold (600), Bold (700)

2. **Newsreader** (Body)
   - Editorial serif for readability
   - Weights: Regular (400), Medium (500), SemiBold (600), Bold (700)

3. **DM Sans** (UI)
   - Geometric but warm for UI elements
   - Weights: Regular (400), Medium (500), Bold (700)

### Usage

```tsx
import { getFontFamily } from './design-system/fonts';

const styles = StyleSheet.create({
  heading: {
    fontFamily: getFontFamily('display', 'bold'),
  },
  body: {
    fontFamily: getFontFamily('body', 'normal'),
  },
  button: {
    fontFamily: getFontFamily('ui', 'medium'),
  },
});
```

## Components

### Button

Animated button with spring interactions.

```tsx
import { Button } from './design-system';

<Button
  onPress={() => {}}
  variant="terracotta" // terracotta | sage | outline | ghost
  size="md" // sm | md | lg
  loading={false}
  disabled={false}
  fullWidth={false}
>
  Press Me
</Button>
```

**Variants:**
- `terracotta` - Primary action button
- `sage` - Secondary action button
- `outline` - Outlined button with transparent background
- `ghost` - Minimal button with no background

**Sizes:**
- `sm` - Small (36px height)
- `md` - Medium (48px height)
- `lg` - Large (56px height)

### RecipeSwipeCard

Full-screen swipeable card for recipe browsing.

```tsx
import { RecipeSwipeCard, Recipe } from './design-system';

const recipe: Recipe = {
  id: '1',
  name: 'Pasta Carbonara',
  category: 'Italian',
  area: 'Italy',
  cookTime: 30,
  imageUrl: 'https://...',
  difficulty: 'Medium',
};

<RecipeSwipeCard recipe={recipe} />
```

**Features:**
- Recipe photo background with organic gradient overlay
- Title and metadata display
- Spring entrance animation
- Responsive to screen dimensions

### MatchAnimation

"It's a Match!" celebration overlay.

```tsx
import { MatchAnimation } from './design-system';

<MatchAnimation
  visible={showMatch}
  onComplete={() => setShowMatch(false)}
  recipe1ImageUrl="https://..."
  recipe2ImageUrl="https://..."
  recipe1Name="Pasta Carbonara"
  recipe2Name="Tiramisu"
/>
```

**Features:**
- Warm blur background with gradient
- Floating hearts animation (15 hearts)
- Recipe photos burst effect
- Auto-dismisses after 3.5 seconds
- Terracotta/sage color scheme

### DayCard

Meal plan day card with drag support.

```tsx
import { DayCard } from './design-system';

// Empty state
<DayCard
  day="Monday"
  onPress={() => {}}
/>

// Filled state
<DayCard
  day="Monday"
  recipeId="123"
  recipeName="Pasta Carbonara"
  recipeImageUrl="https://..."
  onPress={() => {}}
  isDragging={false}
/>
```

**Features:**
- Empty state with dashed borders
- Filled state with recipe photo and gradient
- Day label badge
- Drag handle indicator
- Spring animations on press and drag

## Design Tokens

### Spacing
```ts
spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
}
```

### Border Radius
```ts
borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
}
```

### Shadows
Soft, organic shadows inspired by food photography lighting.

- `shadows.sm` - Subtle elevation
- `shadows.md` - Medium elevation (default for cards)
- `shadows.lg` - High elevation (modals, overlays)

### Animations

```ts
animations = {
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  gentle: {
    duration: 300,
    easing: 'ease-in-out',
  },
  quick: {
    duration: 150,
    easing: 'ease-out',
  },
}
```

## Gradients

Pre-configured gradient presets:

```ts
gradients = {
  recipeOverlay: [
    'rgba(58, 50, 48, 0)',
    'rgba(58, 50, 48, 0.4)',
    'rgba(58, 50, 48, 0.8)',
  ],
  warmGlow: [
    colors.accent.goldenLight + '20',
    colors.primary.terracottaLight + '20',
  ],
}
```

## Usage Example

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import {
  Button,
  RecipeSwipeCard,
  MatchAnimation,
  DayCard,
  colors,
  spacing,
  typography,
  getFontFamily,
  useMealMatchFonts,
} from './design-system';

export default function App() {
  const fontsLoaded = useMealMatchFonts();

  if (!fontsLoaded) {
    return null; // or loading screen
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.background }}>
      {/* Your app content */}
    </View>
  );
}
```

## Dependencies

This design system requires:
- `react-native-reanimated` - For spring animations
- `expo-linear-gradient` - For gradient overlays
- `expo-blur` - For blur effects
- `@expo-google-fonts/fraunces` - Display font
- `@expo-google-fonts/newsreader` - Body font
- `@expo-google-fonts/dm-sans` - UI font
- `expo-font` - Font loading

All dependencies are already installed in the project.
