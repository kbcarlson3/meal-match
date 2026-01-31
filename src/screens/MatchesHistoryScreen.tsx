import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '../design-system/tokens';
import { getFontFamily } from '../design-system/fonts';
import { useAuthStore } from '../store/authStore';
import { useMatches, SortOption } from '../hooks/useMatches';
import { FilterChips, FilterChip } from '../components/FilterChips';
import { supabase } from '../lib/supabase';

const CUISINE_FILTERS: FilterChip[] = [
  { id: 'italian', label: 'Italian' },
  { id: 'mexican', label: 'Mexican' },
  { id: 'indian', label: 'Indian' },
  { id: 'chinese', label: 'Chinese' },
  { id: 'japanese', label: 'Japanese' },
  { id: 'thai', label: 'Thai' },
  { id: 'french', label: 'French' },
  { id: 'american', label: 'American' },
  { id: 'greek', label: 'Greek' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'alphabetical', label: 'A-Z' },
  { value: 'favorites', label: 'Favorites' },
];

export default function MatchesHistoryScreen({ navigation }: any) {
  const couple = useAuthStore((state) => state.couple);
  const {
    filteredMatches,
    isLoading,
    error,
    searchMatches,
    toggleFavorite,
    sortBy,
    setSortBy,
  } = useMatches(couple?.id || null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCuisines, setActiveCuisines] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSortModal, setShowSortModal] = useState(false);

  // Handle search input
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    searchMatches(text, {
      cuisineTypes: activeCuisines,
      favoritesOnly,
    });
  };

  // Handle cuisine filter toggle
  const handleCuisineToggle = (cuisineId: string) => {
    const newCuisines = activeCuisines.includes(cuisineId)
      ? activeCuisines.filter((c) => c !== cuisineId)
      : [...activeCuisines, cuisineId];

    setActiveCuisines(newCuisines);
    searchMatches(searchQuery, {
      cuisineTypes: newCuisines,
      favoritesOnly,
    });
  };

  // Handle favorites filter toggle
  const handleFavoritesToggle = () => {
    const newFavoritesOnly = !favoritesOnly;
    setFavoritesOnly(newFavoritesOnly);
    searchMatches(searchQuery, {
      cuisineTypes: activeCuisines,
      favoritesOnly: newFavoritesOnly,
    });
  };

  // Handle recipe tap
  const handleRecipeTap = (recipeId: string) => {
    navigation.navigate('RecipeDetail', { recipeId });
  };

  // Handle add to meal plan
  const handleAddToMealPlan = async (recipeId: string) => {
    // Navigate to meal plan screen or show a modal
    navigation.navigate('MealPlan', { addRecipeId: recipeId });
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async (matchId: string) => {
    await toggleFavorite(matchId);
  };

  // Render recipe card
  const renderRecipeCard = ({ item }: any) => {
    const match = item;
    const recipe = match.recipe;

    if (viewMode === 'grid') {
      return (
        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => handleRecipeTap(recipe.id)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: recipe.image_url || 'https://via.placeholder.com/300' }}
            style={styles.gridImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gridGradient}
          >
            <View style={styles.gridContent}>
              <Text style={styles.gridTitle} numberOfLines={2}>
                {recipe.title}
              </Text>
              {recipe.cuisine_type && (
                <Text style={styles.gridCuisine}>{recipe.cuisine_type}</Text>
              )}
            </View>
            <View style={styles.gridActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleFavoriteToggle(match.id)}
              >
                <Ionicons
                  name={match.is_favorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={match.is_favorite ? colors.semantic.error : colors.neutral.surface}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleAddToMealPlan(recipe.id)}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.neutral.surface} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    // List view
    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => handleRecipeTap(recipe.id)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: recipe.image_url || 'https://via.placeholder.com/150' }}
          style={styles.listImage}
          resizeMode="cover"
        />
        <View style={styles.listContent}>
          <Text style={styles.listTitle} numberOfLines={2}>
            {recipe.title}
          </Text>
          {recipe.cuisine_type && (
            <Text style={styles.listCuisine}>{recipe.cuisine_type}</Text>
          )}
          <Text style={styles.listDate}>
            Matched {new Date(match.matched_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.listActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleFavoriteToggle(match.id)}
          >
            <Ionicons
              name={match.is_favorite ? 'heart' : 'heart-outline'}
              size={24}
              color={match.is_favorite ? colors.semantic.error : colors.neutral.text.tertiary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleAddToMealPlan(recipe.id)}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={colors.primary.terracotta}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.terracotta} />
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.semantic.error} />
        <Text style={styles.errorText}>Failed to load matches</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Matches</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons
              name={viewMode === 'grid' ? 'list' : 'grid'}
              size={24}
              color={colors.neutral.text.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.neutral.text.tertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor={colors.neutral.text.tertiary}
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearchChange('')}>
            <Ionicons name="close-circle" size={20} color={colors.neutral.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.favoritesButton, favoritesOnly && styles.favoritesButtonActive]}
          onPress={handleFavoritesToggle}
        >
          <Ionicons
            name={favoritesOnly ? 'heart' : 'heart-outline'}
            size={16}
            color={favoritesOnly ? colors.neutral.surface : colors.primary.terracotta}
          />
          <Text
            style={[
              styles.favoritesButtonText,
              favoritesOnly && styles.favoritesButtonTextActive,
            ]}
          >
            Favorites
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="funnel-outline" size={16} color={colors.neutral.text.secondary} />
          <Text style={styles.sortButtonText}>
            {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cuisine Filters */}
      <FilterChips
        chips={CUISINE_FILTERS}
        activeChipIds={activeCuisines}
        onChipPress={handleCuisineToggle}
      />

      {/* Recipe List */}
      {filteredMatches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={64} color={colors.neutral.text.tertiary} />
          <Text style={styles.emptyText}>No matches found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || activeCuisines.length > 0 || favoritesOnly
              ? 'Try adjusting your filters'
              : 'Start swiping to find recipes you both love!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMatches}
          renderItem={renderRecipeCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            viewMode === 'grid' && styles.gridContainer,
          ]}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when switching view modes
        />
      )}

      {/* Sort Modal */}
      {showSortModal && (
        <Pressable style={styles.modalOverlay} onPress={() => setShowSortModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort by</Text>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => {
                  setSortBy(option.value);
                  setShowSortModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    sortBy === option.value && styles.modalOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Ionicons name="checkmark" size={20} color={colors.primary.terracotta} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.background,
    padding: spacing.lg,
  },
  loadingText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.secondary,
    marginTop: spacing.md,
  },
  errorText: {
    fontFamily: getFontFamily('ui', 'semibold'),
    fontSize: typography.sizes.lg,
    color: colors.semantic.error,
    marginTop: spacing.md,
  },
  errorSubtext: {
    fontFamily: getFontFamily('ui', 'normal'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.neutral.surface,
  },
  headerTitle: {
    fontFamily: getFontFamily('display', 'bold'),
    fontSize: typography.sizes['2xl'],
    color: colors.neutral.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  viewToggle: {
    padding: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: getFontFamily('ui', 'normal'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.primary,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  favoritesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.primary.terracotta,
    backgroundColor: colors.neutral.surface,
  },
  favoritesButtonActive: {
    backgroundColor: colors.primary.terracotta,
    borderColor: colors.primary.terracotta,
  },
  favoritesButtonText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.sm,
    color: colors.primary.terracotta,
  },
  favoritesButtonTextActive: {
    color: colors.neutral.surface,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sortButtonText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.text.secondary,
  },
  listContainer: {
    padding: spacing.md,
  },
  gridContainer: {
    padding: spacing.sm,
  },
  gridCard: {
    flex: 1,
    margin: spacing.sm,
    height: 200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    justifyContent: 'flex-end',
  },
  gridContent: {
    marginBottom: spacing.sm,
  },
  gridTitle: {
    fontFamily: getFontFamily('display', 'semibold'),
    fontSize: typography.sizes.base,
    color: colors.neutral.surface,
    marginBottom: spacing.xs,
  },
  gridCuisine: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.xs,
    color: colors.neutral.surface,
    opacity: 0.8,
  },
  gridActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  listCard: {
    flexDirection: 'row',
    backgroundColor: colors.neutral.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  listImage: {
    width: 100,
    height: 100,
  },
  listContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  listTitle: {
    fontFamily: getFontFamily('display', 'semibold'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.primary,
    marginBottom: spacing.xs,
  },
  listCuisine: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.xs,
    color: colors.neutral.text.secondary,
    marginBottom: spacing.xs,
  },
  listDate: {
    fontFamily: getFontFamily('ui', 'normal'),
    fontSize: typography.sizes.xs,
    color: colors.neutral.text.tertiary,
  },
  listActions: {
    padding: spacing.md,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontFamily: getFontFamily('display', 'semibold'),
    fontSize: typography.sizes.xl,
    color: colors.neutral.text.secondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontFamily: getFontFamily('ui', 'normal'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.tertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.neutral.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    fontFamily: getFontFamily('display', 'semibold'),
    fontSize: typography.sizes.xl,
    color: colors.neutral.text.primary,
    marginBottom: spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  modalOptionText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.secondary,
  },
  modalOptionTextActive: {
    color: colors.primary.terracotta,
    fontWeight: typography.weights.semibold,
  },
});
