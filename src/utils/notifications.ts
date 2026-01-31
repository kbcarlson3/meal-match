import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push notification permissions');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get the Expo push token for this device
 */
export async function getPushToken(): Promise<string | null> {
  try {
    // Check permissions first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Get the token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID, // Optional: set in .env if using EAS
    });

    return tokenData.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Store the push token in the user's profile
 */
export async function storePushToken(userId: string, token: string): Promise<boolean> {
  try {
    // First, check if push_token column exists, if not we'll need to handle gracefully
    const { error } = await supabase
      .from('profiles')
      .update({
        push_token: token,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      // If column doesn't exist yet, log warning but don't fail
      console.warn('Could not store push token (column may not exist yet):', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error storing push token:', error);
    return false;
  }
}

/**
 * Register for push notifications and store the token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const token = await getPushToken();
    if (!token) {
      return null;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No authenticated user to register push token');
      return null;
    }

    // Store token in profile
    await storePushToken(user.id, token);

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Send a push notification when partner creates a match
 */
export async function sendMatchNotification(
  recipientUserId: string,
  recipeName: string
): Promise<boolean> {
  try {
    // Get recipient's push token from their profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', recipientUserId)
      .single();

    if (error || !profile?.push_token) {
      console.warn('No push token found for recipient');
      return false;
    }

    // Send notification via Expo's push notification service
    const message = {
      to: profile.push_token,
      sound: 'default',
      title: "It's a Match!",
      body: `You both liked "${recipeName}"! Time to add it to your meal plan.`,
      data: {
        type: 'match',
        recipeName,
      },
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('Error sending push notification:', result.errors);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending match notification:', error);
    return false;
  }
}

/**
 * Schedule a weekly meal planning reminder for Sunday evening
 */
export async function scheduleWeeklyReminder(): Promise<void> {
  try {
    // Cancel any existing weekly reminders
    await cancelWeeklyReminder();

    // Schedule notification for Sunday at 6 PM
    const trigger = {
      weekday: 1, // Sunday (1 = Sunday, 2 = Monday, etc.)
      hour: 18,
      minute: 0,
      repeats: true,
    };

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Plan Your Week!',
        body: "Time to plan your meals for the week ahead. What's on the menu?",
        data: {
          type: 'weekly_reminder',
        },
        sound: 'default',
      },
      trigger,
      identifier: 'weekly-meal-reminder',
    });

    console.log('Weekly reminder scheduled');
  } catch (error) {
    console.error('Error scheduling weekly reminder:', error);
  }
}

/**
 * Cancel the weekly meal planning reminder
 */
export async function cancelWeeklyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync('weekly-meal-reminder');
  } catch (error) {
    console.error('Error canceling weekly reminder:', error);
  }
}

/**
 * Handle notification tap and return the screen to navigate to
 */
export function getNavigationFromNotification(
  notification: Notifications.Notification
): { screen: string; params?: any } | null {
  const data = notification.request.content.data;

  if (!data || !data.type) {
    return null;
  }

  switch (data.type) {
    case 'match':
      // Navigate to Matches screen
      return {
        screen: 'Matches',
      };

    case 'weekly_reminder':
      // Navigate to Meal Plan screen
      return {
        screen: 'MealPlan',
      };

    default:
      return null;
  }
}

/**
 * Add notification response listener
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Add notification received listener (for foreground notifications)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Clean up notification listeners
 */
export function removeNotificationSubscription(
  subscription: Notifications.Subscription
): void {
  Notifications.removeNotificationSubscription(subscription);
}
