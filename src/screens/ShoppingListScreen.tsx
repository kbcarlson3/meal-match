import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserCouple } from '../lib/supabase';
import {
  useShoppingList,
  getWeekStartDate,
  getWeekOffset,
  formatWeekRange,
} from '../hooks/useShoppingList';
import {
  AggregatedIngredient,
  IngredientCategory,
  formatShoppingList,
} from '../utils/aggregateIngredients';
import { colors, typography, spacing, borderRadius, shadows } from '../design-system/tokens';
import { getFontFamily } from '../design-system/fonts';
import { Button } from '../design-system/Button';
import { ShoppingListSkeleton } from '../components/SkeletonLoader';
import { toast } from '../components/Toast';

const STORAGE_KEY_PREFIX = 'shopping_list_checked_';

export const ShoppingListScreen: React.FC = () => {
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [weekStartDate, setWeekStartDate] = useState<string>(getWeekStartDate());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [loadingCouple, setLoadingCouple] = useState(true);

  const { shoppingList, loading, error, refresh } = useShoppingList(coupleId, weekStartDate);

  // Fetch couple on mount
  useEffect(() => {
    fetchCouple();
  }, []);

  // Load checked items from storage when week changes
  useEffect(() => {
    loadCheckedItems();
  }, [weekStartDate]);

  const fetchCouple = async () => {
    try {
      setLoadingCouple(true);
      const couple = await getCurrentUserCouple();
      if (couple) {
        setCoupleId(couple.id);
      }
    } catch (err) {
      console.error('Error fetching couple:', err);
    } finally {
      setLoadingCouple(false);
    }
  };

  const loadCheckedItems = async () => {
    try {
      const key = `${STORAGE_KEY_PREFIX}${weekStartDate}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        setCheckedItems(new Set(JSON.parse(stored)));
      } else {
        setCheckedItems(new Set());
      }
    } catch (err) {
      console.error('Error loading checked items:', err);
    }
  };

  const saveCheckedItems = async (items: Set<string>) => {
    try {
      const key = `${STORAGE_KEY_PREFIX}${weekStartDate}`;
      await AsyncStorage.setItem(key, JSON.stringify([...items]));
    } catch (err) {
      console.error('Error saving checked items:', err);
    }
  };

  const toggleItem = (ingredientKey: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(ingredientKey)) {
      newChecked.delete(ingredientKey);
    } else {
      newChecked.add(ingredientKey);
    }
    setCheckedItems(newChecked);
    saveCheckedItems(newChecked);
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Clear All Items',
      'Are you sure you want to uncheck all items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setCheckedItems(new Set());
            saveCheckedItems(new Set());
          },
        },
      ]
    );
  };

  const handleUncheckAll = () => {
    setCheckedItems(new Set());
    saveCheckedItems(new Set());
  };

  const handleExport = async () => {
    const formattedList = formatShoppingList(shoppingList);
    const weekRange = formatWeekRange(weekStartDate);
    const fullText = `Shopping List - ${weekRange}\n\n${formattedList}`;

    Alert.alert(
      'Export Shopping List',
      'How would you like to export?',
      [
        {
          text: 'Copy to Clipboard',
          onPress: () => {
            Clipboard.setString(fullText);
            Alert.alert('Success', 'Shopping list copied to clipboard!');
          },
        },
        {
          text: 'Share',
          onPress: async () => {
            try {
              await Share.share({
                message: fullText,
                title: `Shopping List - ${weekRange}`,
              });
            } catch (err) {
              console.error('Error sharing:', err);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handlePreviousWeek = () => {
    setWeekStartDate(getWeekOffset(weekStartDate, -1));
  };

  const handleNextWeek = () => {
    setWeekStartDate(getWeekOffset(weekStartDate, 1));
  };

  const handleCurrentWeek = () => {
    setWeekStartDate(getWeekStartDate());
  };

  const getIngredientKey = (ingredient: AggregatedIngredient, category: IngredientCategory) => {
    return `${category}-${ingredient.ingredient}-${ingredient.measure}`;
  };

  const getTotalItems = () => {
    return Object.values(shoppingList).reduce((sum, items) => sum + items.length, 0);
  };

  const getCheckedCount = () => {
    return checkedItems.size;
  };

  if (loadingCouple) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Shopping List</Text>
        </View>
        <ScrollView style={styles.content}>
          <ShoppingListSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (!coupleId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Couple Found</Text>
        <Text style={styles.emptyText}>
          You need to be paired with a partner to create shopping lists.
        </Text>
      </View>
    );
  }

  const totalItems = getTotalItems();
  const checkedCount = getCheckedCount();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shopping List</Text>

        {/* Week Selector */}
        <View style={styles.weekSelector}>
          <TouchableOpacity style={styles.weekButton} onPress={handlePreviousWeek}>
            <Text style={styles.weekButtonText}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.weekCurrent} onPress={handleCurrentWeek}>
            <Text style={styles.weekText}>{formatWeekRange(weekStartDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.weekButton} onPress={handleNextWeek}>
            <Text style={styles.weekButtonText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Progress */}
        {totalItems > 0 && (
          <View style={styles.progress}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(checkedCount / totalItems) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {checkedCount} of {totalItems} items checked
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <ScrollView style={styles.content}>
          <ShoppingListSkeleton />
        </ScrollView>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Error</Text>
          <Text style={styles.emptyText}>{error.message}</Text>
          <Button onPress={refresh} variant="terracotta" size="md">
            Try Again
          </Button>
        </View>
      ) : totalItems === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>No Meal Plan</Text>
          <Text style={styles.emptyText}>
            Add recipes to your meal plan for this week to generate a shopping list.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Categories */}
            {(['Produce', 'Protein', 'Dairy', 'Pantry', 'Spices'] as IngredientCategory[]).map(
              category => {
                const items = shoppingList[category];
                if (items.length === 0) return null;

                return (
                  <View key={category} style={styles.category}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryTitle}>{category}</Text>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{items.length}</Text>
                      </View>
                    </View>

                    <View style={styles.ingredientsList}>
                      {items.map(ingredient => {
                        const key = getIngredientKey(ingredient, category);
                        const isChecked = checkedItems.has(key);

                        return (
                          <TouchableOpacity
                            key={key}
                            style={styles.ingredientItem}
                            onPress={() => toggleItem(key)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.checkbox}>
                              {isChecked && <View style={styles.checkboxChecked} />}
                            </View>
                            <View style={styles.ingredientContent}>
                              <Text
                                style={[
                                  styles.ingredientName,
                                  isChecked && styles.ingredientNameChecked,
                                ]}
                              >
                                {ingredient.ingredient}
                              </Text>
                              <Text
                                style={[
                                  styles.ingredientMeasure,
                                  isChecked && styles.ingredientMeasureChecked,
                                ]}
                              >
                                {ingredient.measure}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              }
            )}
          </View>
        </ScrollView>
      )}

      {/* Actions */}
      {totalItems > 0 && (
        <View style={styles.actions}>
          <View style={styles.actionsRow}>
            <Button
              onPress={handleUncheckAll}
              variant="outline"
              size="md"
              style={styles.actionButton}
            >
              Uncheck All
            </Button>
            <Button
              onPress={handleClearAll}
              variant="ghost"
              size="md"
              style={styles.actionButton}
            >
              Clear
            </Button>
          </View>
          <Button onPress={handleExport} variant="terracotta" size="lg" fullWidth>
            Export List
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontFamily: getFontFamily('body', 'normal'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: getFontFamily('display', 'semibold'),
    fontSize: typography.sizes['2xl'],
    color: colors.neutral.text.primary,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: getFontFamily('body', 'normal'),
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
    color: colors.neutral.text.secondary,
    textAlign: 'center',
    maxWidth: 300,
  },
  header: {
    padding: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: colors.neutral.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  title: {
    fontFamily: getFontFamily('display', 'bold'),
    fontSize: typography.sizes['3xl'],
    lineHeight: typography.sizes['3xl'] * typography.lineHeights.tight,
    color: colors.neutral.text.primary,
    marginBottom: spacing.lg,
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  weekButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  weekButtonText: {
    fontFamily: getFontFamily('ui', 'bold'),
    fontSize: typography.sizes.xl,
    color: colors.primary.terracotta,
  },
  weekCurrent: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.terracotta,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  weekText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.base,
    color: colors.neutral.surface,
  },
  progress: {
    gap: spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.neutral.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.semantic.success,
    borderRadius: borderRadius.sm,
  },
  progressText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.text.secondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  category: {
    marginBottom: spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  categoryTitle: {
    fontFamily: getFontFamily('display', 'semibold'),
    fontSize: typography.sizes.xl,
    lineHeight: typography.sizes.xl * typography.lineHeights.tight,
    color: colors.neutral.text.primary,
  },
  categoryBadge: {
    backgroundColor: colors.primary.terracotta,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  categoryBadgeText: {
    fontFamily: getFontFamily('ui', 'bold'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.surface,
  },
  ingredientsList: {
    gap: spacing.sm,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.neutral.surface,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary.terracotta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: colors.primary.terracotta,
  },
  ingredientContent: {
    flex: 1,
  },
  ingredientName: {
    fontFamily: getFontFamily('body', 'medium'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.primary,
    marginBottom: 2,
  },
  ingredientNameChecked: {
    textDecorationLine: 'line-through',
    color: colors.neutral.text.tertiary,
  },
  ingredientMeasure: {
    fontFamily: getFontFamily('ui', 'normal'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.text.secondary,
  },
  ingredientMeasureChecked: {
    color: colors.neutral.text.tertiary,
  },
  actions: {
    padding: spacing.xl,
    paddingBottom: spacing.xl,
    backgroundColor: colors.neutral.surface,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    gap: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});

export default ShoppingListScreen;
