import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Newsreader_400Regular } from '@expo-google-fonts/newsreader';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { StatusBar } from 'expo-status-bar';

import { useAuthStore } from './src/store/authStore';
import { colors } from './src/design-system/tokens';
import {
  registerForPushNotifications,
  scheduleWeeklyReminder,
  addNotificationResponseListener,
  addNotificationReceivedListener,
  removeNotificationSubscription,
  getNavigationFromNotification,
} from './src/utils/notifications';
import { initializeGlobalErrorHandlers } from './src/utils/globalErrorHandlers';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ToastContainer } from './src/components/Toast';
import LoadingScreen from './src/components/LoadingScreen';

// Initialize global error handlers FIRST (before app renders)
initializeGlobalErrorHandlers();

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import PairingScreen from './src/screens/auth/PairingScreen';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

// Placeholder screens for authenticated users (to be created in future tasks)
const SwipeScreen = () => (
  <View style={styles.placeholder}>
    <ActivityIndicator size="large" color={colors.primary.terracotta} />
  </View>
);

const MealPlanScreen = () => (
  <View style={styles.placeholder}>
    <ActivityIndicator size="large" color={colors.primary.terracotta} />
  </View>
);

const MatchesScreen = () => (
  <View style={styles.placeholder}>
    <ActivityIndicator size="large" color={colors.primary.terracotta} />
  </View>
);

const ShoppingListScreen = () => (
  <View style={styles.placeholder}>
    <ActivityIndicator size="large" color={colors.primary.terracotta} />
  </View>
);

// Auth Navigator - for unauthenticated users
function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.neutral.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

// Main Tab Navigator - for authenticated and paired users
function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.neutral.surface,
          borderTopColor: colors.neutral.border,
        },
        tabBarActiveTintColor: colors.primary.terracotta,
        tabBarInactiveTintColor: colors.neutral.text.tertiary,
      }}
    >
      <Tab.Screen
        name="Swipe"
        component={SwipeScreen}
        options={{ tabBarLabel: 'Swipe' }}
      />
      <Tab.Screen
        name="MealPlan"
        component={MealPlanScreen}
        options={{ tabBarLabel: 'Meal Plan' }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{ tabBarLabel: 'Matches' }}
      />
      <Tab.Screen
        name="Shopping"
        component={ShoppingListScreen}
        options={{ tabBarLabel: 'Shopping' }}
      />
    </Tab.Navigator>
  );
}

// Screen Isolation Wrapper - handles dev screen rendering before RootNavigator
function DevScreenIsolation() {
  const DEV_SCREEN = __DEV__ ? process.env.EXPO_PUBLIC_DEV_SCREEN : null;

  console.log(`[DEV] DevScreenIsolation called, __DEV__=${__DEV__}, DEV_SCREEN=${DEV_SCREEN}`);

  if (!DEV_SCREEN) {
    console.log('[DEV] No screen isolation, returning null');
    return null; // No isolation, will render RootNavigator normally
  }

  console.log(`[DEV] Rendering isolated screen: ${DEV_SCREEN}`);

  // Super simple test screen
  if (DEV_SCREEN === 'simple-test') {
    const { Text: RNText } = require('react-native');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <View style={{ padding: 20, backgroundColor: '#E8756F', borderRadius: 8 }}>
          <RNText style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
            ✓ Screen Isolation Working!
          </RNText>
          <RNText style={{ color: 'white', fontSize: 14, marginTop: 8 }}>
            If you can see this, basic rendering works.
          </RNText>
          <RNText style={{ color: 'white', fontSize: 12, marginTop: 8 }}>
            The crash is NOT in basic React Native.
          </RNText>
        </View>
      </View>
    );
  }

  // Lazy load screens to avoid import errors
  let ScreenComponent;

  try {
    switch (DEV_SCREEN) {
      case 'design-system':
        ScreenComponent = require('./src/design-system/example').default;
        break;
      case 'swipe':
        ScreenComponent = require('./src/screens/SwipeScreen').default;
        break;
      case 'mealplan':
        ScreenComponent = require('./src/screens/MealPlanScreen').default;
        break;
      case 'matches':
        ScreenComponent = require('./src/screens/MatchesHistoryScreen').default;
        break;
      case 'shopping':
        ScreenComponent = require('./src/screens/ShoppingListScreen').default;
        break;
      case 'profile':
        ScreenComponent = require('./src/screens/ProfileScreen').default;
        break;
      case 'pairing':
        ScreenComponent = PairingScreen;
        break;
      default:
        console.warn(`[DEV] Unknown screen: ${DEV_SCREEN}, loading normally`);
        break;
    }

    if (ScreenComponent) {
      return <ScreenComponent />;
    }
  } catch (error) {
    console.error(`[DEV] Failed to load screen ${DEV_SCREEN}:`, error);
  }

  // If we get here, something went wrong, render normally
  return null;
}

