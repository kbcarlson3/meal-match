# Error Handling and Loading States Guide

This guide explains how to use the error handling and loading state components throughout the Meal Match app.

## Components Overview

### 1. LoadingScreen
Full-screen loading indicator with warm aesthetic and animated food-themed spinner.

**Usage:**
```tsx
import { LoadingScreen } from '../components';

// In your component
if (isLoading) {
  return <LoadingScreen />;
}
```

### 2. ErrorBoundary
Catches React errors and displays a friendly error message with a "Try Again" button.

**Usage:**
```tsx
import { ErrorBoundary } from '../components';

// Wrap your app or specific components
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Already implemented in:** `App.js` (wraps entire app)

### 3. SkeletonLoader
Provides skeleton screens with shimmer animation for various content types.

**Available Skeletons:**
- `RecipeCardSkeleton` - For recipe cards
- `MealPlanSkeleton` - For meal plan view
- `ShoppingListSkeleton` - For shopping list
- `RecipeListSkeleton` - For recipe/match lists
- `SkeletonBox` - Generic skeleton box

**Usage:**
```tsx
import { RecipeCardSkeleton, MealPlanSkeleton } from '../components';

// In your component
if (loading) {
  return <RecipeCardSkeleton />;
}
```

**Examples:**
- `SwipeScreen.tsx` - Uses `RecipeCardSkeleton`
- `MealPlanScreen.tsx` - Uses `MealPlanSkeleton`
- `ShoppingListScreen.tsx` - Uses `ShoppingListSkeleton`

### 4. Toast Notifications
Simple toast notifications with success, error, and info variants.

**Usage:**
```tsx
import { toast } from '../components/Toast';

// Show success toast
toast.success('Recipe added to meal plan!');

// Show error toast
toast.error('Failed to save changes. Please try again.');

// Show info toast
toast.info('Connecting to server...');

// Custom duration (default is 3000ms)
toast.success('Done!', 5000);
```

**Already implemented in:**
- `App.js` - Includes `ToastContainer` component
- `SwipeScreen.tsx` - Shows errors on swipe failures
- `MealPlanScreen.tsx` - Shows success/error on meal operations

## Hooks Error Handling

All custom hooks already include comprehensive error handling:

### useRecipeQueue
```tsx
const { recipes, loading, error, hasMore, loadMore, refresh } = useRecipeQueue({
  coupleId,
  userId,
  filters,
});

// Handle errors
if (error) {
  // Show error state or toast
  toast.error('Failed to load recipes');
}
```

### useSwipes
```tsx
const { recording, recordSwipe } = useSwipes({ coupleId, userId, partnerId });

const result = await recordSwipe(recipeId, 'like');
if (result.error) {
  toast.error('Failed to record swipe');
}
```

### useMatches
```tsx
const { matches, isLoading, error, refetch } = useMatches(coupleId);

// Error handling
if (error) {
  // Show error UI
}
```

### useMealPlan
```tsx
const { mealPlans, loading, error, getMealPlan, addMealToDay } = useMealPlan();

// Optimistic updates with error rollback
try {
  await addMealToDay(coupleId, recipeId, dayOfWeek, weekStartDate);
  toast.success('Meal added!');
} catch (err) {
  // Hook automatically reverts optimistic update
  toast.error('Failed to add meal');
}
```

### useShoppingList
```tsx
const { shoppingList, loading, error, refresh } = useShoppingList(coupleId, weekStartDate);

if (error) {
  // Show error state
}
```

## Best Practices

### 1. Loading States
Always show loading indicators or skeletons when fetching data:

```tsx
// ✅ Good - Shows skeleton while loading
if (loading && data.length === 0) {
  return <RecipeCardSkeleton />;
}

// ❌ Bad - Shows nothing while loading
if (loading) return null;
```

### 2. Error Handling
Show user-friendly error messages and provide retry options:

```tsx
// ✅ Good - Clear error with retry
if (error) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Failed to load data</Text>
      <Button onPress={refresh}>Try Again</Button>
    </View>
  );
}

// ❌ Bad - Generic or no error handling
if (error) return <Text>Error</Text>;
```

### 3. Toast Usage
Use toasts for transient feedback, not critical errors:

```tsx
// ✅ Good - Toast for success feedback
toast.success('Recipe saved!');

// ✅ Good - Error UI for critical errors
if (error) {
  return <ErrorScreen error={error} />;
}

// ❌ Bad - Toast for critical errors
toast.error(error.message); // User might miss it
```

### 4. Optimistic Updates
Show immediate feedback, but rollback on error:

```tsx
// ✅ Good - Optimistic with rollback
try {
  // Show optimistic UI immediately
  setData([...data, newItem]);

  // Make API call
  await addItem(newItem);
  toast.success('Item added!');
} catch (err) {
  // Rollback on error
  setData(data);
  toast.error('Failed to add item');
}
```

### 5. Disable Buttons During Operations
Prevent duplicate submissions:

```tsx
<Button
  onPress={handleSubmit}
  disabled={loading}
>
  {loading ? 'Saving...' : 'Save'}
</Button>
```

## Error Scenarios to Test

1. **No Internet Connection**
   - All hooks handle network errors gracefully
   - Show appropriate error messages
   - Provide retry options

2. **API Failures**
   - Hooks return error states
   - Error boundaries catch unexpected errors
   - User sees friendly error messages

3. **Empty States**
   - No data available (e.g., no recipes, no matches)
   - Show helpful empty state messages
   - Guide users on what to do next

4. **Optimistic Update Failures**
   - UI shows immediate feedback
   - Automatically rolls back on error
   - Shows error toast

## Component Examples

### Full Loading Pattern
```tsx
function MyScreen() {
  const { data, loading, error, refresh } = useMyHook();

  if (loading && !data.length) {
    return <MyScreenSkeleton />;
  }

  if (error) {
    return (
      <ErrorView>
        <Text>Something went wrong</Text>
        <Button onPress={refresh}>Try Again</Button>
      </ErrorView>
    );
  }

  if (!data.length) {
    return (
      <EmptyView>
        <Text>No data yet</Text>
        <Text>Try adding some content</Text>
      </EmptyView>
    );
  }

  return (
    <View>
      {/* Your content */}
    </View>
  );
}
```

### Inline Loading (Pagination)
```tsx
function MyList() {
  const { data, loading, hasMore, loadMore } = useMyHook();

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      onEndReached={() => {
        if (hasMore && !loading) {
          loadMore();
        }
      }}
      ListFooterComponent={
        loading ? <ActivityIndicator /> : null
      }
    />
  );
}
```

## Summary

All error handling and loading state infrastructure is in place:

✅ **LoadingScreen** - Full-screen loading with warm aesthetic
✅ **ErrorBoundary** - Catches React errors globally
✅ **SkeletonLoader** - Shimmer animations for all content types
✅ **Toast** - Transient notifications for feedback
✅ **Hooks** - All hooks return `loading` and `error` states
✅ **Optimistic Updates** - With automatic rollback
✅ **Disabled States** - Buttons disabled during operations

The app now has comprehensive error handling and loading states throughout!
