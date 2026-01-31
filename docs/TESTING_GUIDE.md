# Testing Guide for Notifications and Error Handling

This guide covers how to test the notification system and error handling features in the Meal Match app.

## Prerequisites

1. **Physical Device Required for Notifications**
   - Push notifications do NOT work on iOS Simulator
   - Android Emulator requires additional setup
   - Best to test on real iOS/Android devices

2. **Expo Account**
   - Create an account at https://expo.dev
   - Note your project ID for push notifications

3. **Database Setup**
   - Run the migration to add `push_token` column:
     ```sql
     -- In Supabase SQL Editor, run:
     -- supabase/migrations/add_push_token_to_profiles.sql
     ```

## Testing Push Notifications

### 1. Setup

1. **Configure Project ID** (Optional but recommended)
   ```bash
   # Add to .env file
   EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
   ```

2. **Install on Device**
   ```bash
   # iOS
   npm run ios

   # Android
   npm run android
   ```

3. **Grant Notification Permissions**
   - On first launch, app will request notification permissions
   - Tap "Allow" when prompted

### 2. Test Notification Registration

1. **Check Console Logs**
   - After login, look for: `Push notification token: ExponentPushToken[...]`
   - This confirms registration succeeded

2. **Verify Database**
   - In Supabase, check the `profiles` table
   - User's `push_token` should be populated

### 3. Test Match Notifications

**Setup:**
- Need two paired accounts on different devices
- Both devices should be logged in

**Test Steps:**
1. User A swipes right (like) on a recipe
2. User B swipes right (like) on the SAME recipe
3. User A should receive a notification: "It's a Match!"
4. Tap the notification
5. App should navigate to Matches screen

**Expected Behavior:**
- Notification appears on lock screen
- Notification shows recipe name
- Tapping notification opens app to Matches screen
- If app is in foreground, notification still shows

### 4. Test Weekly Reminders

**Setup:**
- Login and grant notification permissions
- Wait until Sunday at 6 PM (or manually trigger)

**Manual Testing:**
```javascript
// In notifications.ts, temporarily change the trigger:
const trigger = {
  seconds: 10, // Trigger in 10 seconds for testing
  repeats: false,
};
```

**Test Steps:**
1. Wait for notification
2. Should receive: "Plan Your Week!"
3. Tap notification
4. Should navigate to Meal Plan screen

**Reset to Production:**
```javascript
const trigger = {
  weekday: 1, // Sunday
  hour: 18,
  minute: 0,
  repeats: true,
};
```

### 5. Test Notification Handling

**Foreground Notifications:**
1. Open app
2. While app is open, trigger a match
3. Should see notification banner at top
4. Can tap to navigate

**Background Notifications:**
1. Send app to background (home button)
2. Trigger a match
3. Should receive notification
4. Tap to open app

**Killed App:**
1. Force quit the app
2. Trigger a match
3. Should receive notification
4. Tap to launch app

## Testing Error Handling

### 1. Network Errors

**Simulate No Internet:**
1. Turn off WiFi and mobile data
2. Try to:
   - Load recipes (SwipeScreen)
   - Load meal plan (MealPlanScreen)
   - Load shopping list (ShoppingListScreen)

**Expected Behavior:**
- Show skeleton loaders initially
- After timeout, show error message
- "Try Again" button available
- Clicking "Try Again" retries the request

### 2. API Failures

**Simulate Supabase Outage:**
1. Temporarily change Supabase URL to invalid URL in `.env`
2. Restart app
3. Try various operations

**Expected Behavior:**
- Operations fail gracefully
- Error messages shown
- No app crashes
- Can retry operations

### 3. Empty States

**Test No Recipes:**
1. Filter recipes to very specific criteria
2. No results should be found

**Expected Behavior:**
- Shows friendly empty state
- Message: "No more recipes to swipe!"
- Suggests changing filters or refreshing

**Test No Meal Plan:**
1. Navigate to Meal Plan screen
2. Select a week with no meals

**Expected Behavior:**
- Shows empty week
- Can add meals by tapping days

**Test No Shopping List:**
1. Navigate to Shopping screen
2. Select week with no meal plan

**Expected Behavior:**
- Shows empty state
- Message about adding meals first

### 4. Loading States

**Test Skeleton Loaders:**
1. Clear app cache
2. Navigate to each screen
3. Should see skeleton loaders while loading

