import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Pressable,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows, animations } from './tokens';
import { getFontFamily } from './fonts';

interface DayCardProps {
  day: string;
  recipeId?: string;
  recipeName?: string;
  recipeImageUrl?: string;
  onPress?: () => void;
  isDragging?: boolean;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const DayCard: React.FC<DayCardProps> = ({
  day,
  recipeId,
  recipeName,
  recipeImageUrl,
  onPress,
  isDragging = false,
  style,
}) => {
  const scale = useSharedValue(1);
  const elevation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    ...shadows.md,
    elevation: elevation.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, {
      damping: animations.spring.damping,
      stiffness: animations.spring.stiffness,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: animations.spring.damping,
      stiffness: animations.spring.stiffness,
    });
  };

  React.useEffect(() => {
    if (isDragging) {
      scale.value = withSpring(1.05);
      elevation.value = withSpring(8);
    } else {
      scale.value = withSpring(1);
      elevation.value = withSpring(0);
    }
  }, [isDragging]);

  const isEmpty = !recipeId;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, style]}
      disabled={!onPress}
    >
      <View style={[styles.container, isEmpty && styles.containerEmpty]}>
        {/* Day label */}
        <View style={[styles.dayLabel, isEmpty && styles.dayLabelEmpty]}>
          <Text style={[styles.dayText, isEmpty && styles.dayTextEmpty]}>
            {day}
          </Text>
        </View>

        {isEmpty ? (
          // Empty state
          <View style={styles.emptyContent}>
            <View style={styles.dashedBorder}>
              <Text style={styles.emptyIcon}>➕</Text>
              <Text style={styles.emptyText}>Add a meal</Text>
            </View>
          </View>
        ) : (
          // Filled state with recipe
          <ImageBackground
            source={{ uri: recipeImageUrl }}
            style={styles.recipeBackground}
            imageStyle={styles.recipeImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
              style={styles.recipeGradient}
            >
              <View style={styles.recipeContent}>
                {/* Drag handle indicator */}
                <View style={styles.dragHandle}>
                  <View style={styles.dragHandleLine} />
                  <View style={styles.dragHandleLine} />
                  <View style={styles.dragHandleLine} />
                </View>

                {/* Recipe name */}
                <Text style={styles.recipeName} numberOfLines={2}>
                  {recipeName}
                </Text>
              </View>
            </LinearGradient>
          </ImageBackground>
        )}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.neutral.surface,
    minHeight: 140,
  },
  containerEmpty: {
    backgroundColor: 'transparent',
  },

  // Day label
  dayLabel: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary.terracotta,
    borderRadius: borderRadius.full,
    zIndex: 10,
    ...shadows.sm,
  },
  dayLabelEmpty: {
    backgroundColor: colors.neutral.border,
  },
  dayText: {
    fontFamily: getFontFamily('ui', 'bold'),
    fontSize: typography.sizes.xs,
    lineHeight: typography.sizes.xs * typography.lineHeights.tight,
    color: colors.neutral.surface,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayTextEmpty: {
    color: colors.neutral.text.secondary,
  },

  // Empty state
  emptyContent: {
    flex: 1,
    minHeight: 140,
  },
  dashedBorder: {
    flex: 1,
    margin: 2,
    borderWidth: 2,
    borderColor: colors.neutral.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.neutral.background,
  },
  emptyIcon: {
    fontSize: typography.sizes['3xl'],
    color: colors.neutral.text.tertiary,
  },
  emptyText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.tight,
    color: colors.neutral.text.tertiary,
  },

  // Filled state
  recipeBackground: {
    flex: 1,
    minHeight: 140,
  },
  recipeImage: {
    borderRadius: borderRadius.md,
  },
  recipeGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  recipeContent: {
    gap: spacing.sm,
  },

  // Drag handle
  dragHandle: {
    alignSelf: 'flex-start',
    gap: 2,
    padding: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.sm,
  },
  dragHandleLine: {
    width: 20,
    height: 2,
    backgroundColor: colors.neutral.surface,
    borderRadius: 1,
  },

  // Recipe name
  recipeName: {
    fontFamily: getFontFamily('body', 'semibold'),
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.tight,
    color: colors.neutral.surface,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

export default DayCard;
