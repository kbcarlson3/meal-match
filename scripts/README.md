# Meal Match Scripts

This directory contains utility scripts for the Meal Match application.

## Available Scripts

### Screen Isolation Testing (test-screen.sh)

Test individual screens in isolation without loading the full app. Useful for debugging and incremental development.

**Usage:**
```bash
./scripts/test-screen.sh <screen-name>
```

**Available screens:**
- `design-system` - Design system components example
- `swipe` - Recipe swipe screen
- `mealplan` - Meal plan screen
- `matches` - Matches history screen
- `shopping` - Shopping list screen
- `profile` - User profile screen
- `pairing` - Couple pairing screen

**Example:**
```bash
# Test the design system components
./scripts/test-screen.sh design-system

# Test the swipe screen
./scripts/test-screen.sh swipe
```

**Manual Setup:**

You can also set the screen isolation manually in `.env`:
```bash
EXPO_PUBLIC_DEV_SCREEN=design-system
```

Then run:
```bash
npx expo start
```

**Disable Screen Isolation:**

Comment out or remove the `EXPO_PUBLIC_DEV_SCREEN` variable in `.env` to return to normal app flow.

**Debugging Strategy:**

1. Start with `design-system` (safest, no dependencies)
2. Test simple screens like `profile`
3. Test data-heavy screens like `swipe`
4. Test full navigation by removing `EXPO_PUBLIC_DEV_SCREEN`

This helps isolate which screen or feature is causing crashes.

### Recipe Seeding Script

Seeds the database with approximately 600 recipes from TheMealDB API.

#### Prerequisites

1. Supabase project must be set up
2. Database schema must be created (run migration first)
3. `.env` file must be configured with valid Supabase credentials

#### Usage

**JavaScript version (recommended for most users):**

```bash
npm run seed:recipes
```

**TypeScript version (requires tsx):**

```bash
# Install tsx if not already installed
npm install -D tsx dotenv

# Run the TypeScript version
npx tsx scripts/seed-recipes.ts
```

#### What it does

1. Fetches recipes from TheMealDB API by iterating through a-z
2. Transforms the data to match our database schema
3. Inserts recipes into Supabase in batches of 50
4. Handles duplicates using upsert (updates existing recipes)
5. Provides progress updates and error reporting

#### Expected Output

```
Starting recipe seeding process...

Fetching recipes from TheMealDB API...

Fetching recipes starting with 'A'...
  Found 32 recipes
Fetching recipes starting with 'B'...
  Found 48 recipes
...

Total recipes fetched: 587

Unique recipes: 587

Inserting recipes into Supabase...

Inserted batch 1: 50 recipes
Inserted batch 2: 50 recipes
...

================================
Recipe Seeding Complete!
================================
Total recipes processed: 587
Successfully inserted: 587
Errors: 0
================================
```

#### Troubleshooting

**Error: Missing Supabase credentials**
- Check your `.env` file
- Ensure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set
- No trailing spaces or quotes in the values

**Error: RLS policies blocking inserts**
- The script uses the anon key, which is subject to RLS policies
- The recipes table RLS policy allows authenticated users to insert
- You may need to temporarily adjust RLS policies or use a service role key for seeding

**Error: Schema validation errors**
- Ensure the database migration has been run
- Check that all required tables exist
- Verify column types match the schema

**No recipes fetched**
- Check your internet connection
- TheMealDB API may be temporarily unavailable
- Try again in a few minutes

#### Data Structure

Each recipe includes:
- **id**: Unique TheMealDB ID
- **title**: Recipe name
- **image_url**: URL to recipe image
- **cuisine_type**: Type of cuisine (e.g., "Dessert", "Vegetarian")
- **area**: Geographic region (e.g., "Italian", "Mexican")
- **category**: Recipe category
- **ingredients**: Array of {ingredient, measure} objects
- **instructions**: Step-by-step cooking instructions
- **youtube_url**: Link to video tutorial (if available)
- **tags**: Array of tags (e.g., ["Pasta", "Dinner"])

#### Re-running the Script

The script is safe to run multiple times. It uses `upsert` to update existing recipes rather than creating duplicates.

## Adding New Scripts

When creating new scripts:

1. Place them in this directory
2. Use a descriptive filename (e.g., `migrate-data.js`)
3. Add a script command to `package.json`
4. Update this README with usage instructions
5. Include error handling and progress logging
6. Use environment variables for configuration
