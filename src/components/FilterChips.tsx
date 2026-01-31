import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, animations } from '../design-system/tokens';
import { getFontFamily } from '../design-system/fonts';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export interface FilterChip {
  id: string;
  label: string;
}

interface FilterChipsProps {
  chips: FilterChip[];
  activeChipIds: string[];
  onChipPress: (chipId: string) => void;
  style?: any;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  chips,
  activeChipIds,
  onChipPress,
  style,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
      style={styles.scrollView}
    >
      {chips.map((chip) => {
        const isActive = activeChipIds.includes(chip.id);
        return (
          <ChipItem
            key={chip.id}
            label={chip.label}
            isActive={isActive}
            onPress={() => onChipPress(chip.id)}
          />
        );
      })}
    </ScrollView>
  );
};

interface ChipItemProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const ChipItem: React.FC<ChipItemProps> = ({ label, isActive, onPress }) => {
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

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, styles.chip, isActive && styles.chipActive]}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
        {label}
      </Text>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral.surface,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary.terracotta,
    borderColor: colors.primary.terracotta,
  },
  chipText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.text.secondary,
  },
  chipTextActive: {
    color: colors.neutral.surface,
  },
});

export default FilterChips;
