-- Meal Match Database Schema
-- This migration creates all tables and Row Level Security (RLS) policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with app-specific data
-- =====================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  dietary_preferences JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create index for faster lookups
CREATE INDEX idx_profiles_email ON profiles(email);

-- =====================================================
-- COUPLES TABLE
-- Links two users together with a unique invite code
-- =====================================================

CREATE TABLE couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT different_users CHECK (user1_id != user2_id)
);

-- Enable RLS on couples
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;

-- Couples RLS Policies
CREATE POLICY "Users can view their own couples"
  ON couples
  FOR SELECT
  USING (
    auth.uid() = user1_id OR
    auth.uid() = user2_id
  );

CREATE POLICY "Users can create couples"
  ON couples
  FOR INSERT
  WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update their own couples"
  ON couples
  FOR UPDATE
  USING (
    auth.uid() = user1_id OR
    auth.uid() = user2_id
  );

-- Indexes for faster lookups
CREATE INDEX idx_couples_user1 ON couples(user1_id);
CREATE INDEX idx_couples_user2 ON couples(user2_id);
CREATE INDEX idx_couples_invite_code ON couples(invite_code);

-- =====================================================
-- RECIPES TABLE
-- Stores recipe data from TheMealDB API
-- =====================================================

CREATE TABLE recipes (
  id TEXT PRIMARY KEY, -- TheMealDB ID (e.g., "52772")
  title TEXT NOT NULL,
  image_url TEXT,
  cuisine_type TEXT,
  area TEXT,
  category TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]'::JSONB,
  instructions TEXT,
  youtube_url TEXT,
  tags JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on recipes
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Recipes RLS Policies
-- All authenticated users can view all recipes
CREATE POLICY "Authenticated users can view all recipes"
  ON recipes
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only service role can insert/update recipes (for seeding)
CREATE POLICY "Service role can insert recipes"
  ON recipes
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Service role can update recipes"
  ON recipes
  FOR UPDATE
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Indexes for faster searches
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipes_area ON recipes(area);
CREATE INDEX idx_recipes_cuisine_type ON recipes(cuisine_type);
CREATE INDEX idx_recipes_title ON recipes USING GIN(to_tsvector('english', title));

-- =====================================================
-- SWIPES TABLE
-- Records user swipes (like/dislike) on recipes
-- =====================================================

CREATE TABLE swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_recipe_swipe UNIQUE (user_id, recipe_id, couple_id)
);

-- Enable RLS on swipes
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;

-- Swipes RLS Policies
CREATE POLICY "Users can view swipes in their couple"
  ON swipes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = swipes.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own swipes"
  ON swipes
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own swipes"
  ON swipes
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own swipes"
  ON swipes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for faster lookups
CREATE INDEX idx_swipes_user_id ON swipes(user_id);
CREATE INDEX idx_swipes_recipe_id ON swipes(recipe_id);
CREATE INDEX idx_swipes_couple_id ON swipes(couple_id);
CREATE INDEX idx_swipes_direction ON swipes(direction);

-- =====================================================
-- MATCHES TABLE
-- Records when both users in a couple like the same recipe
-- =====================================================

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  is_favorite BOOLEAN DEFAULT FALSE,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_couple_recipe_match UNIQUE (couple_id, recipe_id)
);

-- Enable RLS on matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Matches RLS Policies
CREATE POLICY "Users can view matches in their couple"
  ON matches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = matches.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert matches for their couple"
  ON matches
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update matches in their couple"
  ON matches
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = matches.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete matches in their couple"
  ON matches
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = matches.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

-- Indexes for faster lookups
CREATE INDEX idx_matches_couple_id ON matches(couple_id);
CREATE INDEX idx_matches_recipe_id ON matches(recipe_id);
CREATE INDEX idx_matches_is_favorite ON matches(is_favorite);
CREATE INDEX idx_matches_matched_at ON matches(matched_at DESC);

-- =====================================================
-- MEAL_PLANS TABLE
-- Stores scheduled meals for each couple's weekly plan
-- =====================================================

CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 6 = Saturday
  week_start_date DATE NOT NULL, -- Monday of the week
  display_order INTEGER DEFAULT 0, -- For multiple meals per day
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_couple_day_order UNIQUE (couple_id, week_start_date, day_of_week, display_order)
);

-- Enable RLS on meal_plans
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Meal Plans RLS Policies
CREATE POLICY "Users can view meal plans in their couple"
  ON meal_plans
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = meal_plans.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert meal plans for their couple"
  ON meal_plans
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update meal plans in their couple"
  ON meal_plans
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = meal_plans.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete meal plans in their couple"
  ON meal_plans
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = meal_plans.couple_id
      AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

-- Indexes for faster lookups
CREATE INDEX idx_meal_plans_couple_id ON meal_plans(couple_id);
CREATE INDEX idx_meal_plans_recipe_id ON meal_plans(recipe_id);
CREATE INDEX idx_meal_plans_week_start ON meal_plans(week_start_date);
CREATE INDEX idx_meal_plans_day_of_week ON meal_plans(day_of_week);

-- =====================================================
-- FUNCTIONS
-- Helper functions for common operations
-- =====================================================

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_couples_updated_at
  BEFORE UPDATE ON couples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate a unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed ambiguous chars
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to detect matches when a swipe is created
CREATE OR REPLACE FUNCTION check_for_match()
RETURNS TRIGGER AS $$
DECLARE
  partner_id UUID;
  partner_swipe_direction TEXT;
BEGIN
  -- Only check for matches on 'like' swipes
  IF NEW.direction = 'like' THEN
    -- Get partner ID from couple
    SELECT CASE
      WHEN user1_id = NEW.user_id THEN user2_id
      ELSE user1_id
    END INTO partner_id
    FROM couples
    WHERE id = NEW.couple_id;

    -- Check if partner also liked this recipe
    SELECT direction INTO partner_swipe_direction
    FROM swipes
    WHERE user_id = partner_id
      AND recipe_id = NEW.recipe_id
      AND couple_id = NEW.couple_id;

    -- If partner also liked it, create a match
    IF partner_swipe_direction = 'like' THEN
      INSERT INTO matches (couple_id, recipe_id, matched_at)
      VALUES (NEW.couple_id, NEW.recipe_id, NOW())
      ON CONFLICT (couple_id, recipe_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check for matches after swipe
CREATE TRIGGER on_swipe_created
  AFTER INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION check_for_match();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE couples IS 'Links two users together for recipe matching';
COMMENT ON TABLE recipes IS 'Recipe data from TheMealDB API';
COMMENT ON TABLE swipes IS 'User swipes on recipes (like/dislike)';
COMMENT ON TABLE matches IS 'Recipes that both users in a couple liked';
COMMENT ON TABLE meal_plans IS 'Scheduled meals for each couple';

COMMENT ON COLUMN couples.invite_code IS 'Unique 6-character code for pairing users';
COMMENT ON COLUMN recipes.ingredients IS 'Array of {ingredient, measure} objects';
COMMENT ON COLUMN recipes.tags IS 'Array of tag strings from TheMealDB';
COMMENT ON COLUMN meal_plans.day_of_week IS '0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN meal_plans.display_order IS 'Order for multiple meals on same day';