// Root Navigator - manages auth state and pairing state
function RootNavigator() {
  // Force strict boolean coercion with explicit type guards
  const isAuthenticated = useAuthStore((state) => {
    const val = state.isAuthenticated;
    return (val === true || val === 'true') === true;
  });
  const isPaired = useAuthStore((state) => {
    const val = state.isPaired;
    return (val === true || val === 'true') === true;
  });
  const isLoading = useAuthStore((state) => {
    const val = state.isLoading;
    return (val === true || val === 'true') === true;
  });

  // Development bypass - skip auth flow entirely
  const DEV_BYPASS_AUTH = __DEV__ && process.env.EXPO_PUBLIC_DEV_BYPASS_AUTH === 'true';

  if (DEV_BYPASS_AUTH) {
    console.log('[DEV] Auth bypass enabled - skipping to main app');
    return <MainNavigator />;
  }

  // Debug logging to check types
  if (__DEV__) {
    console.log('[RootNavigator] Auth state types:', {
      isAuthenticated: `${typeof isAuthenticated} = ${isAuthenticated}`,
      isPaired: `${typeof isPaired} = ${isPaired}`,
      isLoading: `${typeof isLoading} = ${isLoading}`,
    });
  }

  // Show loading screen while initializing
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Not authenticated - show auth screens
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Authenticated but not paired - show pairing screen
  if (!isPaired) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Pairing" component={PairingScreen} />
      </Stack.Navigator>
    );
  }

  // Authenticated and paired - show main app
  return <MainNavigator />;
}

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);
  // Force strict boolean coercion with explicit type guard
  const isAuthenticated = useAuthStore((state) => {
    const val = state.isAuthenticated;
    return (val === true || val === 'true') === true;
  });
  const [isReady, setIsReady] = useState(false);
  const navigationRef = useRef();
  const notificationListener = useRef();
  const responseListener = useRef();

  // Load fonts
  const [fontsLoaded] = useFonts({
    Fraunces_700Bold,
    Newsreader_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  // Initialize auth state
  useEffect(() => {
    async function prepare() {
      try {
        await initialize();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, [initialize]);

  // Set up push notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Register for push notifications
      registerForPushNotifications().then((token) => {
        if (token) {
          console.log('Push notification token:', token);
          // Schedule weekly reminder
          scheduleWeeklyReminder();
        }
      });

      // Listen for notifications received while app is in foreground
      notificationListener.current = addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
      });

      // Listen for notification taps
      responseListener.current = addNotificationResponseListener((response) => {
        const navigationInfo = getNavigationFromNotification(response.notification);

        if (navigationInfo && navigationRef.current) {
          navigationRef.current.navigate(navigationInfo.screen, navigationInfo.params);
        }
      });

      // Clean up listeners on unmount
      return () => {
        if (notificationListener.current) {
          removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          removeNotificationSubscription(responseListener.current);
        }
      };
    }
  }, [isAuthenticated]);

  // Wait for fonts and initialization
  if (!fontsLoaded || !isReady) {
    return <LoadingScreen />;
  }

  // DEVELOPMENT: Check for screen isolation BEFORE rendering navigation
  const isolatedScreen = DevScreenIsolation();
  if (isolatedScreen) {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          {isolatedScreen}
          <ToastContainer />
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="dark" />
          <RootNavigator />
          <ToastContainer />
        </NavigationContainer>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.background,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral.background,
  },
});
