import React from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { DayCard } from '../design-system';
import { animations } from '../design-system/tokens';

interface DraggableDayCardProps {
  day: string;
  dayIndex: number;
  recipeId?: string;
  recipeName?: string;
  recipeImageUrl?: string;
  onPress?: () => void;
  onDragStart?: (dayIndex: number) => void;
  onDragUpdate?: (dayIndex: number, translationY: number) => void;
  onDragEnd?: (dayIndex: number, translationY: number) => void;
}

const CARD_HEIGHT = 156; // Approximate height of day card + margin
const DRAG_THRESHOLD = 20; // Minimum drag distance to activate

export const DraggableDayCard: React.FC<DraggableDayCardProps> = ({
  day,
  dayIndex,
  recipeId,
  recipeName,
  recipeImageUrl,
  onPress,
  onDragStart,
  onDragUpdate,
  onDragEnd,
}) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const isDragging = useSharedValue(false);
  const startY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .enabled(!!recipeId) // Only enable dragging if there's a recipe
    .onStart(() => {
      startY.value = translateY.value;
      isDragging.value = true;
      scale.value = withSpring(1.05, {
        damping: animations.spring.damping,
        stiffness: animations.spring.stiffness,
      });

      if (onDragStart) {
        runOnJS(onDragStart)(dayIndex);
      }
    })
    .onUpdate((event) => {
      translateY.value = startY.value + event.translationY;

      // Only trigger updates if we've moved past threshold
      if (Math.abs(event.translationY) > DRAG_THRESHOLD && onDragUpdate) {
        runOnJS(onDragUpdate)(dayIndex, translateY.value);
      }
    })
    .onEnd(() => {
      isDragging.value = false;

      if (onDragEnd && Math.abs(translateY.value) > DRAG_THRESHOLD) {
        runOnJS(onDragEnd)(dayIndex, translateY.value);
      }

      // Reset position
      translateY.value = withSpring(0, {
        damping: animations.spring.damping,
        stiffness: animations.spring.stiffness,
      });
      scale.value = withSpring(1, {
        damping: animations.spring.damping,
        stiffness: animations.spring.stiffness,
      });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: isDragging.value ? 1000 : 1,
    elevation: isDragging.value ? 8 : 0,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <DayCard
          day={day}
          recipeId={recipeId}
          recipeName={recipeName}
          recipeImageUrl={recipeImageUrl}
          onPress={onPress}
          isDragging={isDragging.value}
        />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
});

export default DraggableDayCard;
