import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../design-system/tokens';

/**
 * Shimmer animation for skeleton loaders
 */
function Shimmer({ width, height, style }: { width?: number | string; height: number; style?: any }) {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    shimmerAnimation.start();

    return () => shimmerAnimation.stop();
  }, [shimmerValue]);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View
      style={[
        styles.shimmerContainer,
        { width: width || '100%', height },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

/**
 * Skeleton loader for recipe cards
 */
export function RecipeCardSkeleton() {
  return (
    <View style={styles.recipeCard}>
      <Shimmer height={400} style={styles.recipeImage} />
      <View style={styles.recipeInfo}>
        <Shimmer height={24} width="80%" style={styles.recipeTitle} />
        <Shimmer height={16} width="60%" style={styles.recipeMeta} />
      </View>
    </View>
  );
}

/**
 * Skeleton loader for meal plan day cards
 */
export function MealPlanSkeleton() {
  return (
    <View style={styles.mealPlanContainer}>
      {[...Array(7)].map((_, index) => (
        <View key={index} style={styles.dayCard}>
          <Shimmer height={16} width={60} style={styles.dayLabel} />
          <View style={styles.dayMeals}>
            <Shimmer height={100} style={styles.mealItem} />
            <Shimmer height={100} style={styles.mealItem} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton loader for shopping list
 */
export function ShoppingListSkeleton() {
  return (
    <View style={styles.shoppingListContainer}>
      {[...Array(5)].map((_, categoryIndex) => (
        <View key={categoryIndex} style={styles.category}>
          <Shimmer height={20} width={120} style={styles.categoryHeader} />
          <View style={styles.categoryItems}>
            {[...Array(4)].map((_, itemIndex) => (
              <View key={itemIndex} style={styles.listItem}>
                <Shimmer height={20} width={20} style={styles.checkbox} />
                <View style={styles.itemText}>
                  <Shimmer height={16} width="70%" style={styles.itemName} />
                  <Shimmer height={12} width="40%" style={styles.itemMeasure} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton loader for matches/recipe list
 */
export function RecipeListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.recipeListContainer}>
      {[...Array(count)].map((_, index) => (
        <View key={index} style={styles.recipeListItem}>
          <Shimmer height={80} width={80} style={styles.recipeListImage} />
          <View style={styles.recipeListInfo}>
            <Shimmer height={18} width="90%" style={styles.recipeListTitle} />
            <Shimmer height={14} width="60%" style={styles.recipeListMeta} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Generic skeleton box
 */
export function SkeletonBox({
  width = '100%',
  height = 20,
  style,
}: {
  width?: number | string;
  height?: number;
  style?: any;
}) {
  return <Shimmer width={width} height={height} style={style} />;
}

const styles = StyleSheet.create({
  shimmerContainer: {
    backgroundColor: colors.neutral.border,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  shimmer: {
    width: 300,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ skewX: '-20deg' }],
  },

  // Recipe Card Skeleton
  recipeCard: {
    backgroundColor: colors.neutral.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
    marginBottom: spacing.md,
  },
  recipeImage: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  recipeInfo: {
    padding: spacing.md,
  },
  recipeTitle: {
    marginBottom: spacing.sm,
  },
  recipeMeta: {},

  // Meal Plan Skeleton
  mealPlanContainer: {
    padding: spacing.md,
  },
  dayCard: {
    marginBottom: spacing.lg,
  },
  dayLabel: {
    marginBottom: spacing.sm,
  },
  dayMeals: {
    gap: spacing.sm,
  },
  mealItem: {
    borderRadius: borderRadius.md,
  },

  // Shopping List Skeleton
  shoppingListContainer: {
    padding: spacing.md,
  },
  category: {
    marginBottom: spacing.xl,
  },
  categoryHeader: {
    marginBottom: spacing.md,
  },
  categoryItems: {
    gap: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  checkbox: {
    borderRadius: borderRadius.sm,
  },
  itemText: {
    flex: 1,
    gap: spacing.xs,
  },
  itemName: {},
  itemMeasure: {},

  // Recipe List Skeleton
  recipeListContainer: {
    padding: spacing.md,
  },
  recipeListItem: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  recipeListImage: {
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  recipeListInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  recipeListTitle: {},
  recipeListMeta: {},
});
