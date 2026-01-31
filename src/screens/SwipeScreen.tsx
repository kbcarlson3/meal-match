import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { RecipeSwipeCard } from '../design-system/RecipeSwipeCard';
import { MatchAnimation } from '../design-system/MatchAnimation';
import { Button } from '../design-system/Button';
import { useRecipeQueue, RecipeFilters } from '../hooks/useRecipeQueue';
import { useSwipes } from '../hooks/useSwipes';
import { useRealtime } from '../hooks/useRealtime';
import { getCurrentUserCouple } from '../lib/supabase';
import { colors, typography, spacing, borderRadius, shadows } from '../design-system/tokens';
import { getFontFamily } from '../design-system/fonts';
import { Recipe, Match, Couple } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { RecipeCardSkeleton } from '../components/SkeletonLoader';
import { toast } from '../components/Toast';
import { errorLogger } from '../utils/errorLogger';

interface MatchWithRecipe extends Match {
  recipe: Recipe;
}

export const SwipeScreen: React.FC = () => {
  const swiperRef = useRef<Swiper<Recipe>>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [filters, setFilters] = useState<RecipeFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchAnimation, setMatchAnimation] = useState<{
    visible: boolean;
    recipe?: Recipe;
  }>({
    visible: false,
  });

  // Load user and couple data
  useEffect(() => {
    const loadUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }

      const coupleData = await getCurrentUserCouple();
      if (coupleData) {
        setCouple(coupleData);
        // Determine partner ID
        const partner =
          coupleData.user1_id === user?.id
            ? coupleData.user2_id
            : coupleData.user1_id;
        setPartnerId(partner);
      }
    };

    loadUserData();
  }, []);

  // Fetch recipes
  const { recipes, loading, error, hasMore, loadMore, refresh } = useRecipeQueue(
    {
      coupleId: couple?.id || '',
      userId,
      filters,
      pageSize: 10,
    }
  );

  // Handle swipes
  const { recording, recordSwipe } = useSwipes({
    coupleId: couple?.id || '',
    userId,
    partnerId,
  });

  // Handle new matches via realtime
  const handleNewMatch = useCallback(
    (match: MatchWithRecipe) => {
      console.log('New match received:', match);
      // Show match animation for the matched recipe
      if (match.recipe) {
        setMatchAnimation({
          visible: true,
          recipe: match.recipe,
        });
      }
    },
    []
  );

  // Set up realtime subscriptions
  const { connectionState } = useRealtime({
    coupleId: couple?.id || null,
    onNewMatch: handleNewMatch,
    enabled: !!couple?.id,
  });

  /**
   * Handle swipe right (like)
   */
  const handleSwipeRight = useCallback(
    async (index: number) => {
      const recipe = recipes[index];
      if (!recipe || !couple) return;

      console.log('Swiped right on:', recipe.title);
      errorLogger.addBreadcrumb(`Swiped right on recipe: ${recipe.title}`);

      const result = await recordSwipe(recipe.id, 'like');

      if (result.error) {
        console.error('Error recording swipe:', result.error);
        errorLogger.error(result.error, {
          component: 'SwipeScreen',
          action: 'handleSwipeRight',
        });
        toast.error('Failed to record swipe. Please try again.');
        return;
      }

      // If it's a match, show animation
      if (result.isMatch && result.match) {
        errorLogger.addBreadcrumb(`Match found: ${recipe.title}`);
        setMatchAnimation({
          visible: true,
          recipe,
        });
      }

      // Load more recipes when getting close to the end
      if (index >= recipes.length - 3 && hasMore) {
        loadMore();
      }
    },
    [recipes, couple, recordSwipe, hasMore, loadMore]
  );

  /**
   * Handle swipe left (dislike)
   */
  const handleSwipeLeft = useCallback(
    async (index: number) => {
      const recipe = recipes[index];
      if (!recipe || !couple) return;

      console.log('Swiped left on:', recipe.title);
      errorLogger.addBreadcrumb(`Swiped left on recipe: ${recipe.title}`);

      const result = await recordSwipe(recipe.id, 'dislike');

      if (result.error) {
        console.error('Error recording swipe:', result.error);
        errorLogger.error(result.error, {
          component: 'SwipeScreen',
          action: 'handleSwipeLeft',
        });
        toast.error('Failed to record swipe. Please try again.');
        return;
      }

      // Load more recipes when getting close to the end
      if (index >= recipes.length - 3 && hasMore) {
        loadMore();
      }
    },
    [recipes, couple, recordSwipe, hasMore, loadMore]
  );

  /**
   * Toggle filter bar
   */
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  /**
   * Apply filters
   */
  const applyFilters = (newFilters: RecipeFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
    refresh();
  };

  /**
   * Clear filters
   */
  const clearFilters = () => {
    setFilters({});
    setShowFilters(false);
    refresh();
  };

  // Loading state
  if (loading && recipes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Discover Recipes</Text>
        </View>
        <View style={styles.swiperContainer}>
          <RecipeCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Error loading recipes</Text>
          <Text style={styles.errorSubtext}>{error.message}</Text>
          <Button onPress={refresh} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // No couple state
  if (!couple) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>No couple found</Text>
          <Text style={styles.errorSubtext}>
            Please pair with your partner first
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // No recipes state
  if (recipes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No more recipes to swipe!</Text>
          <Text style={styles.emptySubtext}>
            Try changing your filters or check back later
          </Text>
          <Button onPress={refresh} style={styles.retryButton}>
            Refresh
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with filter button */}
      <View style={styles.header}>
        <Text style={styles.title}>Discover Recipes</Text>
        <TouchableOpacity onPress={toggleFilters} style={styles.filterButton}>
          <Text style={styles.filterButtonText}>
            {showFilters ? '✕' : '⚙️'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter bar */}
      {showFilters && (
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                !filters.cuisineType && styles.filterChipActive,
              ]}
              onPress={() => applyFilters({ ...filters, cuisineType: null })}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !filters.cuisineType && styles.filterChipTextActive,
                ]}
              >
                All Cuisines
              </Text>
            </TouchableOpacity>
            {['Italian', 'Mexican', 'Asian', 'American', 'French', 'Indian'].map(
              (cuisine) => (
                <TouchableOpacity
                  key={cuisine}
                  style={[
                    styles.filterChip,
                    filters.cuisineType === cuisine && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    applyFilters({ ...filters, cuisineType: cuisine })
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.cuisineType === cuisine &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
          {(filters.cuisineType || filters.dietaryPreferences) && (
            <TouchableOpacity
              onPress={clearFilters}
              style={styles.clearFiltersButton}
            >
              <Text style={styles.clearFiltersText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Connection status indicator */}
      {!connectionState.connected && partnerId && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            {connectionState.error
              ? 'Connection lost - matches may be delayed'
              : 'Connecting...'}
          </Text>
        </View>
      )}

      {/* Swiper */}
      <View style={styles.swiperContainer}>
        <Swiper
          ref={swiperRef}
          cards={recipes}
          renderCard={(recipe) => {
            if (!recipe) return null;
            return (
              <RecipeSwipeCard
                recipe={{
                  id: recipe.id,
                  name: recipe.title,
                  category: recipe.category || undefined,
                  area: recipe.area || undefined,
                  imageUrl: recipe.image_url || '',
                  difficulty: undefined,
                }}
              />
            );
          }}
          onSwipedLeft={handleSwipeLeft}
          onSwipedRight={handleSwipeRight}
          onSwiped={(index) => setCurrentIndex(index + 1)}
          cardIndex={currentIndex}
          backgroundColor="transparent"
          stackSize={3}
          stackSeparation={15}
          overlayLabels={{
            left: {
              title: 'NOPE',
              style: {
                label: {
                  backgroundColor: colors.semantic.error,
                  borderColor: colors.semantic.error,
                  color: colors.neutral.surface,
                  borderWidth: 2,
                  fontSize: typography.sizes['2xl'],
                  fontFamily: getFontFamily('ui', 'bold'),
                  padding: spacing.md,
                  borderRadius: borderRadius.sm,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  marginTop: spacing['3xl'],
                  marginLeft: -spacing['3xl'],
                },
              },
            },
            right: {
              title: 'LIKE',
              style: {
                label: {
                  backgroundColor: colors.semantic.success,
                  borderColor: colors.semantic.success,
                  color: colors.neutral.surface,
                  borderWidth: 2,
                  fontSize: typography.sizes['2xl'],
                  fontFamily: getFontFamily('ui', 'bold'),
                  padding: spacing.md,
                  borderRadius: borderRadius.sm,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  marginTop: spacing['3xl'],
                  marginLeft: spacing['3xl'],
                },
              },
            },
          }}
          animateOverlayLabelsOpacity
          animateCardOpacity
          disableTopSwipe
          disableBottomSwipe
          verticalSwipe={false}
          infinite={false}
        />
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.dislikeButton]}
          onPress={() => swiperRef.current?.swipeLeft()}
          disabled={recording}
        >
          <Text style={styles.actionIcon}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => swiperRef.current?.swipeRight()}
          disabled={recording}
        >
          <Text style={styles.actionIcon}>♥</Text>
        </TouchableOpacity>
      </View>

      {/* Match Animation */}
      {matchAnimation.visible && matchAnimation.recipe && (
        <MatchAnimation
          visible={matchAnimation.visible}
          onComplete={() => setMatchAnimation({ visible: false })}
          recipe1ImageUrl={matchAnimation.recipe.image_url || ''}
          recipe2ImageUrl={matchAnimation.recipe.image_url || ''}
          recipe1Name={matchAnimation.recipe.title}
          recipe2Name={matchAnimation.recipe.title}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  title: {
    fontFamily: getFontFamily('display', 'bold'),
    fontSize: typography.sizes['3xl'],
    color: colors.neutral.text.primary,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  filterButtonText: {
    fontSize: typography.sizes.xl,
  },
  filterBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  filterContent: {
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral.surface,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary.terracotta,
    borderColor: colors.primary.terracotta,
  },
  filterChipText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.text.primary,
  },
  filterChipTextActive: {
    color: colors.neutral.surface,
  },
  clearFiltersButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  clearFiltersText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.sm,
    color: colors.primary.terracotta,
  },
  statusBar: {
    backgroundColor: colors.accent.golden,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.xs,
    color: colors.neutral.text.primary,
    textAlign: 'center',
  },
  swiperContainer: {
    flex: 1,
    paddingTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing['2xl'],
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  dislikeButton: {
    backgroundColor: colors.neutral.surface,
    borderWidth: 3,
    borderColor: colors.semantic.error,
  },
  likeButton: {
    backgroundColor: colors.primary.terracotta,
  },
  actionIcon: {
    fontSize: typography.sizes['3xl'],
    color: colors.neutral.surface,
  },
  loadingText: {
    fontFamily: getFontFamily('body', 'medium'),
    fontSize: typography.sizes.lg,
    color: colors.neutral.text.secondary,
    marginTop: spacing.md,
  },
  errorText: {
    fontFamily: getFontFamily('display', 'bold'),
    fontSize: typography.sizes['2xl'],
    color: colors.neutral.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorSubtext: {
    fontFamily: getFontFamily('body', 'normal'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontFamily: getFontFamily('display', 'bold'),
    fontSize: typography.sizes['2xl'],
    color: colors.neutral.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontFamily: getFontFamily('body', 'normal'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    marginTop: spacing.md,
  },
});

export default SwipeScreen;
