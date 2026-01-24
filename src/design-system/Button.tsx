import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, shadows, animations } from './tokens';
import { getFontFamily } from './fonts';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

type ButtonVariant = 'terracotta' | 'sage' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = 'terracotta',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
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

  const buttonStyles: ViewStyle[] = [
    styles.base,
    styles[size],
    styles[variant],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`text_${size}` as keyof typeof styles] as TextStyle,
    styles[`text_${variant}` as keyof typeof styles] as TextStyle,
    disabled && styles.textDisabled,
  ];

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animatedStyle, buttonStyles]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.primary.terracotta : colors.neutral.surface}
          size={size === 'lg' ? 'large' : 'small'}
        />
      ) : (
        <Text style={textStyles}>{children}</Text>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
  },

  // Sizes
  sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
  },

  // Variants
  terracotta: {
    backgroundColor: colors.primary.terracotta,
    ...shadows.md,
  },
  sage: {
    backgroundColor: colors.secondary.sage,
    ...shadows.md,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary.terracotta,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Text styles
  text: {
    fontFamily: getFontFamily('ui', 'medium'),
    textAlign: 'center',
  },
  text_sm: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.tight,
  },
  text_md: {
    fontSize: typography.sizes.base,
    lineHeight: typography.sizes.base * typography.lineHeights.tight,
  },
  text_lg: {
    fontSize: typography.sizes.lg,
    lineHeight: typography.sizes.lg * typography.lineHeights.tight,
  },
  text_terracotta: {
    color: colors.neutral.surface,
  },
  text_sage: {
    color: colors.neutral.surface,
  },
  text_outline: {
    color: colors.primary.terracotta,
  },
  text_ghost: {
    color: colors.primary.terracotta,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
  textDisabled: {
    opacity: 0.7,
  },
  fullWidth: {
    width: '100%',
  },
});

export default Button;
