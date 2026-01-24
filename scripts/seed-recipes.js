/**
 * Seed Recipes Script
 *
 * Fetches all recipes from TheMealDB API and seeds them into the Supabase database.
 * This script loops through a-z to fetch approximately 600 recipes.
 *
 * Usage: npm run seed:recipes
 *
 * Requirements:
 * - .env file must be configured with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
 * - Database schema must be created (run migration first)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration
const MEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';
const BATCH_SIZE = 50; // Insert recipes in batches
const DELAY_MS = 100; // Delay between API calls to avoid rate limiting

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Delay execution for a specified time
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch recipes from TheMealDB by first letter
 */
async function fetchRecipesByLetter(letter) {
  try {
    const response = await fetch(`${MEALDB_BASE_URL}/search.php?f=${letter}`);
    const data = await response.json();
    return data.meals || [];
  } catch (error) {
    console.error(`Error fetching recipes for letter ${letter}:`, error.message);
    return [];
  }
}

/**
 * Transform TheMealDB recipe to our database schema
 */
function transformRecipe(meal) {
  // Extract ingredients and measures
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];

    if (ingredient && ingredient.trim()) {
      ingredients.push({
        ingredient: ingredient.trim(),
        measure: measure ? measure.trim() : '',
      });
    }
  }

  // Parse tags
  const tags = meal.strTags ? meal.strTags.split(',').map(tag => tag.trim()) : [];

  return {
    id: meal.idMeal,
    title: meal.strMeal,
    image_url: meal.strMealThumb,
    cuisine_type: meal.strCategory || null,
    area: meal.strArea || null,
    category: meal.strCategory || null,
    ingredients: ingredients,
    instructions: meal.strInstructions || null,
    youtube_url: meal.strYoutube || null,
    tags: tags,
  };
}

/**
 * Insert recipes into Supabase in batches
 */
async function insertRecipes(recipes) {
  let totalInserted = 0;
  let totalErrors = 0;

  // Process in batches
  for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
    const batch = recipes.slice(i, i + BATCH_SIZE);

    try {
      const { data, error } = await supabase
        .from('recipes')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
        totalErrors += batch.length;
      } else {
        totalInserted += batch.length;
        console.log(`Inserted batch ${i / BATCH_SIZE + 1}: ${batch.length} recipes`);
      }
    } catch (error) {
      console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
      totalErrors += batch.length;
    }

    // Small delay between batches
    await delay(100);
  }

  return { totalInserted, totalErrors };
}

/**
 * Main seeding function
 */
async function seedRecipes() {
  console.log('Starting recipe seeding process...\n');
  console.log('Fetching recipes from TheMealDB API...\n');

  const allRecipes = [];
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

  // Fetch recipes for each letter
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

    // Delay between requests to be nice to the API
    await delay(DELAY_MS);
  }

  console.log(`\nTotal recipes fetched: ${allRecipes.length}\n`);

  if (allRecipes.length === 0) {
    console.log('No recipes to insert. Exiting.');
    return;
  }

  // Remove duplicates (just in case)
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

// Run the seeding process
seedRecipes()
  .then(() => {
    console.log('Seeding process finished.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  });
