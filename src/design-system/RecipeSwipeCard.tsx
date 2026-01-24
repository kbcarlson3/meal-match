import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, shadows, gradients, animations } from './tokens';
import { getFontFamily } from './fonts';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT * 0.75;

export interface Recipe {
  id: string;
  name: string;
  category?: string;
  area?: string;
  cookTime?: number;
  imageUrl: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

interface RecipeSwipeCardProps {
  recipe: Recipe;
  style?: ViewStyle;
}

export const RecipeSwipeCard: React.FC<RecipeSwipeCardProps> = ({ recipe, style }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  React.useEffect(() => {
    // Entry animation
    scale.value = withSpring(1, {
      damping: animations.spring.damping,
      stiffness: animations.spring.stiffness,
    });
  }, [recipe.id]);

  const formatCookTime = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      <ImageBackground
        source={{ uri: recipe.imageUrl }}
        style={styles.background}
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Organic gradient overlay */}
        <LinearGradient
          colors={gradients.recipeOverlay}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        >
          {/* Content overlay */}
          <View style={styles.content}>
            {/* Top metadata */}
            <View style={styles.topMetadata}>
              {recipe.category && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{recipe.category}</Text>
                </View>
              )}
              {recipe.difficulty && (
                <View style={[styles.tag, styles.tagSecondary]}>
                  <Text style={styles.tagText}>{recipe.difficulty}</Text>
                </View>
              )}
            </View>

            {/* Bottom info */}
            <View style={styles.bottomInfo}>
              <Text style={styles.title} numberOfLines={2}>
                {recipe.name}
              </Text>

              <View style={styles.metadata}>
                {recipe.area && (
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataIcon}>🌍</Text>
                    <Text style={styles.metadataText}>{recipe.area}</Text>
                  </View>
                )}
                {recipe.cookTime && (
                  <View style={styles.metadataItem}>
                    <Text style={styles.metadataIcon}>⏱</Text>
                    <Text style={styles.metadataText}>{formatCookTime(recipe.cookTime)}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH - spacing.xl * 2,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  background: {
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
    borderRadius: borderRadius.xl,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
  },
  topMetadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.primary.terracotta,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    ...shadows.sm,
  },
  tagSecondary: {
    backgroundColor: colors.secondary.sage,
  },
  tagText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.surface,
    lineHeight: typography.sizes.sm * typography.lineHeights.tight,
  },
  bottomInfo: {
    gap: spacing.md,
  },
  title: {
    fontFamily: getFontFamily('display', 'bold'),
    fontSize: typography.sizes['4xl'],
    lineHeight: typography.sizes['4xl'] * typography.lineHeights.tight,
    color: colors.neutral.surface,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metadataIcon: {
    fontSize: typography.sizes.lg,
  },
  metadataText: {
    fontFamily: getFontFamily('body', 'medium'),
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.tight,
    color: colors.neutral.surface,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

export default RecipeSwipeCard;
