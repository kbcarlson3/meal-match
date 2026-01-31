/**
 * Seed Recipes Script (TypeScript)
 *
 * Fetches all recipes from TheMealDB API and seeds them into the Supabase database.
 * This script loops through a-z to fetch approximately 600 recipes.
 *
 * Usage: npx tsx scripts/seed-recipes.ts
 *
 * Requirements:
 * - .env file must be configured with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
 * - Database schema must be created (run migration first)
 * - Install tsx: npm install -D tsx
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/supabase';

// Configuration
const MEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';
const BATCH_SIZE = 50;
const DELAY_MS = 100;

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are set');
  console.error('\nTo create a Secret API key:');
  console.error('1. Go to your Supabase project dashboard');
  console.error('2. Navigate to Settings > API > Secret API keys');
  console.error('3. Click "Create new secret key"');
  console.error('4. Name it "Recipe Seeding Key"');
  console.error('5. Grant INSERT permission on the recipes table');
  console.error('6. Copy the generated key');
  console.error('7. Add it to your .env file as SUPABASE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseSecretKey);

// =====================================================
// TheMealDB API Types
// =====================================================

interface MealDBMeal {
  idMeal: string;
  strMeal: string;
  strDrinkAlternate: string | null;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  strYoutube: string;
  strIngredient1: string;
  strIngredient2: string;
  strIngredient3: string;
  strIngredient4: string;
  strIngredient5: string;
  strIngredient6: string;
  strIngredient7: string;
  strIngredient8: string;
  strIngredient9: string;
  strIngredient10: string;
  strIngredient11: string;
  strIngredient12: string;
  strIngredient13: string;
  strIngredient14: string;
  strIngredient15: string;
  strIngredient16: string;
  strIngredient17: string;
  strIngredient18: string;
  strIngredient19: string;
  strIngredient20: string;
  strMeasure1: string;
  strMeasure2: string;
  strMeasure3: string;
  strMeasure4: string;
  strMeasure5: string;
  strMeasure6: string;
  strMeasure7: string;
  strMeasure8: string;
  strMeasure9: string;
  strMeasure10: string;
  strMeasure11: string;
  strMeasure12: string;
  strMeasure13: string;
  strMeasure14: string;
  strMeasure15: string;
  strMeasure16: string;
  strMeasure17: string;
  strMeasure18: string;
  strMeasure19: string;
  strMeasure20: string;
  strSource: string | null;
  strImageSource: string | null;
  strCreativeCommonsConfirmed: string | null;
  dateModified: string | null;
}

interface MealDBResponse {
  meals: MealDBMeal[] | null;
}

interface Ingredient {
  ingredient: string;
  measure: string;
}

interface Recipe {
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
}

// =====================================================
// Helper Functions
// =====================================================

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchRecipesByLetter(letter: string): Promise<MealDBMeal[]> {
  try {
    const response = await fetch(`${MEALDB_BASE_URL}/search.php?f=${letter}`);
    const data: MealDBResponse = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error(
      `Error fetching recipes for letter ${letter}:`,
      error instanceof Error ? error.message : 'Unknown error'
    );
    return [];
  }
}

function transformRecipe(meal: MealDBMeal): Recipe {
  const ingredients: Ingredient[] = [];

  for (let i = 1; i <= 20; i++) {
    const ingredientKey = `strIngredient${i}` as keyof MealDBMeal;
    const measureKey = `strMeasure${i}` as keyof MealDBMeal;

    const ingredient = meal[ingredientKey] as string;
    const measure = meal[measureKey] as string;

    if (ingredient && ingredient.trim()) {
      ingredients.push({
        ingredient: ingredient.trim(),
        measure: measure ? measure.trim() : '',
      });
    }
  }

  const tags = meal.strTags
    ? meal.strTags.split(',').map(tag => tag.trim())
    : [];

  return {
    id: meal.idMeal,
    title: meal.strMeal,
    image_url: meal.strMealThumb || null,
    cuisine_type: meal.strCategory || null,
    area: meal.strArea || null,
    category: meal.strCategory || null,
    ingredients,
    instructions: meal.strInstructions || null,
    youtube_url: meal.strYoutube || null,
    tags,
  };
}

async function insertRecipes(
  recipes: Recipe[]
): Promise<{ totalInserted: number; totalErrors: number }> {
  let totalInserted = 0;
  let totalErrors = 0;

  for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
    const batch = recipes.slice(i, i + BATCH_SIZE);

    try {
      const { error } = await supabase
        .from('recipes')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error(
          `Error inserting batch ${i / BATCH_SIZE + 1}:`,
          error.message
        );
        totalErrors += batch.length;
      } else {
        totalInserted += batch.length;
        console.log(
          `Inserted batch ${i / BATCH_SIZE + 1}: ${batch.length} recipes`
        );
      }
    } catch (error) {
      console.error(
        `Error inserting batch ${i / BATCH_SIZE + 1}:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
      totalErrors += batch.length;
    }

    await delay(100);
  }

  return { totalInserted, totalErrors };
}

// =====================================================
// Main Function
// =====================================================

async function seedRecipes(): Promise<void> {
  console.log('Starting recipe seeding process...\n');
  console.log('Fetching recipes from TheMealDB API...\n');

  const allRecipes: Recipe[] = [];
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

  for (const letter of alphabet) {
    console.log(`Fetching recipes starting with '${letter.toUpperCase()}'...`);
    const meals = await fetchRecipesByLetter(letter);

    if (meals.length > 0) {
      const transformed = meals.map(transformRecipe);
      allRecipes.push(...transformed);
      console.log(`  Found ${meals.length} recipes`);
    } else {
      console.log(`  No recipes found`);
    }

    await delay(DELAY_MS);
  }

  console.log(`\nTotal recipes fetched: ${allRecipes.length}\n`);

  if (allRecipes.length === 0) {
    console.log('No recipes to insert. Exiting.');
    return;
  }

  const uniqueRecipes = Array.from(
    new Map(allRecipes.map(recipe => [recipe.id, recipe])).values()
  );

  console.log(`Unique recipes: ${uniqueRecipes.length}\n`);
  console.log('Inserting recipes into Supabase...\n');

  const { totalInserted, totalErrors } = await insertRecipes(uniqueRecipes);

  console.log('\n================================');
  console.log('Recipe Seeding Complete!');
  console.log('================================');
  console.log(`Total recipes processed: ${uniqueRecipes.length}`);
  console.log(`Successfully inserted: ${totalInserted}`);
  console.log(`Errors: ${totalErrors}`);
  console.log('================================\n');

  if (totalErrors > 0) {
    console.log('Some recipes failed to insert. This may be due to:');
    console.log('- Database connection issues');
    console.log('- Schema validation errors');
    console.log('- RLS policies blocking inserts');
    console.log('\nCheck the error messages above for details.');
  }
}

// Run
seedRecipes()
  .then(() => {
    console.log('Seeding process finished.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  });
