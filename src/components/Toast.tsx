import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../design-system/tokens';

const SCREEN_WIDTH = Dimensions.get('window').width;
const TOAST_DURATION = 3000;

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onDismiss?: () => void;
}

/**
 * Toast notification component
 * Auto-dismisses after the specified duration (default 3 seconds)
 */
export default function Toast({
  message,
  variant = 'info',
  duration = TOAST_DURATION,
  onDismiss,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in and fade in
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    // Slide out and fade out
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) {
        onDismiss();
      }
    });
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: colors.semantic.success,
          icon: '✓',
        };
      case 'error':
        return {
          backgroundColor: colors.semantic.error,
          icon: '✕',
        };
      case 'info':
      default:
        return {
          backgroundColor: colors.semantic.info,
          icon: 'ℹ',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: variantStyles.backgroundColor,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={handleDismiss}
        activeOpacity={0.95}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{variantStyles.icon}</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Toast container to manage multiple toasts
 */
interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContainerState {
  toasts: ToastMessage[];
}

let toastContainerRef: React.RefObject<ToastContainerComponent> | null = null;

export class ToastContainerComponent extends React.Component<{}, ToastContainerState> {
  state: ToastContainerState = {
    toasts: [],
  };

  show = (message: string, variant: ToastVariant = 'info', duration?: number) => {
    const id = Date.now().toString();
    this.setState((prevState) => ({
      toasts: [...prevState.toasts, { id, message, variant, duration }],
    }));
  };

  dismiss = (id: string) => {
    this.setState((prevState) => ({
      toasts: prevState.toasts.filter((toast) => toast.id !== id),
    }));
  };

  render() {
    return (
      <View style={styles.containerWrapper} pointerEvents="box-none">
        {this.state.toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            onDismiss={() => this.dismiss(toast.id)}
          />
        ))}
      </View>
    );
  }
}

export function ToastContainer() {
  const ref = useRef<ToastContainerComponent>(null);

  useEffect(() => {
    toastContainerRef = ref;
    return () => {
      toastContainerRef = null;
    };
  }, []);

  return <ToastContainerComponent ref={ref} />;
}

/**
 * Global toast functions
 */
export const toast = {
  show: (message: string, variant: ToastVariant = 'info', duration?: number) => {
    if (toastContainerRef?.current) {
      toastContainerRef.current.show(message, variant, duration);
    }
  },
  success: (message: string, duration?: number) => {
    toast.show(message, 'success', duration);
  },
  error: (message: string, duration?: number) => {
    toast.show(message, 'error', duration);
  },
  info: (message: string, duration?: number) => {
    toast.show(message, 'info', duration);
  },
};

const styles = StyleSheet.create({
  containerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 50, // Account for status bar and notch
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH - spacing.xl * 2,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.lg,
  },
  touchable: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 16,
    color: colors.neutral.surface,
    fontWeight: typography.weights.bold,
  },
  message: {
    flex: 1,
    fontFamily: typography.families.ui,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.neutral.surface,
    lineHeight: typography.sizes.base * typography.lineHeights.normal,
  },
});
