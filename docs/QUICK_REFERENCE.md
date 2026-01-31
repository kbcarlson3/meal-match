# Quick Reference Guide

Quick reference for common tasks and patterns in the Meal Match app.

## Import Components

```javascript
// All in one import
import {
  LoadingScreen,
  ErrorBoundary,
  RecipeCardSkeleton,
  MealPlanSkeleton,
  ShoppingListSkeleton,
  RecipeListSkeleton,
  SkeletonBox,
  toast,
  ToastContainer,
} from '../components';
```

## Show Loading State

```javascript
// Full screen loading
if (loading && !data.length) {
  return <LoadingScreen />;
}

// Skeleton for specific content
if (loading) {
  return <RecipeCardSkeleton />;
}
```

## Handle Errors

```javascript
// Show error UI
if (error) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Failed to load data</Text>
      <Text style={styles.errorSubtext}>{error.message}</Text>
      <Button onPress={refresh}>Try Again</Button>
    </View>
  );
}

// Show error toast
try {
  await someOperation();
  toast.success('Success!');
} catch (error) {
  toast.error('Operation failed');
}
```

## Toast Notifications

```javascript
// Success (green)
toast.success('Recipe added to meal plan!');

// Error (red)
toast.error('Failed to save changes');

// Info (blue)
toast.info('Loading data...');

// Custom duration (default 3000ms)
toast.success('Done!', 5000);
```

## Optimistic Updates

```javascript
const [data, setData] = useState([]);

const addItem = async (newItem) => {
  // 1. Update UI immediately
  setData([...data, newItem]);

  try {
    // 2. Save to database
    await saveToDatabase(newItem);
    toast.success('Item added!');
  } catch (error) {
    // 3. Rollback on error
    setData(data);
    toast.error('Failed to add item');
  }
};
```

## Notifications

```javascript
// In your component (notifications auto-register in App.js)
import { sendMatchNotification } from '../utils/notifications';

// Send notification to partner
await sendMatchNotification(partnerId, recipeName);
```

## Database Migration

Run the push token migration in Supabase SQL Editor:

```sql
-- Add push_token column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add index
CREATE INDEX IF NOT EXISTS idx_profiles_push_token
ON profiles(push_token)
WHERE push_token IS NOT NULL;
```

## Disable Buttons During Operations

```javascript
const [loading, setLoading] = useState(false);

<Button
  onPress={handleSubmit}
  disabled={loading}
>
  {loading ? 'Saving...' : 'Save'}
</Button>
```

## Empty States

```javascript
if (!data.length) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Data</Text>
      <Text style={styles.emptyText}>
        Add some content to get started
      </Text>
      <Button onPress={handleAdd}>Add Item</Button>
    </View>
  );
}
```

## Common Patterns

### Standard Screen Pattern

```javascript
function MyScreen() {
  const { data, loading, error, refresh } = useMyHook();

  // 1. Loading state
  if (loading && !data.length) {
    return <MyScreenSkeleton />;
  }

  // 2. Error state
  if (error) {
    return <ErrorView onRetry={refresh} />;
  }

  // 3. Empty state
  if (!data.length) {
    return <EmptyView />;
  }

  // 4. Success state
  return (
    <View>
      {data.map(item => <Item key={item.id} {...item} />)}
    </View>
  );
}
```

### Hook with Error Handling

```javascript
function useMyData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFromAPI();
      setData(result);
    } catch (err) {
      setError(err);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch: fetchData };
}
```

## Testing

```bash
# Run on device (notifications require physical device)
npm run ios     # iOS
npm run android # Android

# Test scenarios
1. Turn off internet → Should show error states
2. Clear app cache → Should show loading states
3. Trigger notifications → Should receive and navigate
4. Force app error → Should show error boundary
```

## File Locations

```
src/
├── components/
│   ├── LoadingScreen.tsx     # Full screen loading
│   ├── ErrorBoundary.tsx     # Error catching
│   ├── SkeletonLoader.tsx    # Skeleton screens
│   └── Toast.tsx             # Toast notifications
├── utils/
│   └── notifications.ts      # Notification system
└── hooks/
    ├── useRecipeQueue.ts     # Recipe loading
    ├── useSwipes.ts          # Swipe handling
    ├── useMatches.ts         # Match loading
    ├── useMealPlan.ts        # Meal plan CRUD
    └── useShoppingList.ts    # Shopping list

docs/
├── ERROR_HANDLING_GUIDE.md   # Detailed error handling
├── TESTING_GUIDE.md          # Testing instructions
├── TASKS_20_22_SUMMARY.md    # Implementation summary
└── QUICK_REFERENCE.md        # This file

supabase/
└── migrations/
    └── add_push_token_to_profiles.sql
```

## Styling with Design System

```javascript
import { colors, typography, spacing, borderRadius, shadows } from '../design-system/tokens';
import { getFontFamily } from '../design-system/fonts';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral.background,
    padding: spacing.xl,
  },
  title: {
    fontFamily: getFontFamily('display', 'bold'),
    fontSize: typography.sizes['2xl'],
    color: colors.neutral.text.primary,
  },
  card: {
    backgroundColor: colors.neutral.surface,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
});
```

## Environment Variables

Required in `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_PROJECT_ID=your_expo_project_id  # Optional
```

## Common Commands

```bash
# Development
npm start              # Start Expo
npm run ios            # Run on iOS
npm run android        # Run on Android

# Clear cache
expo start --clear     # Clear Metro cache
rm -rf node_modules && npm install  # Fresh install

# Database
# Run migrations in Supabase SQL Editor
```

## Tips

1. **Always use skeletons** instead of blank screens
2. **Always provide retry buttons** on errors
3. **Use toasts for transient feedback** (not critical errors)
4. **Test on real devices** for notifications
5. **Handle empty states** gracefully
6. **Disable buttons** during operations
7. **Use optimistic updates** for better UX
8. **Catch errors in hooks** and return error state

## Getting Help

- See `ERROR_HANDLING_GUIDE.md` for detailed patterns
- See `TESTING_GUIDE.md` for test scenarios
- See `TASKS_20_22_SUMMARY.md` for implementation details
- Check console logs for debugging
- Use React DevTools for component inspection
