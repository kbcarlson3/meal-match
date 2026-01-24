# Supabase Setup Instructions

This guide will help you set up a Supabase project for the Meal Match app.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign In"
3. Sign up using GitHub, Google, or email

## Step 2: Create a New Project

1. Once logged in, click "New Project"
2. Select your organization (or create one if this is your first project)
3. Fill in the project details:
   - **Name**: `meal-match` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Free tier is sufficient for development

4. Click "Create new project"
5. Wait 2-3 minutes for your project to be provisioned

## Step 3: Get Your API Credentials

1. Once your project is ready, go to **Settings** (gear icon in the sidebar)
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL**: This is your `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key**: This is your `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Step 4: Configure Your Environment Variables

1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_MEALDB_API_URL=https://www.themealdb.com/api/json/v1/1
```

**Important**: Never commit your `.env` file to version control. It's already in `.gitignore`.

## Step 5: Run Database Migrations

After setting up your credentials, you'll need to create the database schema:

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link your project:
```bash
supabase link --project-ref your-project-ref
```

3. Run migrations:
```bash
supabase db push
```

### Option B: Using SQL Editor in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the sidebar
3. Create a new query
4. Copy the contents of `supabase/migrations/001_initial_schema.sql`
5. Paste into the SQL editor
6. Click "Run" to execute the migration

## Step 6: Verify Your Setup

1. Go to **Table Editor** in the Supabase dashboard
2. You should see the following tables:
   - profiles
   - couples
   - recipes
   - swipes
   - matches
   - meal_plans

3. Click on any table and go to the **Policies** tab to verify RLS policies are enabled

## Step 7: Seed Recipe Data

After the schema is created, run the seed script to populate recipes:

```bash
npm run seed:recipes
```

This will fetch approximately 600 recipes from TheMealDB API and insert them into your database.

## Troubleshooting

### Can't connect to Supabase
- Verify your `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are correct
- Make sure there are no trailing spaces in your `.env` file
- Restart your Expo development server after changing `.env`

### Migration fails
- Check that you have the correct project linked
- Verify your database password is correct
- Try running the SQL manually through the SQL Editor

### RLS policies blocking queries
- During development, you can temporarily disable RLS on specific tables
- Make sure you're authenticated when testing (user must be logged in)
- Check the RLS policies match your authentication state

## Next Steps

1. Run the migration to create your database schema (Task #5)
2. Seed recipes from TheMealDB API (Task #6)
3. Implement authentication in your app (Task #10)
4. Start building your screens and features

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [TheMealDB API Documentation](https://www.themealdb.com/api.php)
