import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '../../design-system/tokens';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={[colors.neutral.background, colors.accent.goldenLight + '20']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Let's find what you both want to eat tonight
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={colors.neutral.text.tertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={colors.neutral.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.neutral.surface} />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Signup')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Create New Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  headerContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontFamily: typography.families.display,
    fontSize: typography.sizes['4xl'],
    fontWeight: typography.weights.bold,
    color: colors.neutral.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.families.body,
    fontSize: typography.sizes.lg,
    color: colors.neutral.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.lg * typography.lineHeights.relaxed,
  },
  formContainer: {
    backgroundColor: colors.neutral.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.families.ui,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.neutral.text.secondary,
    marginBottom: spacing.xs,
  },
  input: {
    fontFamily: typography.families.ui,
    fontSize: typography.sizes.base,
    color: colors.neutral.text.primary,
    backgroundColor: colors.neutral.background,
    borderWidth: 1,
    borderColor: colors.neutral.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  errorContainer: {
    backgroundColor: colors.semantic.error + '15',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    fontFamily: typography.families.ui,
    fontSize: typography.sizes.sm,
    color: colors.semantic.error,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary.terracotta,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: typography.families.ui,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.neutral.surface,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral.border,
  },
  dividerText: {
    fontFamily: typography.families.ui,
    fontSize: typography.sizes.sm,
    color: colors.neutral.text.tertiary,
    marginHorizontal: spacing.sm,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary.terracotta,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: typography.families.ui,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.primary.terracotta,
  },
});
