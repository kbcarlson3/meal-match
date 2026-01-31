import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../design-system/tokens';
import { getFontFamily } from '../design-system/fonts';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import Constants from 'expo-constants';

const DIETARY_PREFERENCES = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-Free' },
  { id: 'dairy-free', label: 'Dairy-Free' },
  { id: 'nut-free', label: 'Nut-Free' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
];

export default function ProfileScreen({ navigation }: any) {
  const { user, profile, couple, logout, setProfile, setCouple } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Dietary preferences
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);

  // Notification settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [weeklyReminder, setWeeklyReminder] = useState(true);

  // Partner info
  const [partnerProfile, setPartnerProfile] = useState<any>(null);

  useEffect(() => {
    if (profile?.dietary_preferences) {
      setSelectedPreferences(profile.dietary_preferences);
    }
  }, [profile]);

  useEffect(() => {
    fetchPartnerProfile();
  }, [couple]);

  const fetchPartnerProfile = async () => {
    if (!couple || !user) return;

    const partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id;
    if (!partnerId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (error) throw error;
      setPartnerProfile(data);
    } catch (error) {
      console.error('Error fetching partner profile:', error);
    }
  };

  const handlePreferenceToggle = (preferenceId: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(preferenceId)
        ? prev.filter((p) => p !== preferenceId)
        : [...prev, preferenceId]
    );
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    try {
      setIsSaving(true);

      const { data, error } = await supabase
        .from('profiles')
        .update({ dietary_preferences: selectedPreferences })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      Alert.alert('Success', 'Dietary preferences updated successfully');
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnpair = () => {
    Alert.alert(
      'Unpair from Partner',
      'Are you sure you want to unpair? This will delete all your shared matches and meal plans.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpair',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);

              if (!couple) return;

              // Delete the couple record
              const { error } = await supabase
                .from('couples')
                .delete()
                .eq('id', couple.id);

              if (error) throw error;

              setCouple(null);
              Alert.alert('Success', 'You have been unpaired from your partner');
              navigation.navigate('Pairing');
            } catch (error: any) {
              console.error('Error unpairing:', error);
              Alert.alert('Error', 'Failed to unpair. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLoading(true);
            await logout();
          } catch (error: any) {
            console.error('Error logging out:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.terracotta} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
      </View>

      {/* User Info */}
      <View style={styles.section}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color={colors.neutral.text.tertiary} />
              </View>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{profile.full_name || 'User'}</Text>
            <Text style={styles.userEmail}>{profile.email}</Text>
          </View>
        </View>
      </View>

      {/* Partner Info */}
      {couple && partnerProfile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paired With</Text>
          <View style={styles.partnerInfo}>
            <View style={styles.partnerAvatarContainer}>
              {partnerProfile.avatar_url ? (
                <Image source={{ uri: partnerProfile.avatar_url }} style={styles.partnerAvatar} />
              ) : (
                <View style={[styles.partnerAvatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={24} color={colors.neutral.text.tertiary} />
                </View>
              )}
            </View>
            <Text style={styles.partnerName}>{partnerProfile.full_name || 'Partner'}</Text>
          </View>
        </View>
      )}

      {/* Dietary Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dietary Preferences</Text>
        <Text style={styles.sectionSubtitle}>
          Select your dietary restrictions to get personalized recipe recommendations
        </Text>

        <View style={styles.preferencesGrid}>
          {DIETARY_PREFERENCES.map((pref) => {
            const isSelected = selectedPreferences.includes(pref.id);
            return (
              <TouchableOpacity
                key={pref.id}
                style={[styles.preferenceChip, isSelected && styles.preferenceChipActive]}
                onPress={() => handlePreferenceToggle(pref.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={isSelected ? colors.neutral.surface : colors.neutral.text.tertiary}
                />
                <Text
                  style={[
                    styles.preferenceChipText,
                    isSelected && styles.preferenceChipTextActive,
                  ]}
                >
                  {pref.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSavePreferences}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.neutral.surface} />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color={colors.neutral.surface} />
              <Text style={styles.saveButtonText}>Save Preferences</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications-outline" size={24} color={colors.neutral.text.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications about your matches
              </Text>
            </View>
          </View>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: colors.neutral.border, true: colors.primary.terracottaLight }}
            thumbColor={pushNotifications ? colors.primary.terracotta : colors.neutral.text.tertiary}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="heart-outline" size={24} color={colors.neutral.text.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Match Notifications</Text>
              <Text style={styles.settingDescription}>
                Get notified when you match with your partner
              </Text>
            </View>
          </View>
          <Switch
            value={matchNotifications}
            onValueChange={setMatchNotifications}
            trackColor={{ false: colors.neutral.border, true: colors.primary.terracottaLight }}
            thumbColor={matchNotifications ? colors.primary.terracotta : colors.neutral.text.tertiary}
            disabled={!pushNotifications}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Ionicons name="calendar-outline" size={24} color={colors.neutral.text.primary} />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Weekly Meal Reminder</Text>
              <Text style={styles.settingDescription}>
                Get reminded to plan meals for the week
              </Text>
            </View>
          </View>
          <Switch
            value={weeklyReminder}
            onValueChange={setWeeklyReminder}
            trackColor={{ false: colors.neutral.border, true: colors.primary.terracottaLight }}
            thumbColor={weeklyReminder ? colors.primary.terracotta : colors.neutral.text.tertiary}
            disabled={!pushNotifications}
          />
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        {couple && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleUnpair}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="unlink-outline" size={24} color={colors.semantic.warning} />
            <Text style={[styles.actionButtonText, { color: colors.semantic.warning }]}>
              Unpair from Partner
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLogout}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color={colors.semantic.error} />
          <Text style={[styles.actionButtonText, { color: colors.semantic.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Meal Match</Text>
          <Text style={styles.appInfoVersion}>
            Version {Constants.expoConfig?.version || '1.0.0'}
          </Text>
        </View>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.neutral.surface,
  },
  headerTitle: {
    fontFamily: getFontFamily('display', 'bold'),
    fontSize: typography.sizes['2xl'],
    color: colors.neutral.text.primary,
  },
  section: {
    backgroundColor: colors.neutral.surface,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontFamily: getFontFamily('display', 'semibold'),
    fontSize: typography.sizes.lg,
    color: colors.neutral.text.primary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontFamily: getFontFamily('ui', 'normal'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.text.secondary,
    marginBottom: spacing.md,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: colors.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontFamily: getFontFamily('display', 'semibold'),
    fontSize: typography.sizes.xl,
    color: colors.neutral.text.primary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontFamily: getFontFamily('ui', 'normal'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.secondary,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  partnerAvatarContainer: {
    marginRight: spacing.md,
  },
  partnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  partnerName: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.primary,
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  preferenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral.background,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
  },
  preferenceChipActive: {
    backgroundColor: colors.secondary.sage,
    borderColor: colors.secondary.sage,
  },
  preferenceChipText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.text.secondary,
  },
  preferenceChipTextActive: {
    color: colors.neutral.surface,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.terracotta,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: getFontFamily('ui', 'semibold'),
    fontSize: typography.sizes.base,
    color: colors.neutral.surface,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.primary,
    marginBottom: spacing.xs / 2,
  },
  settingDescription: {
    fontFamily: getFontFamily('ui', 'normal'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.text.secondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.border,
  },
  actionButtonText: {
    fontFamily: getFontFamily('ui', 'medium'),
    fontSize: typography.sizes.base,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  appInfoText: {
    fontFamily: getFontFamily('display', 'semibold'),
    fontSize: typography.sizes.base,
    color: colors.neutral.text.secondary,
    marginBottom: spacing.xs,
  },
  appInfoVersion: {
    fontFamily: getFontFamily('ui', 'normal'),
    fontSize: typography.sizes.sm,
    color: colors.neutral.text.tertiary,
  },
  bottomSpacing: {
    height: spacing.lg,
  },
});
