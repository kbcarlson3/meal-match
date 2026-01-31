/**
 * Design System Example Usage
 *
 * This file demonstrates how to use the Meal Match design system components.
 * You can use this as a reference when building screens.
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Button,
  RecipeSwipeCard,
  MatchAnimation,
  DayCard,
  colors,
  spacing,
  useMealMatchFonts,
  type Recipe,
} from './index';

export const DesignSystemExample = () => {
  const fontsLoaded = useMealMatchFonts();
  const [showMatch, setShowMatch] = useState(false);

  if (!fontsLoaded) {
    return null;
  }

  // Sample recipe data
  const sampleRecipe: Recipe = {
    id: '1',
    name: 'Classic Pasta Carbonara',
    category: 'Italian',
    area: 'Italy',
    cookTime: 30,
    imageUrl: 'https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg',
    difficulty: 'Medium',
  };

  const sampleRecipe2: Recipe = {
    id: '2',
    name: 'Authentic Tiramisu',
    category: 'Dessert',
    area: 'Italy',
    cookTime: 45,
    imageUrl: 'https://www.themealdb.com/images/media/meals/xvsurr1511719182.jpg',
    difficulty: 'Easy',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Buttons Section */}
      <View style={styles.section}>
        <Button
          onPress={() => Alert.alert('Terracotta Button Pressed')}
          variant="terracotta"
          size="lg"
        >
          Primary Action
        </Button>

        <Button
          onPress={() => Alert.alert('Sage Button Pressed')}
          variant="sage"
          size="md"
        >
          Secondary Action
        </Button>

        <Button
          onPress={() => Alert.alert('Outline Button Pressed')}
          variant="outline"
          size="md"
        >
          Outline Button
        </Button>

        <Button
          onPress={() => Alert.alert('Ghost Button Pressed')}
          variant="ghost"
          size="sm"
        >
          Ghost Button
        </Button>

        <Button
          onPress={() => {}}
          variant="terracotta"
          size="md"
          loading
        >
          Loading...
        </Button>
      </View>

      {/* Recipe Swipe Card */}
      <View style={styles.section}>
        <RecipeSwipeCard recipe={sampleRecipe} />
      </View>

      {/* Day Cards */}
      <View style={styles.section}>
        {/* Empty day card */}
        <DayCard
          day="Monday"
          onPress={() => Alert.alert('Add meal for Monday')}
        />

        {/* Filled day card */}
        <DayCard
          day="Tuesday"
          recipeId={sampleRecipe.id}
          recipeName={sampleRecipe.name}
          recipeImageUrl={sampleRecipe.imageUrl}
          onPress={() => Alert.alert('View Tuesday meal')}
        />
      </View>

      {/* Match Animation Trigger */}
      <View style={styles.section}>
        <Button
          onPress={() => setShowMatch(true)}
          variant="terracotta"
          size="md"
        >
          Show Match Animation
        </Button>
      </View>

      {/* Match Animation Overlay */}
      <MatchAnimation
        visible={showMatch}
        onComplete={() => setShowMatch(false)}
        recipe1ImageUrl={sampleRecipe.imageUrl}
        recipe2ImageUrl={sampleRecipe2.imageUrl}
        recipe1Name={sampleRecipe.name}
        recipe2Name={sampleRecipe2.name}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  content: {
    padding: spacing.xl,
    gap: spacing['2xl'],
  },
  section: {
    gap: spacing.md,
  },
});

export default DesignSystemExample;
