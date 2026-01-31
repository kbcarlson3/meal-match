import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Please check your .env file and ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set.'
  );
}

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// =====================================================
// TypeScript Types for Database Schema
// =====================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          dietary_preferences: Json;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          dietary_preferences?: Json;
          push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          dietary_preferences?: Json;
          push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      couples: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string | null;
          invite_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id?: string | null;
          invite_code: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user1_id?: string;
          user2_id?: string | null;
          invite_code?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      recipes: {
        Row: {
          id: string;
          title: string;
          image_url: string | null;
          cuisine_type: string | null;
          area: string | null;
          category: string | null;
          ingredients: Json;
          instructions: string | null;
          youtube_url: string | null;
          tags: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          image_url?: string | null;
          cuisine_type?: string | null;
          area?: string | null;
          category?: string | null;
          ingredients?: Json;
          instructions?: string | null;
          youtube_url?: string | null;
          tags?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          image_url?: string | null;
          cuisine_type?: string | null;
          area?: string | null;
          category?: string | null;
          ingredients?: Json;
          instructions?: string | null;
          youtube_url?: string | null;
          tags?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      swipes: {
        Row: {
          id: string;
          user_id: string;
          recipe_id: string;
          couple_id: string;
          direction: 'like' | 'dislike';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipe_id: string;
          couple_id: string;
          direction: 'like' | 'dislike';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recipe_id?: string;
          couple_id?: string;
          direction?: 'like' | 'dislike';
          created_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          couple_id: string;
          recipe_id: string;
          is_favorite: boolean;
          matched_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          recipe_id: string;
          is_favorite?: boolean;
          matched_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          recipe_id?: string;
          is_favorite?: boolean;
          matched_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      meal_plans: {
        Row: {
          id: string;
          couple_id: string;
          recipe_id: string;
          day_of_week: number;
          week_start_date: string;
          display_order: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          recipe_id: string;
          day_of_week: number;
          week_start_date: string;
          display_order?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          couple_id?: string;
          recipe_id?: string;
          day_of_week?: number;
          week_start_date?: string;
          display_order?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      generate_invite_code: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {};
  };
}

// =====================================================
// App-specific Types
// =====================================================

export interface Ingredient {
  ingredient: string;
  measure: string;
}

export interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  cuisine_type: string | null;
  area: string | null;
  category: string | null;
  ingredients: Ingredient[];
  instructions: string | null;
  youtube_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  dietary_preferences: string[];
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Couple {
  id: string;
  user1_id: string;
  user2_id: string | null;
  invite_code: string;
  created_at: string;
  updated_at: string;
}

export interface Swipe {
  id: string;
  user_id: string;
  recipe_id: string;
  couple_id: string;
  direction: 'like' | 'dislike';
  created_at: string;
}

export interface Match {
  id: string;
  couple_id: string;
  recipe_id: string;
  is_favorite: boolean;
  matched_at: string;
  created_at: string;
  updated_at: string;
  recipe?: Recipe; // Joined data
}

export interface MealPlan {
  id: string;
  couple_id: string;
  recipe_id: string;
  day_of_week: number;
  week_start_date: string;
  display_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  recipe?: Recipe; // Joined data
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Get the current user's profile
 */
export async function getCurrentUserProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data as Profile;
}

/**
 * Get the current user's couple (if paired)
 */
export async function getCurrentUserCouple(): Promise<Couple | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No couple found
      return null;
    }
    console.error('Error fetching couple:', error);
    return null;
  }

  return data as Couple;
}

/**
 * Create a new couple and generate invite code
 */
export async function createCouple(): Promise<{
  couple: Couple | null;
  error: Error | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { couple: null, error: new Error('User not authenticated') };
  }

  // Generate invite code using database function
  const { data: inviteCode, error: codeError } = await supabase.rpc(
    'generate_invite_code'
  );

  if (codeError || !inviteCode) {
    return {
      couple: null,
      error: codeError || new Error('Failed to generate invite code'),
    };
  }

  const { data, error } = await supabase
    .from('couples')
    .insert({
      user1_id: user.id,
      invite_code: inviteCode,
    })
    .select()
    .single();

  if (error) {
    return { couple: null, error };
  }

  return { couple: data as Couple, error: null };
}

/**
 * Join a couple using an invite code
 */
export async function joinCouple(inviteCode: string): Promise<{
  couple: Couple | null;
  error: Error | null;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { couple: null, error: new Error('User not authenticated') };
  }

  // Find couple by invite code
  const { data: existingCouple, error: findError } = await supabase
    .from('couples')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .single();

  if (findError || !existingCouple) {
    return { couple: null, error: new Error('Invalid invite code') };
  }

  if (existingCouple.user2_id) {
    return { couple: null, error: new Error('Couple already full') };
  }

  if (existingCouple.user1_id === user.id) {
    return { couple: null, error: new Error('Cannot join your own couple') };
  }

  // Update couple with user2_id
  const { data, error } = await supabase
    .from('couples')
    .update({ user2_id: user.id })
    .eq('id', existingCouple.id)
    .select()
    .single();

  if (error) {
    return { couple: null, error };
  }

  return { couple: data as Couple, error: null };
}

/**
 * Record a swipe on a recipe
 */
export async function recordSwipe(
  recipeId: string,
  direction: 'like' | 'dislike',
  coupleId: string
): Promise<{ swipe: Swipe | null; error: Error | null }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { swipe: null, error: new Error('User not authenticated') };
  }

  const { data, error } = await supabase
    .from('swipes')
    .insert({
      user_id: user.id,
      recipe_id: recipeId,
      couple_id: coupleId,
      direction,
    })
    .select()
    .single();

  if (error) {
    return { swipe: null, error };
  }

  return { swipe: data as Swipe, error: null };
}

/**
 * Get all matches for a couple
 */
export async function getMatches(
  coupleId: string
): Promise<{ matches: Match[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('matches')
    .select(
      `
      *,
      recipe:recipes(*)
    `
    )
    .eq('couple_id', coupleId)
    .order('matched_at', { ascending: false });

  if (error) {
    return { matches: [], error };
  }

  return { matches: data as Match[], error: null };
}

/**
 * Get meal plan for a specific week
 */
export async function getMealPlan(
  coupleId: string,
  weekStartDate: string
): Promise<{ mealPlans: MealPlan[]; error: Error | null }> {
  const { data, error } = await supabase
    .from('meal_plans')
    .select(
      `
      *,
      recipe:recipes(*)
    `
    )
    .eq('couple_id', coupleId)
    .eq('week_start_date', weekStartDate)
    .order('day_of_week', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) {
    return { mealPlans: [], error };
  }

  return { mealPlans: data as MealPlan[], error: null };
}
