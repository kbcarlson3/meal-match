import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, animations } from './tokens';
import { getFontFamily } from './fonts';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MatchAnimationProps {
  visible: boolean;
  onComplete: () => void;
  recipe1ImageUrl: string;
  recipe2ImageUrl: string;
  recipe1Name: string;
  recipe2Name: string;
}

const Heart: React.FC<{ delay: number; index: number }> = ({ delay, index }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Random horizontal position
    const randomX = (Math.random() - 0.5) * SCREEN_WIDTH * 0.6;

    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(1500, withTiming(0, { duration: 500 }))
      )
    );

    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: animations.spring.damping,
        stiffness: animations.spring.stiffness,
      })
    );

    translateY.value = withDelay(
      delay,
      withTiming(-SCREEN_HEIGHT * 0.4, {
        duration: 2000,
        easing: Easing.out(Easing.cubic),
      })
    );

    rotate.value = withDelay(
      delay,
      withTiming((Math.random() - 0.5) * 30, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  // Random starting position around screen center
  const randomOffset = {
    left: SCREEN_WIDTH / 2 - 20 + (Math.random() - 0.5) * 200,
    bottom: SCREEN_HEIGHT / 2 - 20 + (Math.random() - 0.5) * 100,
  };

  return (
    <Animated.Text style={[styles.heart, animatedStyle, randomOffset]}>
      ❤️
    </Animated.Text>
  );
};

export const MatchAnimation: React.FC<MatchAnimationProps> = ({
  visible,
  onComplete,
  recipe1ImageUrl,
  recipe2ImageUrl,
  recipe1Name,
  recipe2Name,
}) => {
  const titleScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const photo1Scale = useSharedValue(0);
  const photo2Scale = useSharedValue(0);
  const photo1TranslateX = useSharedValue(-SCREEN_WIDTH);
  const photo2TranslateX = useSharedValue(SCREEN_WIDTH);

  useEffect(() => {
    if (visible) {
      // Animate photos bursting in
      photo1TranslateX.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });
      photo2TranslateX.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });

      photo1Scale.value = withDelay(
        100,
        withSpring(1, {
          damping: animations.spring.damping,
          stiffness: animations.spring.stiffness,
        })
      );

      photo2Scale.value = withDelay(
        200,
        withSpring(1, {
          damping: animations.spring.damping,
          stiffness: animations.spring.stiffness,
        })
      );

      // Animate title
      titleScale.value = withDelay(
        400,
        withSpring(1, {
          damping: animations.spring.damping,
          stiffness: animations.spring.stiffness,
        })
      );

      titleOpacity.value = withDelay(
        400,
        withTiming(1, { duration: 300 })
      );

      // Auto close after animation
      const timer = setTimeout(() => {
        onComplete();
      }, 3500);

      return () => clearTimeout(timer);
    } else {
      // Reset values
      titleScale.value = 0;
      titleOpacity.value = 0;
      photo1Scale.value = 0;
      photo2Scale.value = 0;
      photo1TranslateX.value = -SCREEN_WIDTH;
      photo2TranslateX.value = SCREEN_WIDTH;
    }
  }, [visible]);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const photo1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: photo1TranslateX.value },
      { scale: photo1Scale.value },
    ],
  }));

  const photo2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: photo2TranslateX.value },
      { scale: photo2Scale.value },
    ],
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="light">
          <LinearGradient
            colors={[
              colors.primary.terracottaLight + '40',
              colors.neutral.background + '80',
              colors.secondary.sageLight + '40',
            ]}
            style={StyleSheet.absoluteFill}
          />
        </BlurView>

        {/* Floating hearts */}
        {[...Array(15)].map((_, i) => (
          <Heart key={i} delay={i * 100} index={i} />
        ))}

        {/* Match content */}
        <View style={styles.content}>
          <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
            <Text style={styles.title}>It's a Match!</Text>
            <Text style={styles.subtitle}>
              You both loved these recipes
            </Text>
          </Animated.View>

          <View style={styles.photosContainer}>
            <Animated.View style={[styles.photoWrapper, photo1AnimatedStyle]}>
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: recipe1ImageUrl }}
                  style={styles.photo}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.5)']}
                  style={styles.photoGradient}
                >
                  <Text style={styles.photoLabel} numberOfLines={2}>
                    {recipe1Name}
                  </Text>
                </LinearGradient>
              </View>
            </Animated.View>

            <View style={styles.heartDivider}>
              <Text style={styles.heartDividerText}>❤️</Text>
            </View>

            <Animated.View style={[styles.photoWrapper, photo2AnimatedStyle]}>
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: recipe2ImageUrl }}
                  style={styles.photo}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.5)']}
                  style={styles.photoGradient}
                >
                  <Text style={styles.photoLabel} numberOfLines={2}>
                    {recipe2Name}
                  </Text>
                </LinearGradient>
              </View>
            </Animated.View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: spacing['3xl'],
  },
  titleContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontFamily: getFontFamily('display', 'bold'),
    fontSize: typography.sizes['5xl'],
    lineHeight: typography.sizes['5xl'] * typography.lineHeights.tight,
    color: colors.primary.terracotta,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: getFontFamily('body', 'medium'),
    fontSize: typography.sizes.xl,
    lineHeight: typography.sizes.xl * typography.lineHeights.normal,
    color: colors.neutral.text.secondary,
    textAlign: 'center',
  },
  photosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  photoWrapper: {
    width: SCREEN_WIDTH * 0.35,
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: colors.neutral.surface,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    justifyContent: 'flex-end',
  },
  photoLabel: {
    fontFamily: getFontFamily('body', 'semibold'),
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.tight,
    color: colors.neutral.surface,
  },
  heartDivider: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.neutral.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary.terracotta,
  },
  heartDividerText: {
    fontSize: 32,
  },
  heart: {
    position: 'absolute',
    fontSize: 40,
  },
});

export default MatchAnimation;
