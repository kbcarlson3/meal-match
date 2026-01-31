import { useState, useEffect, useCallback } from 'react';
import { supabase, Recipe } from '../lib/supabase';

export interface RecipeFilters {
  cuisineType?: string | null;
  dietaryPreferences?: string[];
}

interface UseRecipeQueueOptions {
  coupleId: string;
  userId: string;
  filters?: RecipeFilters;
  pageSize?: number;
}

interface UseRecipeQueueResult {
  recipes: Recipe[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage a queue of recipes for swiping
 * Excludes recipes that the user has already swiped on
 * Supports filtering by cuisine type and dietary preferences
 */
export function useRecipeQueue({
  coupleId,
  userId,
  filters = {},
  pageSize = 10,
}: UseRecipeQueueOptions): UseRecipeQueueResult {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  /**
   * Fetch recipes with filters and pagination
   */
  const fetchRecipes = useCallback(
    async (currentOffset: number, append: boolean = false) => {
      try {
        setLoading(true);
        setError(null);

        // First, get all recipe IDs that this user has already swiped on
        const { data: swipedRecipes, error: swipeError } = await supabase
          .from('swipes')
          .select('recipe_id')
          .eq('user_id', userId)
          .eq('couple_id', coupleId);

        if (swipeError) throw swipeError;

        const swipedRecipeIds = swipedRecipes?.map((s) => s.recipe_id) || [];

        // Build query for recipes
        let query = supabase
          .from('recipes')
          .select('*')
          .order('created_at', { ascending: false })
          .range(currentOffset, currentOffset + pageSize - 1);

        // Exclude already-swiped recipes
        if (swipedRecipeIds.length > 0) {
          query = query.not('id', 'in', `(${swipedRecipeIds.join(',')})`);
        }

        // Apply cuisine type filter
        if (filters.cuisineType) {
          query = query.eq('cuisine_type', filters.cuisineType);
        }

        // Apply dietary preference filters
        // Tags are stored as a JSON array, so we need to use containedBy or overlaps
        if (filters.dietaryPreferences && filters.dietaryPreferences.length > 0) {
          // This will match recipes where tags array contains any of the dietary preferences
          query = query.overlaps('tags', filters.dietaryPreferences);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        const fetchedRecipes = (data || []) as Recipe[];

        // Update state
        if (append) {
          setRecipes((prev) => [...prev, ...fetchedRecipes]);
        } else {
          setRecipes(fetchedRecipes);
        }

        // Check if there are more recipes to load
        setHasMore(fetchedRecipes.length === pageSize);
      } catch (err) {
        console.error('Error fetching recipes:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [userId, coupleId, filters, pageSize]
  );

  /**
   * Load more recipes (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;

    const newOffset = offset + pageSize;
    setOffset(newOffset);
    await fetchRecipes(newOffset, true);
  }, [offset, pageSize, hasMore, loading, fetchRecipes]);

  /**
   * Refresh the recipe queue (reset to beginning)
   */
  const refresh = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await fetchRecipes(0, false);
  }, [fetchRecipes]);

  // Initial load
  useEffect(() => {
    fetchRecipes(0, false);
  }, [fetchRecipes]);

  return {
    recipes,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

export default useRecipeQueue;
