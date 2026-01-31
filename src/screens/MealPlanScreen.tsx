import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getCurrentUserCouple } from '../lib/supabase';
import { useMealPlan, MealPlanWithRecipe } from '../hooks/useMealPlan';
import { Button } from '../design-system';
import RecipeSelectModal from '../components/RecipeSelectModal';
import DraggableDayCard from '../components/DraggableDayCard';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../design-system/tokens';
import { getFontFamily } from '../design-system/fonts';
import { MealPlanSkeleton } from '../components/SkeletonLoader';
import { toast } from '../components/Toast';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Get the start of the week (Sunday) for a given date
 */
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

/**
 * Format date as YYYY-MM-DD
 */
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Format week range for display
 */
const formatWeekRange = (weekStart: Date): string => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
  const startDay = weekStart.getDate();
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
  const endDay = weekEnd.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
};

const CARD_HEIGHT = 156; // Height of day card + margin for drag calculations

export const MealPlanScreen: React.FC = () => {
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    getWeekStart(new Date())
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [draggedDayIndex, setDraggedDayIndex] = useState<number | null>(null);

  const {
    mealPlans,
    loading,
    error,
    getMealPlan,
    addMealToDay,
    removeMeal,
    reorderMeal,
    refreshMealPlan,
  } = useMealPlan();

  // Fetch couple on mount
  useEffect(() => {
    const fetchCouple = async () => {
      try {
        const couple = await getCurrentUserCouple();
        if (couple) {
          setCoupleId(couple.id);
        } else {
          Alert.alert(
            'No Partner Found',
            'You need to be paired with a partner to use the meal planner.'
          );
        }
      } catch (err) {
        console.error('Error fetching couple:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchCouple();
  }, []);

  // Fetch meal plan when couple or week changes
  useEffect(() => {
    if (coupleId) {
      const weekStartDate = formatDate(currentWeekStart);
      getMealPlan(coupleId, weekStartDate);
    }
  }, [coupleId, currentWeekStart, getMealPlan]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  const handleDayPress = (dayIndex: number, mealPlan?: MealPlanWithRecipe) => {
    if (mealPlan) {
      // Navigate to recipe detail (to be implemented)
      Alert.alert(
        mealPlan.recipe.title,
        'Recipe details screen coming soon!',
        [
          {
            text: 'Remove from Plan',
            style: 'destructive',
            onPress: () => handleRemoveMeal(mealPlan.id),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      // Open recipe selection modal
      setSelectedDay(dayIndex);
      setShowRecipeModal(true);
    }
  };

  const handleSelectRecipe = async (recipeId: string) => {
    if (coupleId && selectedDay !== null) {
      const weekStartDate = formatDate(currentWeekStart);
      await addMealToDay(coupleId, recipeId, selectedDay, weekStartDate);
    }
  };

  const handleRemoveMeal = async (mealPlanId: string) => {
    await removeMeal(mealPlanId);
  };

  const handleGenerateShoppingList = () => {
    Alert.alert(
      'Shopping List',
      'Shopping list generation coming soon!',
      [{ text: 'OK' }]
    );
  };

  const getMealsForDay = (dayIndex: number): MealPlanWithRecipe[] => {
    return mealPlans.filter((meal) => meal.day_of_week === dayIndex);
  };

  const handleDragStart = (dayIndex: number) => {
    setDraggedDayIndex(dayIndex);
  };

  const handleDragUpdate = (dayIndex: number, translationY: number) => {
    // Visual feedback during drag (handled by DraggableDayCard)
  };

  const handleDragEnd = async (dayIndex: number, translationY: number) => {
    const meals = getMealsForDay(dayIndex);
    const meal = meals[0];

    if (!meal) {
      setDraggedDayIndex(null);
      return;
    }

    // Calculate which day the card was dragged to
    const cardsMoved = Math.round(translationY / CARD_HEIGHT);
    const newDayIndex = Math.max(0, Math.min(6, dayIndex + cardsMoved));

    // Only reorder if moved to a different day
    if (newDayIndex !== dayIndex) {
      try {
        await reorderMeal(meal.id, newDayIndex, 0);
        Alert.alert(
          'Meal Moved',
          `Moved ${meal.recipe.title} to ${DAYS_OF_WEEK[newDayIndex]}`
        );
      } catch (err) {
        console.error('Error reordering meal:', err);
        Alert.alert('Error', 'Failed to move meal. Please try again.');
      }
    }

    setDraggedDayIndex(null);
  };

  const renderDayCard = (dayIndex: number) => {
    const meals = getMealsForDay(dayIndex);
    const dayName = DAYS_OF_WEEK[dayIndex];

    // For now, show only the first meal (support multiple meals in future)
    const meal = meals[0];

    return (
      <DraggableDayCard
        key={dayIndex}
        day={dayName}
        dayIndex={dayIndex}
        recipeId={meal?.recipe_id}
        recipeName={meal?.recipe.title}
        recipeImageUrl={meal?.recipe.image_url || undefined}
        onPress={() => handleDayPress(dayIndex, meal)}
        onDragStart={handleDragStart}
        onDragUpdate={handleDragUpdate}
        onDragEnd={handleDragEnd}
      />
    );
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Meal Plan</Text>
        </View>
        <ScrollView style={styles.scrollView}>
          <MealPlanSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!coupleId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👫</Text>
          <Text style={styles.emptyTitle}>No Partner Found</Text>
          <Text style={styles.emptySubtitle}>
            Pair with a partner to start planning meals together!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meal Plan</Text>
          <View style={styles.weekSelector}>
            <Pressable
              onPress={() => navigateWeek('prev')}
              style={styles.weekButton}
            >
              <Text style={styles.weekButtonText}>←</Text>
            </Pressable>
            <Text style={styles.weekLabel}>
              {formatWeekRange(currentWeekStart)}
            </Text>
            <Pressable
              onPress={() => navigateWeek('next')}
              style={styles.weekButton}
            >
              <Text style={styles.weekButtonText}>→</Text>
            </Pressable>
          </View>
        </View>

        {/* Week grid */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading && !mealPlans.length ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={colors.primary.terracotta}
              />
              <Text style={styles.loadingText}>Loading meals...</Text>
            </View>
          ) : (
            <View style={styles.weekGrid}>
              {DAYS_OF_WEEK.map((_, index) => renderDayCard(index))}
            </View>
          )}

          {/* Generate Shopping List Button */}
          <View style={styles.actionContainer}>
            <Button
              onPress={handleGenerateShoppingList}
              variant="terracotta"
              size="lg"
              fullWidth
              disabled={mealPlans.length === 0}
            >
              Generate Shopping List
            </Button>
            <Text style={styles.actionHint}>
              {mealPlans.length === 0
                ? 'Add meals to generate a shopping list'
                : `${mealPlans.length} meal${mealPlans.length === 1 ? '' : 's'} planned this week`}
            </Text>
          </View>
        </ScrollView>

        {/* Recipe Selection Modal */}
        <RecipeSelectModal
          visible={showRecipeModal}
          coupleId={coupleId}
          dayName={selectedDay !== null ? DAYS_OF_WEEK[selectedDay] : ''}
          onClose={() => {
            setShowRecipeModal(false);
            setSelectedDay(null);
          }}
          onSelectRecipe={handleSelectRecipe}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    ...shadows.sm,
  },
  headerTitle: {
    fontFamily: getFontFamily('display', 'semibold'),
    fontSize: typography.sizes['3xl'],
    color: colors.neutral.text.primary,
    marginBottom: spacing.md,
  },

  // Week selector
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  weekButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral.surface,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  weekButtonText: {
    fontFamily: getFontFamily('ui', 'bold'),
    fontSize: typography.sizes.xl,
    color: colors.primary.terracotta,
  },
  weekLabel: {
    fontFamily: getFontFamily('ui', 'semibold'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.primary,
  },

  // Scroll view
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },

  // Week grid
  weekGrid: {
    gap: spacing.md,
  },
  dayCardContainer: {
    marginBottom: spacing.xs,
  },

  // Actions
  actionContainer: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  actionHint: {
    fontFamily: getFontFamily('ui', 'normal'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.text.secondary,
    textAlign: 'center',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.secondary,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: getFontFamily('display', 'semibold'),
    fontSize: typography.sizes['2xl'],
    color: colors.neutral.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: getFontFamily('ui', 'normal'),
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
    color: colors.neutral.text.secondary,
    textAlign: 'center',
  },
});

export default MealPlanScreen;
