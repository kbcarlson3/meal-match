import { Ingredient } from '../lib/supabase';

export type IngredientCategory = 'Produce' | 'Protein' | 'Dairy' | 'Pantry' | 'Spices';

export interface AggregatedIngredient {
  ingredient: string;
  measure: string;
  category: IngredientCategory;
  recipeIds: string[];
}

export interface CategorizedIngredients {
  Produce: AggregatedIngredient[];
  Protein: AggregatedIngredient[];
  Dairy: AggregatedIngredient[];
  Pantry: AggregatedIngredient[];
  Spices: AggregatedIngredient[];
}

// Category mappings based on ingredient names
const CATEGORY_KEYWORDS: Record<IngredientCategory, string[]> = {
  Produce: [
    'tomato', 'onion', 'garlic', 'pepper', 'lettuce', 'carrot', 'celery',
    'potato', 'spinach', 'mushroom', 'broccoli', 'cucumber', 'avocado',
    'lemon', 'lime', 'orange', 'apple', 'banana', 'strawberry', 'blueberry',
    'cilantro', 'parsley', 'basil', 'mint', 'thyme', 'rosemary', 'dill',
    'ginger', 'cabbage', 'corn', 'peas', 'beans', 'zucchini', 'squash',
    'kale', 'arugula', 'chard', 'beet', 'radish', 'scallion', 'shallot',
    'leek', 'fennel', 'artichoke', 'asparagus', 'eggplant', 'turnip',
  ],
  Protein: [
    'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'fish', 'salmon',
    'tuna', 'shrimp', 'prawn', 'crab', 'lobster', 'scallop', 'clam',
    'mussel', 'egg', 'tofu', 'tempeh', 'bacon', 'sausage', 'ham',
    'steak', 'ground beef', 'ground pork', 'ground turkey', 'chorizo',
    'cod', 'halibut', 'mahi', 'tilapia', 'catfish', 'anchovy', 'sardine',
  ],
  Dairy: [
    'milk', 'cream', 'butter', 'cheese', 'cheddar', 'mozzarella', 'parmesan',
    'yogurt', 'sour cream', 'cottage cheese', 'ricotta', 'feta', 'goat cheese',
    'blue cheese', 'swiss cheese', 'provolone', 'brie', 'gouda', 'cream cheese',
    'mascarpone', 'whipped cream', 'half and half', 'buttermilk',
  ],
  Spices: [
    'salt', 'pepper', 'paprika', 'cumin', 'coriander', 'cinnamon', 'nutmeg',
    'turmeric', 'curry', 'chili', 'cayenne', 'oregano', 'basil', 'thyme',
    'sage', 'bay leaf', 'cardamom', 'clove', 'allspice', 'vanilla',
    'extract', 'seasoning', 'spice', 'dried', 'powder', 'ground',
    'crushed', 'flakes', 'seeds', 'fresh herbs', 'anise', 'fennel seed',
  ],
  Pantry: [
    'flour', 'sugar', 'rice', 'pasta', 'oil', 'olive oil', 'vegetable oil',
    'canola oil', 'coconut oil', 'vinegar', 'soy sauce', 'worcestershire',
    'stock', 'broth', 'bouillon', 'tomato paste', 'tomato sauce', 'ketchup',
    'mustard', 'mayonnaise', 'bread', 'tortilla', 'noodle', 'quinoa',
    'couscous', 'oats', 'cereal', 'crackers', 'chips', 'honey', 'maple syrup',
    'molasses', 'jam', 'jelly', 'peanut butter', 'almond butter', 'tahini',
    'baking powder', 'baking soda', 'yeast', 'cornstarch', 'gelatin',
    'chocolate', 'cocoa', 'coffee', 'tea', 'wine', 'beer', 'brandy',
    'rum', 'whiskey', 'vodka', 'gin', 'can', 'canned', 'jar', 'jarred',
  ],
};

/**
 * Categorize an ingredient based on its name
 */
export function categorizeIngredient(ingredientName: string): IngredientCategory {
  const lowerName = ingredientName.toLowerCase();

  // Check each category for matching keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category as IngredientCategory;
    }
  }

  // Default to Pantry if no match found
  return 'Pantry';
}

/**
 * Parse measurement string and normalize units
 */
