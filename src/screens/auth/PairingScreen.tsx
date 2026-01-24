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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '../../design-system/tokens';
import { useAuthStore } from '../../store/authStore';

export default function PairingScreen() {
  const [mode, setMode] = useState<'choice' | 'generate' | 'enter'>('choice');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const { generateInviteCode, acceptInviteCode } = useAuthStore();

  const handleGenerateCode = async () => {
    setError('');
    setLoading(true);
    try {
      const code = await generateInviteCode();
      setGeneratedCode(code);
      setMode('generate');
    } catch (err: any) {
      setError(err.message || 'Failed to generate invite code');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCode = async () => {
    setError('');

    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      await acceptInviteCode(inviteCode.trim().toUpperCase());
      // On success, navigation will be handled by pairing state change
    } catch (err: any) {
      setError(err.message || 'Invalid invite code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    // In a real app, you'd use Expo's Clipboard API
    Alert.alert('Code Copied', `Share this code with your partner: ${generatedCode}`);
  };

  if (mode === 'choice') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <LinearGradient
          colors={[colors.neutral.background, colors.accent.goldenLight + '25']}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Pair with Your Partner</Text>
              <Text style={styles.subtitle}>
                Connect with your partner to start matching meals together
              </Text>
            </View>

            <View style={styles.choiceContainer}>
              <TouchableOpacity
                style={styles.choiceCard}
                onPress={handleGenerateCode}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.choiceIcon}>+</Text>
                <Text style={styles.choiceTitle}>Create Invite Code</Text>
                <Text style={styles.choiceDescription}>
                  Generate a code to share with your partner
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.choiceCard}
                onPress={() => setMode('enter')}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.choiceIcon}>#</Text>
                <Text style={styles.choiceTitle}>Enter Partner's Code</Text>
                <Text style={styles.choiceDescription}>
                  Have a code? Enter it to pair up
                </Text>
              </TouchableOpacity>
            </View>

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary.terracotta} />
              </View>
            )}
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  }

  if (mode === 'generate') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <LinearGradient
          colors={[colors.neutral.background, colors.accent.goldenLight + '25']}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Share This Code</Text>
              <Text style={styles.subtitle}>
                Your partner will use this code to pair with you
              </Text>
            </View>

            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Invite Code</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{generatedCode}</Text>
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={copyToClipboard}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Copy Code</Text>
              </TouchableOpacity>

              <Text style={styles.instructionText}>
                Share this code with your partner. Once they enter it, you'll be paired and can
                start swiping on recipes together!
              </Text>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setMode('choice');
                setGeneratedCode('');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>Back to Options</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  }

  // mode === 'enter'
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={[colors.neutral.background, colors.accent.goldenLight + '25']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Enter Invite Code</Text>
            <Text style={styles.subtitle}>
              Enter the code your partner shared with you
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Invite Code</Text>
              <TextInput
                style={styles.codeInput}
                placeholder="ABCD1234"
                placeholderTextColor={colors.neutral.text.tertiary}
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!loading}
                maxLength={8}
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAcceptCode}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.neutral.surface} />
              ) : (
                <Text style={styles.buttonText}>Pair Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setMode('choice');
                setInviteCode('');
                setError('');
              }}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>Back to Options</Text>
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
  choiceContainer: {
    gap: spacing.lg,
  },
  choiceCard: {
    backgroundColor: colors.neutral.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.md,
  },
  choiceIcon: {
    fontFamily: typography.families.display,
    fontSize: typography.sizes['5xl'],
    color: colors.primary.terracotta,
    marginBottom: spacing.md,
  },
  choiceTitle: {
    fontFamily: typography.families.ui,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.neutral.text.primary,
    marginBottom: spacing.xs,
  },
  choiceDescription: {
    fontFamily: typography.families.ui,
    fontSize: typography.sizes.sm,
    color: colors.neutral.text.secondary,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
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
  loadingContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  codeContainer: {
    backgroundColor: colors.neutral.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.md,
  },
  codeLabel: {
    fontFamily: typography.families.ui,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.neutral.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  codeBox: {
    backgroundColor: colors.accent.goldenLight + '20',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.accent.golden,
    borderStyle: 'dashed',
  },
  codeText: {
    fontFamily: typography.families.display,
    fontSize: typography.sizes['3xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary.terracotta,
    textAlign: 'center',
    letterSpacing: 4,
  },
  instructionText: {
    fontFamily: typography.families.ui,
    fontSize: typography.sizes.sm,
    color: colors.neutral.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
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
    textAlign: 'center',
  },
  codeInput: {
    fontFamily: typography.families.display,
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.neutral.text.primary,
    backgroundColor: colors.neutral.background,
    borderWidth: 2,
    borderColor: colors.neutral.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    textAlign: 'center',
    letterSpacing: 4,
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
  backButton: {
    marginTop: spacing.lg,
    padding: spacing.sm,
    alignItems: 'center',
  },
  backButtonText: {
    fontFamily: typography.families.ui,
    fontSize: typography.sizes.sm,
    color: colors.neutral.text.secondary,
  },
});