**Screens to Test:**
- SwipeScreen → RecipeCardSkeleton
- MealPlanScreen → MealPlanSkeleton
- ShoppingListScreen → ShoppingListSkeleton

**Expected Behavior:**
- Skeletons show immediately
- Shimmer animation visible
- Transitions smoothly to actual content

### 5. Toast Notifications

**Test Success Toast:**
1. Add meal to meal plan
2. Should see green success toast: "Moved [recipe] to [day]"

**Test Error Toast:**
1. Turn off internet
2. Try to swipe on a recipe
3. Should see red error toast: "Failed to record swipe"

**Test Toast Auto-Dismiss:**
1. Trigger any toast
2. Toast should disappear after 3 seconds

**Test Multiple Toasts:**
1. Trigger multiple toasts quickly
2. Should stack vertically
3. Each dismisses independently

### 6. Optimistic Updates

**Test Meal Plan Optimistic Update:**
1. Add meal to meal plan
2. Meal appears immediately (optimistic)
3. If network fails, meal disappears (rollback)
4. Error toast shown

**Test Shopping List Check:**
1. Check item in shopping list
2. Checkbox updates immediately
3. Saved to local storage
4. Persists across app restarts

### 7. Error Boundary

**Trigger Error Boundary:**
```javascript
// Temporarily add to any component
if (someCondition) {
  throw new Error('Test error');
}
```

**Expected Behavior:**
- App doesn't crash
- Shows friendly error screen
- "Try Again" button resets error boundary
- In dev mode, shows error details

**Test Scenarios:**
- Rendering error in SwipeScreen
- State update error in MealPlanScreen
- Network error in hooks

## Testing Checklist

### Notifications
- [ ] Permission request on first launch
- [ ] Token saved to database
- [ ] Match notification received
- [ ] Notification tap navigates correctly
- [ ] Weekly reminder scheduled
- [ ] Weekly reminder received
- [ ] Foreground notifications work
- [ ] Background notifications work
- [ ] Killed app notifications work

### Error Handling
- [ ] Network errors show error UI
- [ ] API failures handled gracefully
- [ ] Empty states display correctly
- [ ] Skeleton loaders show while loading
- [ ] Success toasts appear
- [ ] Error toasts appear
- [ ] Toasts auto-dismiss
- [ ] Optimistic updates work
- [ ] Optimistic rollback on error
- [ ] Error boundary catches errors
- [ ] "Try Again" buttons work

### Loading States
- [ ] SwipeScreen skeleton
- [ ] MealPlanScreen skeleton
- [ ] ShoppingListScreen skeleton
- [ ] Auth screens loading states
- [ ] Buttons disabled during operations
- [ ] Loading indicators for pagination

## Common Issues

### Notifications Not Working

**iOS:**
- Check that notifications are enabled in Settings > Meal Match
- Verify you're on a physical device (not simulator)
- Check console for token errors

**Android:**
- Verify `google-services.json` is configured (if using FCM)
- Check notification permissions in app settings
- Ensure device has Google Play Services

### Toasts Not Showing

- Verify `ToastContainer` is in `App.js`
- Check that it's not covered by other components
- Look for z-index issues

### Skeletons Not Animating

- Check that `react-native-reanimated` is installed
- Verify Reanimated is configured in `babel.config.js`
- Try restarting Metro bundler

## Performance Testing

1. **Large Data Sets**
   - Test with 100+ recipes
   - Test with 50+ matches
   - Test with full week meal plan

2. **Slow Network**
   - Use Chrome DevTools to simulate slow 3G
   - Verify loading states show
   - Verify timeouts work

3. **Memory Leaks**
   - Navigate between screens multiple times
   - Check memory usage in Xcode/Android Studio
   - Verify cleanup functions run

## Automated Testing (Future)

Consider adding:
- Jest unit tests for notification utilities
- React Testing Library for component tests
- E2E tests with Detox for full flows
- Mock Supabase for offline testing

## Production Checklist

Before deploying to production:
- [ ] Test notifications on real devices
- [ ] Verify all error states
- [ ] Test offline functionality
- [ ] Check loading state transitions
- [ ] Verify toast messages are user-friendly
- [ ] Test error boundary fallbacks
- [ ] Review console logs (remove debug logs)
- [ ] Test on iOS and Android
- [ ] Verify push token cleanup on logout
