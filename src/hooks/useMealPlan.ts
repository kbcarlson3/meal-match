import { useState, useEffect, useCallback } from 'react';
import { supabase, MealPlan, Recipe } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface MealPlanWithRecipe extends MealPlan {
  recipe: Recipe;
}

interface UseMealPlanReturn {
  mealPlans: MealPlanWithRecipe[];
  loading: boolean;
  error: Error | null;
  getMealPlan: (coupleId: string, weekStartDate: string) => Promise<void>;
  addMealToDay: (
    coupleId: string,
    recipeId: string,
    dayOfWeek: number,
    weekStartDate: string
  ) => Promise<void>;
  removeMeal: (mealPlanId: string) => Promise<void>;
  reorderMeal: (
    mealPlanId: string,
    newDayOfWeek: number,
    newDisplayOrder: number
  ) => Promise<void>;
  refreshMealPlan: () => Promise<void>;
}

export const useMealPlan = (): UseMealPlanReturn => {
  const [mealPlans, setMealPlans] = useState<MealPlanWithRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);
  const [currentCoupleId, setCurrentCoupleId] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<string | null>(null);

  /**
   * Fetch meal plan for a specific week
   */
  const getMealPlan = useCallback(
    async (coupleId: string, weekStartDate: string) => {
      setLoading(true);
      setError(null);
      setCurrentCoupleId(coupleId);
      setCurrentWeekStart(weekStartDate);

      try {
        const { data, error: fetchError } = await supabase
          .from('meal_plans')
          .select(
            `
            *,
            recipe:recipes(*)
          `
          )
          .eq('couple_id', coupleId)
          .eq('week_start_date', weekStartDate)
          .order('day_of_week', { ascending: true })
          .order('display_order', { ascending: true });

        if (fetchError) throw fetchError;

        setMealPlans((data as MealPlanWithRecipe[]) || []);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching meal plan:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Refresh current meal plan
   */
  const refreshMealPlan = useCallback(async () => {
    if (currentCoupleId && currentWeekStart) {
      await getMealPlan(currentCoupleId, currentWeekStart);
    }
  }, [currentCoupleId, currentWeekStart, getMealPlan]);

  /**
   * Add a meal to a specific day
   */
  const addMealToDay = useCallback(
    async (
      coupleId: string,
      recipeId: string,
      dayOfWeek: number,
      weekStartDate: string
    ) => {
      setError(null);

      try {
        // Get the current max display_order for this day
        const { data: existingMeals } = await supabase
          .from('meal_plans')
          .select('display_order')
          .eq('couple_id', coupleId)
          .eq('week_start_date', weekStartDate)
          .eq('day_of_week', dayOfWeek)
          .order('display_order', { ascending: false })
          .limit(1);

        const nextDisplayOrder = existingMeals?.length
          ? (existingMeals[0].display_order || 0) + 1
          : 0;

        // Optimistically update UI
        const { data: recipe } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', recipeId)
          .single();

        if (recipe) {
          const optimisticMealPlan: MealPlanWithRecipe = {
            id: `temp-${Date.now()}`,
            couple_id: coupleId,
            recipe_id: recipeId,
            day_of_week: dayOfWeek,
            week_start_date: weekStartDate,
            display_order: nextDisplayOrder,
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            recipe: recipe as Recipe,
          };

          setMealPlans((prev) => [...prev, optimisticMealPlan]);
        }

        // Insert into database
        const { error: insertError } = await supabase.from('meal_plans').insert({
          couple_id: coupleId,
          recipe_id: recipeId,
          day_of_week: dayOfWeek,
          week_start_date: weekStartDate,
          display_order: nextDisplayOrder,
        });

        if (insertError) throw insertError;

        // Refresh to get actual data
        await refreshMealPlan();
      } catch (err) {
        setError(err as Error);
        console.error('Error adding meal to day:', err);
        // Refresh to revert optimistic update
        await refreshMealPlan();
      }
    },
    [refreshMealPlan]
  );

  /**
   * Remove a meal from the plan
   */
  const removeMeal = useCallback(
    async (mealPlanId: string) => {
      setError(null);

      try {
        // Optimistically update UI
        setMealPlans((prev) => prev.filter((meal) => meal.id !== mealPlanId));

        // Delete from database
        const { error: deleteError } = await supabase
          .from('meal_plans')
          .delete()
          .eq('id', mealPlanId);

        if (deleteError) throw deleteError;

        // Refresh to ensure consistency
        await refreshMealPlan();
      } catch (err) {
        setError(err as Error);
        console.error('Error removing meal:', err);
        // Refresh to revert optimistic update
        await refreshMealPlan();
      }
    },
    [refreshMealPlan]
  );

  /**
   * Reorder a meal (move to different day or position)
   */
  const reorderMeal = useCallback(
    async (
      mealPlanId: string,
      newDayOfWeek: number,
      newDisplayOrder: number
    ) => {
      setError(null);

      try {
        // Optimistically update UI
        setMealPlans((prev) =>
          prev.map((meal) =>
            meal.id === mealPlanId
              ? {
                  ...meal,
                  day_of_week: newDayOfWeek,
                  display_order: newDisplayOrder,
                }
              : meal
          )
        );

        // Update in database
        const { error: updateError } = await supabase
          .from('meal_plans')
          .update({
            day_of_week: newDayOfWeek,
            display_order: newDisplayOrder,
          })
          .eq('id', mealPlanId);

        if (updateError) throw updateError;

        // Refresh to ensure consistency
        await refreshMealPlan();
      } catch (err) {
        setError(err as Error);
        console.error('Error reordering meal:', err);
        // Refresh to revert optimistic update
        await refreshMealPlan();
      }
    },
    [refreshMealPlan]
  );

  /**
   * Set up real-time subscription for meal plan changes
   */
  useEffect(() => {
    if (!currentCoupleId || !currentWeekStart) return;

    // Clean up existing subscription
    if (subscription) {
      subscription.unsubscribe();
    }

    // Create new subscription
    const channel = supabase
      .channel(`meal_plans:${currentCoupleId}:${currentWeekStart}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meal_plans',
          filter: `couple_id=eq.${currentCoupleId}`,
        },
        (payload) => {
          console.log('Meal plan change detected:', payload);
          // Refresh meal plan when changes are detected
          refreshMealPlan();
        }
      )
      .subscribe();

    setSubscription(channel);

    // Cleanup on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [currentCoupleId, currentWeekStart, refreshMealPlan]);

  return {
    mealPlans,
    loading,
    error,
    getMealPlan,
    addMealToDay,
    removeMeal,
    reorderMeal,
    refreshMealPlan,
  };
};

export default useMealPlan;