function normalizeMeasurement(measure: string): { value: number; unit: string } {
  const lowerMeasure = measure.toLowerCase().trim();

  // Handle common conversions
  const fractionMap: Record<string, number> = {
    '1/4': 0.25,
    '1/3': 0.33,
    '1/2': 0.5,
    '2/3': 0.67,
    '3/4': 0.75,
  };

  // Extract numeric value
  let value = 0;
  let unit = lowerMeasure;

  // Check for fractions
  for (const [fraction, decimal] of Object.entries(fractionMap)) {
    if (lowerMeasure.includes(fraction)) {
      value += decimal;
      unit = unit.replace(fraction, '').trim();
    }
  }

  // Extract whole numbers
  const numberMatch = lowerMeasure.match(/(\d+\.?\d*)/);
  if (numberMatch) {
    value += parseFloat(numberMatch[1]);
    unit = lowerMeasure.replace(numberMatch[0], '').trim();
  }

  // If no value found, assume 1
  if (value === 0) {
    value = 1;
  }

  // Normalize unit names
  const unitNormalizations: Record<string, string> = {
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
    'cup': 'cup',
    'cups': 'cup',
    'ounce': 'oz',
    'ounces': 'oz',
    'pound': 'lb',
    'pounds': 'lb',
    'gram': 'g',
    'grams': 'g',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'liter': 'l',
    'liters': 'l',
  };

  for (const [fullName, abbrev] of Object.entries(unitNormalizations)) {
    if (unit.includes(fullName)) {
      unit = abbrev;
      break;
    }
  }

  // Clean up unit
  unit = unit.trim() || 'item';

  return { value, unit };
}

/**
 * Combine measurements of the same ingredient
 */
function combineMeasurements(measures: string[]): string {
  if (measures.length === 0) return '';
  if (measures.length === 1) return measures[0];

  // Parse all measurements
  const parsed = measures.map(m => normalizeMeasurement(m));

  // Group by unit
  const byUnit = new Map<string, number>();
  const unmeasured: string[] = [];

  parsed.forEach((p, i) => {
    if (p.unit === 'item' && p.value === 1) {
      // Keep original for items without clear measurements
      unmeasured.push(measures[i]);
    } else {
      const current = byUnit.get(p.unit) || 0;
      byUnit.set(p.unit, current + p.value);
    }
  });

  // Build combined string
  const parts: string[] = [];

  // Add summed measurements
  byUnit.forEach((value, unit) => {
    // Round to 2 decimal places and remove trailing zeros
    const roundedValue = Math.round(value * 100) / 100;
    parts.push(`${roundedValue} ${unit}`);
  });

  // Add unmeasured items
  if (unmeasured.length > 0) {
    parts.push(...unmeasured);
  }

  return parts.join(' + ') || measures[0];
}

/**
 * Aggregate ingredients from multiple recipes
 */
export function aggregateIngredients(
  recipes: Array<{ id: string; ingredients: Ingredient[] }>
): CategorizedIngredients {
  const ingredientMap = new Map<string, { measures: string[]; recipeIds: string[] }>();

  // Collect all ingredients
  recipes.forEach(recipe => {
    recipe.ingredients.forEach(ing => {
      const normalizedName = ing.ingredient.toLowerCase().trim();

      if (!ingredientMap.has(normalizedName)) {
        ingredientMap.set(normalizedName, { measures: [], recipeIds: [] });
      }

      const entry = ingredientMap.get(normalizedName)!;
      entry.measures.push(ing.measure);
      if (!entry.recipeIds.includes(recipe.id)) {
        entry.recipeIds.push(recipe.id);
      }
    });
  });

  // Aggregate and categorize
  const categorized: CategorizedIngredients = {
    Produce: [],
    Protein: [],
    Dairy: [],
    Pantry: [],
    Spices: [],
  };

  ingredientMap.forEach((data, ingredientName) => {
    const category = categorizeIngredient(ingredientName);
    const combinedMeasure = combineMeasurements(data.measures);

    // Capitalize first letter of ingredient name
    const displayName = ingredientName.charAt(0).toUpperCase() + ingredientName.slice(1);

    categorized[category].push({
      ingredient: displayName,
      measure: combinedMeasure,
      category,
      recipeIds: data.recipeIds,
    });
  });

  // Sort each category alphabetically
  Object.keys(categorized).forEach(cat => {
    const category = cat as IngredientCategory;
    categorized[category].sort((a, b) => a.ingredient.localeCompare(b.ingredient));
  });

  return categorized;
}

/**
 * Format categorized ingredients for display
 */
export function formatShoppingList(categorized: CategorizedIngredients): string {
  let output = '';

  const categories: IngredientCategory[] = ['Produce', 'Protein', 'Dairy', 'Pantry', 'Spices'];

  categories.forEach(category => {
    const items = categorized[category];
    if (items.length === 0) return;

    output += `\n${category.toUpperCase()}\n`;
    output += '─'.repeat(30) + '\n';

    items.forEach(item => {
      output += `☐ ${item.measure} ${item.ingredient}\n`;
    });
  });

  return output.trim();
}
