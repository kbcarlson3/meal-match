# Database Setup Quick Reference

This guide provides a quick overview of setting up the Meal Match database with Supabase.

## Quick Start

### 1. Set Up Supabase Project

Follow the detailed instructions in [`supabase/SETUP.md`](./supabase/SETUP.md) to:
- Create a Supabase account and project
- Get your API credentials
- Configure your `.env` file

### 2. Run Database Migration

Create all database tables and RLS policies:

**Option A: Using Supabase CLI (Recommended)**

```bash
# Install CLI
npm install -g supabase

# Link project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

**Option B: Using SQL Editor**

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and execute

### 3. Seed Recipe Data

Populate the database with ~600 recipes from TheMealDB:

```bash
npm run seed:recipes
```

See [`scripts/README.md`](./scripts/README.md) for detailed seeding instructions.

## Database Schema Overview

### Tables

- **profiles** - User profiles extending Supabase auth
  - Stores dietary preferences as JSONB
  - Auto-created when user signs up

- **couples** - Pairs two users together
  - Unique invite code for pairing
  - Links user1 and user2

- **recipes** - Recipe data from TheMealDB
  - ~600 recipes with ingredients, instructions, images
  - Includes cuisine type, area, category, tags

- **swipes** - User swipes on recipes
  - Records like/dislike for each recipe
  - Unique per user/recipe/couple combination

- **matches** - Mutual likes from both partners
  - Auto-created when both users like a recipe
  - Can be marked as favorite

- **meal_plans** - Weekly meal schedule
  - 7 days (0=Sunday, 6=Saturday)
  - Multiple meals per day supported
  - Linked to couples and recipes

### Key Features

**Row Level Security (RLS)**
- All tables have RLS enabled
- Data isolated by couple_id
- Users can only access their own data and their couple's data

**Automatic Triggers**
- Profile creation on user signup
- Match detection when both users like a recipe
- Updated_at timestamp management

**Helper Functions**
- `generate_invite_code()` - Creates unique 6-character codes
- `handle_new_user()` - Auto-creates profile on signup
- `check_for_match()` - Detects mutual likes

## File Structure

```
meal-match/
├── .env                           # Environment variables (DO NOT COMMIT)
├── .env.example                   # Template for .env
├── DATABASE_SETUP.md              # This file
├── supabase/
│   ├── SETUP.md                   # Detailed setup instructions
│   ├── migrations/
│   │   └── 001_initial_schema.sql # Database schema + RLS policies
│   └── functions/                 # Future Supabase functions
├── scripts/
│   ├── README.md                  # Scripts documentation
│   ├── seed-recipes.js            # Recipe seeding script (JS)
│   └── seed-recipes.ts            # Recipe seeding script (TS)
└── src/
    └── lib/
        └── supabase.ts            # Supabase client + TypeScript types
```

## Usage in Your App

### Initialize Supabase Client

```typescript
import { supabase } from './src/lib/supabase';
```

### Common Operations

```typescript
// Get current user's profile
import { getCurrentUserProfile } from './src/lib/supabase';
const profile = await getCurrentUserProfile();

// Get current user's couple
import { getCurrentUserCouple } from './src/lib/supabase';
const couple = await getCurrentUserCouple();

// Create a new couple
import { createCouple } from './src/lib/supabase';
const { couple, error } = await createCouple();
console.log('Invite code:', couple.invite_code);

// Join a couple
import { joinCouple } from './src/lib/supabase';
const { couple, error } = await joinCouple('ABC123');

// Record a swipe
import { recordSwipe } from './src/lib/supabase';
const { swipe, error } = await recordSwipe(recipeId, 'like', coupleId);

// Get matches
import { getMatches } from './src/lib/supabase';
const { matches, error } = await getMatches(coupleId);

// Get meal plan
import { getMealPlan } from './src/lib/supabase';
const { mealPlans, error } = await getMealPlan(coupleId, '2026-01-20');
```

### TypeScript Support

All database types are available in `src/lib/supabase.ts`:

```typescript
import type { Recipe, Profile, Couple, Swipe, Match, MealPlan } from './src/lib/supabase';
```

## Verification Checklist

After setup, verify everything is working:

- [ ] Supabase project created
- [ ] Environment variables configured in `.env`
- [ ] Database migration executed successfully
- [ ] All 6 tables created in Supabase dashboard
- [ ] RLS policies visible on each table
- [ ] Recipes seeded (~600 recipes in `recipes` table)
- [ ] Can query recipes from your app

## Troubleshooting

### "Missing Supabase credentials" error
- Check `.env` file has correct `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Restart Expo dev server after changing `.env`

### Migration fails
- Verify project is linked correctly
- Check database password is correct
- Try running SQL manually in Supabase SQL Editor

### Recipe seeding fails
- Ensure migration ran successfully first
- Check internet connection
- Verify RLS policies allow inserts (may need to adjust temporarily)

### RLS blocking queries
- User must be authenticated
- Check user is part of a couple for couple-specific queries
- Verify couple_id is correct

## Next Steps

1. Implement authentication in your app (Task #10)
2. Build the swipe screen (Task #11)
3. Create match detection logic (Task #12)
4. Set up real-time subscriptions (Task #13)

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [TheMealDB API](https://www.themealdb.com/api.php)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
