# Screen Isolation Testing

A development feature that allows you to test individual screens in isolation, bypassing the full navigation stack and app initialization.

## Why Use Screen Isolation?

When debugging crashes or developing new features, loading the full app can make it hard to identify the source of issues. Screen isolation helps by:

- **Isolating problems**: If design-system works but swipe crashes, you know the issue is in SwipeScreen
- **Faster iteration**: No need to go through auth/pairing to test a feature
- **Clearer errors**: Error stack traces point to the specific screen being tested
- **Mock data friendly**: Easy to test with hardcoded data instead of API calls
- **Bypass bridge errors**: If the error is in auth initialization, you skip it entirely

## Quick Start

### Method 1: Using the test-screen.sh script

```bash
./scripts/test-screen.sh design-system
```

### Method 2: Manual setup in .env

Add to your `.env` file:
```bash
EXPO_PUBLIC_DEV_SCREEN=design-system
```

Then run:
```bash
npx expo start
```

## Available Screens

- `design-system` - Design system components example (safest, no dependencies)
- `swipe` - Recipe swipe screen
- `mealplan` - Meal plan screen
- `matches` - Matches history screen
- `shopping` - Shopping list screen
- `profile` - User profile screen
- `pairing` - Couple pairing screen

## Debugging Strategy

Follow this incremental approach to isolate issues:

### Phase 1: Verify Basics Work
```bash
EXPO_PUBLIC_DEV_SCREEN=design-system
```

**Expected**: Design system example renders with buttons, cards, animations
**If it crashes**: The issue is in basic React Native setup, not app logic

### Phase 2: Test Simple Screens
```bash
EXPO_PUBLIC_DEV_SCREEN=profile
```

**Expected**: Profile screen renders (even if data is missing)
**If it crashes**: Check what the profile screen imports/requires

### Phase 3: Test Data-Heavy Screens
```bash
EXPO_PUBLIC_DEV_SCREEN=swipe
```

**Expected**: Swipe screen renders (might show "no recipes" if DB empty)
**If it crashes**: Issue likely in data fetching or Supabase integration

### Phase 4: Test Full Navigation
```bash
# Remove EXPO_PUBLIC_DEV_SCREEN from .env
# Keep: EXPO_PUBLIC_DEV_BYPASS_AUTH=true
```

**Expected**: All tabs load, can navigate between them
**If it crashes**: Issue is in navigation setup or screen interaction

## Disabling Screen Isolation

To return to normal app flow:

1. Comment out or remove `EXPO_PUBLIC_DEV_SCREEN` from `.env`
2. Keep `EXPO_PUBLIC_DEV_BYPASS_AUTH=true` if you want to skip login
3. Restart the development server

## How It Works

The screen isolation feature modifies the `RootNavigator` in `App.js`:

1. Checks for `EXPO_PUBLIC_DEV_SCREEN` environment variable
2. If set, loads only that specific screen component
3. Bypasses auth checks, navigation setup, and other initialization
4. Returns early before the normal navigation flow

This happens **before** any auth state checks, so you can test screens that would normally require authentication.

## Technical Details

### Files Modified

- `App.js` - Added screen isolation logic in `RootNavigator` function
- `.env` - Added `EXPO_PUBLIC_DEV_SCREEN` variable
- `src/utils/DevScreenWrapper.tsx` - Created wrapper for isolated screens (optional)
- `scripts/test-screen.sh` - Created convenience script for quick testing

### Environment Variables

All development environment variables must have the `EXPO_PUBLIC_` prefix to be accessible at runtime in Expo:

- `EXPO_PUBLIC_DEV_BYPASS_AUTH` - Skip auth flow
- `EXPO_PUBLIC_DEV_SCREEN` - Load specific screen in isolation
- `EXPO_PUBLIC_DEV_MOCK_USER_ID` - Mock user ID for development
- `EXPO_PUBLIC_DEV_MOCK_COUPLE_ID` - Mock couple ID for development

### Error Handling

The screen isolation feature includes error handling:

```javascript
try {
  ScreenComponent = require('./src/screens/SwipeScreen').default;
  if (ScreenComponent) {
    return <ScreenComponent />;
  }
} catch (error) {
  console.error(`[DEV] Failed to load screen ${DEV_SCREEN}:`, error);
  // Falls through to normal app flow
}
```

If a screen fails to load, the app will log the error and continue with the normal navigation flow.

## Examples

### Test design system (no dependencies)
```bash
./scripts/test-screen.sh design-system
```

### Test swipe screen with auth bypass
```bash
# In .env:
EXPO_PUBLIC_DEV_BYPASS_AUTH=true
EXPO_PUBLIC_DEV_SCREEN=swipe

npx expo start
```

### Test full app with auth bypass (no screen isolation)
```bash
# In .env:
EXPO_PUBLIC_DEV_BYPASS_AUTH=true
# EXPO_PUBLIC_DEV_SCREEN=design-system  # commented out

npx expo start
```

## Production Safety

Screen isolation only works in development mode:

```javascript
const DEV_SCREEN = __DEV__ ? process.env.EXPO_PUBLIC_DEV_SCREEN : null;
```

The `__DEV__` check ensures this feature is completely disabled in production builds. Your production app will always use the normal navigation flow.

## Troubleshooting

### Screen doesn't load

1. Check the console for error messages
2. Verify the screen name matches exactly (case-sensitive)
3. Check that the screen file exists in the expected location
4. Try loading the design-system screen to verify the feature works

### Still seeing auth screens

1. Verify `EXPO_PUBLIC_DEV_SCREEN` is set in `.env`
2. Restart the development server with `npx expo start --clear`
3. Check that there are no typos in the variable name
4. Ensure you're using the `EXPO_PUBLIC_` prefix

### Screen loads but crashes

This is actually helpful! You've identified which screen has the issue. Now you can:

1. Check the error stack trace
2. Look at what that screen imports and uses
3. Test with mock data instead of real API calls
4. Add console.logs to narrow down the crash location

## Next Steps

Once you identify which screen crashes:

1. **Focus on that specific screen's code**
2. **Check what it imports** (components, hooks, utils)
3. **Verify its data dependencies** (Supabase queries, auth state)
4. **Test with mock data** instead of real API calls
5. **Gradually add back complexity** until the crash returns
