import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Clipboard } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../design-system/tokens';
import { errorLogger } from '../utils/errorLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

/**
 * Error boundary to catch React errors and display a friendly error message
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Generate unique error ID for user reference
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with full context using errorLogger
    errorLogger.error(error, {
      component: 'ErrorBoundary',
      action: 'component_error',
    });

    // Log component stack for debugging
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  handleTryAgain = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  handleCopyErrorDetails = async () => {
    if (!this.state.error || !this.state.errorId) return;

    const errorDetails = `
Error ID: ${this.state.errorId}
Message: ${this.state.error.message}
Stack: ${this.state.error.stack || 'No stack trace'}
Session: ${errorLogger.getSessionId()}
Timestamp: ${new Date().toISOString()}
    `.trim();

    try {
      await Clipboard.setString(errorDetails);
      console.log('[ErrorBoundary] Error details copied to clipboard');
    } catch (err) {
      console.error('[ErrorBoundary] Failed to copy error details:', err);
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>🍳</Text>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              We ran into an unexpected issue. Don't worry, your data is safe.
            </Text>
            {this.state.errorId && (
              <Text style={styles.errorId}>Error ID: {this.state.errorId}</Text>
            )}
            {__DEV__ && this.state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={this.handleTryAgain}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
              {__DEV__ && (
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={this.handleCopyErrorDetails}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                    Copy Error Details
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.background,
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.families.display,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.neutral.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontFamily: typography.families.body,
    fontSize: typography.sizes.base,
    color: colors.neutral.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
    marginBottom: spacing.md,
  },
  errorId: {
    fontFamily: 'Courier',
    fontSize: typography.sizes.sm,
    color: colors.neutral.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  errorBox: {
    backgroundColor: colors.semantic.error + '20',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xl,
    width: '100%',
  },
  errorText: {
    fontFamily: 'Courier',
    fontSize: typography.sizes.xs,
    color: colors.semantic.error,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: colors.primary.terracotta,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 160,
  },
  buttonText: {
    fontFamily: typography.families.ui,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.neutral.surface,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.neutral.surface,
    borderWidth: 1,
    borderColor: colors.primary.terracotta,
  },
  secondaryButtonText: {
    color: colors.primary.terracotta,
  },
});
