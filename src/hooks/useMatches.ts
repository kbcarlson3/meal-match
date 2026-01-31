import { useState, useEffect, useCallback } from 'react';
import { supabase, Match, Recipe } from '../lib/supabase';
import { errorLogger } from '../utils/errorLogger';

export interface MatchWithRecipe extends Match {
  recipe: Recipe;
}

export interface MatchFilters {
  query?: string;
  cuisineTypes?: string[];
  favoritesOnly?: boolean;
}

export type SortOption = 'recent' | 'alphabetical' | 'favorites';

interface UseMatchesResult {
  matches: MatchWithRecipe[];
  filteredMatches: MatchWithRecipe[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  searchMatches: (query: string, filters?: MatchFilters) => void;
  toggleFavorite: (matchId: string) => Promise<void>;
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
}

export const useMatches = (coupleId: string | null): UseMatchesResult => {
  const [matches, setMatches] = useState<MatchWithRecipe[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<MatchWithRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentFilters, setCurrentFilters] = useState<MatchFilters>({});
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const fetchMatches = useCallback(async () => {
    if (!coupleId) {
      setMatches([]);
      setFilteredMatches([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('matches')
        .select(
          `
          *,
          recipe:recipes(*)
        `
        )
        .eq('couple_id', coupleId)
        .order('matched_at', { ascending: false });

      if (fetchError) throw fetchError;

      const matchesWithRecipes = (data as any[]).map((match) => ({
        ...match,
        recipe: match.recipe as Recipe,
      })) as MatchWithRecipe[];

      setMatches(matchesWithRecipes);
      setFilteredMatches(matchesWithRecipes);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching matches:', err);
      errorLogger.error(err as Error, {
        component: 'useMatches',
        action: 'fetchMatches',
      });
    } finally {
      setIsLoading(false);
    }
  }, [coupleId]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const applyFiltersAndSort = useCallback(
    (matchesToFilter: MatchWithRecipe[], filters: MatchFilters, sort: SortOption) => {
      let result = [...matchesToFilter];

      // Apply search query
      if (filters.query && filters.query.trim()) {
        const query = filters.query.toLowerCase().trim();
        result = result.filter((match) =>
          match.recipe.title.toLowerCase().includes(query)
        );
      }

      // Apply cuisine type filters
      if (filters.cuisineTypes && filters.cuisineTypes.length > 0) {
        result = result.filter((match) =>
          filters.cuisineTypes!.some(
            (cuisine) =>
              match.recipe.cuisine_type?.toLowerCase() === cuisine.toLowerCase() ||
              match.recipe.area?.toLowerCase() === cuisine.toLowerCase()
          )
        );
      }

      // Apply favorites filter
      if (filters.favoritesOnly) {
        result = result.filter((match) => match.is_favorite);
      }

      // Apply sorting
      switch (sort) {
        case 'recent':
          result.sort(
            (a, b) =>
              new Date(b.matched_at).getTime() - new Date(a.matched_at).getTime()
          );
          break;
        case 'alphabetical':
          result.sort((a, b) =>
            a.recipe.title.localeCompare(b.recipe.title)
          );
          break;
        case 'favorites':
          result.sort((a, b) => {
            if (a.is_favorite && !b.is_favorite) return -1;
            if (!a.is_favorite && b.is_favorite) return 1;
            return (
              new Date(b.matched_at).getTime() - new Date(a.matched_at).getTime()
            );
          });
          break;
      }

      return result;
    },
    []
  );

  const searchMatches = useCallback(
    (query: string, filters?: MatchFilters) => {
      const newFilters = { ...currentFilters, query, ...filters };
      setCurrentFilters(newFilters);
      const filtered = applyFiltersAndSort(matches, newFilters, sortBy);
      setFilteredMatches(filtered);
    },
    [matches, currentFilters, sortBy, applyFiltersAndSort]
  );

  useEffect(() => {
    const filtered = applyFiltersAndSort(matches, currentFilters, sortBy);
    setFilteredMatches(filtered);
  }, [matches, currentFilters, sortBy, applyFiltersAndSort]);

  const toggleFavorite = useCallback(
    async (matchId: string) => {
      try {
        const match = matches.find((m) => m.id === matchId);
        if (!match) return;

        const newFavoriteStatus = !match.is_favorite;

        const { error: updateError } = await supabase
          .from('matches')
          .update({ is_favorite: newFavoriteStatus })
          .eq('id', matchId);

        if (updateError) throw updateError;

        // Optimistically update local state
        setMatches((prev) =>
          prev.map((m) =>
            m.id === matchId ? { ...m, is_favorite: newFavoriteStatus } : m
          )
        );
      } catch (err) {
        console.error('Error toggling favorite:', err);
        errorLogger.error(err as Error, {
          component: 'useMatches',
          action: 'toggleFavorite',
        });
        setError(err as Error);
      }
    },
    [matches]
  );

  const handleSetSortBy = useCallback((option: SortOption) => {
    setSortBy(option);
  }, []);

  return {
    matches,
    filteredMatches,
    isLoading,
    error,
    refetch: fetchMatches,
    searchMatches,
    toggleFavorite,
    sortBy,
    setSortBy: handleSetSortBy,
  };
};

export default useMatches;
