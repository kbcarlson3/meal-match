import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { supabase, Recipe, Ingredient } from '../lib/supabase';
import { colors, typography, spacing, borderRadius, shadows } from '../design-system/tokens';
import { getFontFamily } from '../design-system/fonts';
import { Button } from '../design-system/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.75;

type RootStackParamList = {
  RecipeDetail: { recipeId: string; matchId?: string };
};

type RecipeDetailRouteProp = RouteProp<RootStackParamList, 'RecipeDetail'>;
type RecipeDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RecipeDetailScreen: React.FC = () => {
  const route = useRoute<RecipeDetailRouteProp>();
  const navigation = useNavigation<RecipeDetailNavigationProp>();
  const { recipeId, matchId } = route.params;

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    fetchRecipeDetails();
  }, [recipeId]);

  const fetchRecipeDetails = async () => {
    try {
      setLoading(true);

      // Fetch recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (recipeError) throw recipeError;
      setRecipe(recipeData as Recipe);

      // Fetch favorite status if matchId is provided
      if (matchId) {
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .select('is_favorite')
          .eq('id', matchId)
          .single();

        if (!matchError && matchData) {
          setIsFavorite(matchData.is_favorite);
        }
      }
    } catch (error) {
      console.error('Error fetching recipe:', error);
      Alert.alert('Error', 'Failed to load recipe details');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!matchId) {
      Alert.alert('Info', 'This recipe must be matched to favorite it');
      return;
    }

    try {
      const newFavoriteStatus = !isFavorite;

      const { error } = await supabase
        .from('matches')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', matchId);

      if (error) throw error;

      setIsFavorite(newFavoriteStatus);
    } catch (error) {
      console.error('Error updating favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleAddToMealPlan = async () => {
    // Navigate to meal plan screen with this recipe
    Alert.alert(
      'Add to Meal Plan',
      'Select which day you want to add this recipe to',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Go to Meal Plan', onPress: () => navigation.navigate('MealPlan' as never) },
      ]
    );
  };

  const handleShare = async () => {
    if (!recipe) return;

    try {
      const message = `Check out this recipe: ${recipe.title}\n\n${
        recipe.instructions ? recipe.instructions.substring(0, 100) + '...' : ''
      }`;

      await Share.share({
        message,
        url: recipe.youtube_url || undefined,
        title: recipe.title,
      });
    } catch (error) {
      console.error('Error sharing recipe:', error);
    }
  };

  const parseInstructions = (instructions: string | null): string[] => {
    if (!instructions) return [];

    // Split by newlines or numbered steps
    const steps = instructions
      .split(/\r?\n/)
      .filter(step => step.trim().length > 0)
      .map(step => step.trim().replace(/^\d+\.\s*/, '')); // Remove leading numbers

    return steps;
  };

  const getYouTubeEmbedUrl = (url: string | null): string | null => {
    if (!url) return null;

    // Extract video ID from various YouTube URL formats
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (!videoIdMatch) return null;

    return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading recipe...</Text>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Recipe not found</Text>
      </View>
    );
  }

  const instructions = parseInstructions(recipe.instructions);
  const embedUrl = getYouTubeEmbedUrl(recipe.youtube_url);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image with Gradient */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: recipe.image_url || undefined }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(58, 50, 48, 0)', 'rgba(58, 50, 48, 0.8)']}
            style={styles.heroGradient}
          />

          {/* Floating Action Buttons */}
          <View style={styles.floatingActions}>
            <TouchableOpacity style={styles.actionButton} onPress={toggleFavorite}>
              <Text style={styles.actionIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Text style={styles.actionIcon}>🔗</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Badges */}
          <View style={styles.header}>
            <Text style={styles.title}>{recipe.title}</Text>

            <View style={styles.badges}>
              {recipe.category && (
                <View style={[styles.badge, styles.badgePrimary]}>
                  <Text style={styles.badgeText}>{recipe.category}</Text>
                </View>
              )}
              {recipe.area && (
                <View style={[styles.badge, styles.badgeSecondary]}>
                  <Text style={styles.badgeText}>{recipe.area}</Text>
                </View>
              )}
              {recipe.cuisine_type && recipe.cuisine_type !== recipe.area && (
                <View style={[styles.badge, styles.badgeAccent]}>
                  <Text style={styles.badgeText}>{recipe.cuisine_type}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Ingredients Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsList}>
              {(recipe.ingredients as Ingredient[]).map((item, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.ingredientBullet} />
                  <Text style={styles.ingredientMeasure}>{item.measure}</Text>
                  <Text style={styles.ingredientName}>{item.ingredient}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Instructions Section */}
          {instructions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              <View style={styles.instructionsList}>
                {instructions.map((step, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* YouTube Video Section */}
          {embedUrl && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Video Tutorial</Text>
              {showVideo ? (
                <View style={styles.videoContainer}>
                  <WebView
                    source={{ uri: embedUrl }}
                    style={styles.video}
                    allowsFullscreenVideo
                    mediaPlaybackRequiresUserAction={false}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.videoPlaceholder}
                  onPress={() => setShowVideo(true)}
                >
                  <View style={styles.playButton}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>
                  <Text style={styles.videoPlaceholderText}>Tap to watch video</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              onPress={handleAddToMealPlan}
              variant="terracotta"
              size="lg"
              fullWidth
            >
              Add to Meal Plan
            </Button>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: colors.neutral.background,
  },
  loadingText: {
    fontFamily: getFontFamily('body', 'normal'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    position: 'relative',
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: IMAGE_HEIGHT * 0.4,
  },
  floatingActions: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
  actionIcon: {
    fontSize: 24,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: getFontFamily('display', 'bold'),
    fontSize: typography.sizes['4xl'],
    lineHeight: typography.sizes['4xl'] * typography.lineHeights.tight,
    color: colors.neutral.text.primary,
    marginBottom: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  badgePrimary: {
    backgroundColor: colors.primary.terracotta,
  },
  badgeSecondary: {
    backgroundColor: colors.secondary.sage,
  },
  badgeAccent: {
    backgroundColor: colors.accent.golden,
  },
  badgeText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.surface,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    fontFamily: getFontFamily('display', 'semibold'),
    fontSize: typography.sizes['2xl'],
    lineHeight: typography.sizes['2xl'] * typography.lineHeights.tight,
    color: colors.neutral.text.primary,
    marginBottom: spacing.lg,
  },
  ingredientsList: {
    gap: spacing.md,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.terracotta,
    marginTop: 8,
    marginRight: spacing.md,
  },
  ingredientMeasure: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.secondary,
    minWidth: 80,
  },
  ingredientName: {
    fontFamily: getFontFamily('body', 'normal'),
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
    color: colors.neutral.text.primary,
    flex: 1,
  },
  instructionsList: {
    gap: spacing.lg,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.terracotta,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  stepNumberText: {
    fontFamily: getFontFamily('ui', 'bold'),
    fontSize: typography.sizes.base,
    color: colors.neutral.surface,
  },
  instructionText: {
    fontFamily: getFontFamily('body', 'normal'),
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
    color: colors.neutral.text.primary,
    flex: 1,
  },
  videoContainer: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  video: {
    flex: 1,
  },
  videoPlaceholder: {
    width: '100%',
    height: 220,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.md,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary.terracotta,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  playIcon: {
    fontSize: 24,
    color: colors.neutral.surface,
    marginLeft: 4,
  },
  videoPlaceholderText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.secondary,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
});

export default RecipeDetailScreen;
