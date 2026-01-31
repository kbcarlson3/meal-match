import { useState, useEffect } from 'react';
import { supabase, Recipe, Ingredient } from '../lib/supabase';
import { aggregateIngredients, CategorizedIngredients } from '../utils/aggregateIngredients';

export interface UseShoppingListResult {
  shoppingList: CategorizedIngredients;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Generate shopping list from meal plan for a specific week
 */
export function useShoppingList(
  coupleId: string | null,
  weekStartDate: string
): UseShoppingListResult {
  const [shoppingList, setShoppingList] = useState<CategorizedIngredients>({
    Produce: [],
    Protein: [],
    Dairy: [],
    Pantry: [],
    Spices: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const generateShoppingList = async () => {
    if (!coupleId) {
      setError(new Error('No couple ID provided'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all meal plans for the week
      const { data: mealPlans, error: mealPlanError } = await supabase
        .from('meal_plans')
        .select(
          `
          *,
          recipe:recipes(*)
        `
        )
        .eq('couple_id', coupleId)
        .eq('week_start_date', weekStartDate);

      if (mealPlanError) throw mealPlanError;

      if (!mealPlans || mealPlans.length === 0) {
        setShoppingList({
          Produce: [],
          Protein: [],
          Dairy: [],
          Pantry: [],
          Spices: [],
        });
        setLoading(false);
        return;
      }

      // Extract recipes with ingredients
      const recipesWithIngredients = mealPlans
        .filter(mp => mp.recipe)
        .map(mp => ({
          id: mp.recipe.id,
          ingredients: mp.recipe.ingredients as Ingredient[],
        }));

      // Aggregate ingredients
      const aggregated = aggregateIngredients(recipesWithIngredients);
      setShoppingList(aggregated);
    } catch (err) {
      console.error('Error generating shopping list:', err);
      setError(err instanceof Error ? err : new Error('Failed to generate shopping list'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateShoppingList();
  }, [coupleId, weekStartDate]);

  return {
    shoppingList,
    loading,
    error,
    refresh: generateShoppingList,
  };
}

/**
 * Helper function to get the start of the current week (Monday)
 */
export function getWeekStartDate(date: Date = new Date()): string {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  return monday.toISOString().split('T')[0];
}

/**
 * Helper function to get week offset (previous/next week)
 */
export function getWeekOffset(baseDate: string, offset: number): string {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + offset * 7);
  return date.toISOString().split('T')[0];
}

/**
 * Format date for display
 */
export function formatWeekRange(weekStartDate: string): string {
  const start = new Date(weekStartDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', options);
  const endStr = end.toLocaleDateString('en-US', options);

  return `${startStr} - ${endStr}`;
}
