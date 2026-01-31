import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  Pressable,
  ImageBackground,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { supabase, Match, Recipe } from '../lib/supabase';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../design-system/tokens';
import { getFontFamily } from '../design-system/fonts';
import { Button } from '../design-system';

interface RecipeSelectModalProps {
  visible: boolean;
  coupleId: string;
  dayName: string;
  onClose: () => void;
  onSelectRecipe: (recipeId: string) => void;
}

export const RecipeSelectModal: React.FC<RecipeSelectModalProps> = ({
  visible,
  coupleId,
  dayName,
  onClose,
  onSelectRecipe,
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && coupleId) {
      fetchMatches();
    }
  }, [visible, coupleId]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(
          `
          *,
          recipe:recipes(*)
        `
        )
        .eq('couple_id', coupleId)
        .order('matched_at', { ascending: false });

      if (error) throw error;

      setMatches((data as Match[]) || []);
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter((match) => {
    if (!searchQuery) return true;
    const recipe = match.recipe as Recipe;
    return (
      recipe?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe?.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe?.cuisine_type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSelectRecipe = () => {
    if (selectedRecipeId) {
      onSelectRecipe(selectedRecipeId);
      setSelectedRecipeId(null);
      setSearchQuery('');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedRecipeId(null);
    setSearchQuery('');
    onClose();
  };

  const renderRecipeItem = ({ item }: { item: Match }) => {
    const recipe = item.recipe as Recipe;
    if (!recipe) return null;

    const isSelected = selectedRecipeId === recipe.id;

    return (
      <Pressable
        style={[styles.recipeCard, isSelected && styles.recipeCardSelected]}
        onPress={() => setSelectedRecipeId(recipe.id)}
      >
        <ImageBackground
          source={{ uri: recipe.image_url || undefined }}
          style={styles.recipeImage}
          imageStyle={styles.recipeImageStyle}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
            style={styles.recipeGradient}
          >
            <View style={styles.recipeContent}>
              <Text style={styles.recipeName} numberOfLines={2}>
                {recipe.title}
              </Text>
              {recipe.category && (
                <View style={styles.recipeMeta}>
                  <Text style={styles.recipeCategory}>{recipe.category}</Text>
                  {recipe.cuisine_type && (
                    <>
                      <Text style={styles.recipeSeparator}>•</Text>
                      <Text style={styles.recipeCuisine}>
                        {recipe.cuisine_type}
                      </Text>
                    </>
                  )}
                </View>
              )}
            </View>
          </LinearGradient>
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          )}
        </ImageBackground>
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <BlurView intensity={95} tint="light" style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Cancel</Text>
              </Pressable>
              <Text style={styles.headerTitle}>Add to {dayName}</Text>
              <View style={styles.closeButton} />
            </View>

            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search recipes..."
                placeholderTextColor={colors.neutral.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </Pressable>
              )}
            </View>
          </View>
        </BlurView>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={colors.primary.terracotta}
              />
              <Text style={styles.loadingText}>Loading recipes...</Text>
            </View>
          ) : filteredMatches.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No recipes found' : 'No matched recipes yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start swiping to find recipes you both love!'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredMatches}
              renderItem={renderRecipeItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {selectedRecipeId && (
          <View style={styles.footer}>
            <Button
              onPress={handleSelectRecipe}
              variant="terracotta"
              size="lg"
              fullWidth
            >
              Add Recipe
            </Button>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },

  // Header
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
    overflow: 'hidden',
  },
  headerContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontFamily: getFontFamily('display', 'semibold'),
    fontSize: typography.sizes.lg,
    color: colors.neutral.text.primary,
  },
  closeButton: {
    minWidth: 60,
  },
  closeButtonText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.base,
    color: colors.primary.terracotta,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral.border,
  },
  searchIcon: {
    fontSize: typography.sizes.lg,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: getFontFamily('ui', 'normal'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.primary,
    padding: 0,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  clearButtonText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.lg,
    color: colors.neutral.text.tertiary,
  },

  // Content
  content: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },

  // Recipe card
  recipeCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  recipeCardSelected: {
    borderWidth: 3,
    borderColor: colors.primary.terracotta,
  },
  recipeImage: {
    height: 200,
    width: '100%',
  },
  recipeImageStyle: {
    borderRadius: borderRadius.md,
  },
  recipeGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  recipeContent: {
    gap: spacing.xs,
  },
  recipeName: {
    fontFamily: getFontFamily('body', 'semibold'),
    fontSize: typography.sizes.xl,
    lineHeight: typography.sizes.xl * typography.lineHeights.tight,
    color: colors.neutral.surface,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  recipeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recipeCategory: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.surface,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  recipeSeparator: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.surface,
  },
  recipeCuisine: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.surface,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  selectedIndicator: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.terracotta,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  checkmark: {
    fontSize: typography.sizes.xl,
    color: colors.neutral.surface,
    fontWeight: 'bold',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Footer
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.neutral.surface,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.border,
    ...shadows.lg,
  },
});

export default RecipeSelectModal;
