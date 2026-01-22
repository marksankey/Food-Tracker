/**
 * Migration script to fix syn values for existing products
 *
 * This script corrects syn values that were stored as per-100g
 * instead of per-serving for products imported from Open Food Facts.
 */

import { pool } from '../config/database.js';

interface FoodRecord {
  id: string;
  name: string;
  syn_value: number;
  portion_size: number;
  portion_unit: string;
  category: string;
}

const fixSynValues = async () => {
  console.log('🔧 Starting syn value migration...\n');

  // Get all commercial products (from Open Food Facts)
  const result = await pool.query(`
    SELECT id, name, syn_value, portion_size, portion_unit, category
    FROM foods
    WHERE category = 'commercial'
    AND portion_size != 100
    AND syn_value > 0
  `);

  const products = result.rows as FoodRecord[];

  console.log(`Found ${products.length} products that need fixing\n`);

  if (products.length === 0) {
    console.log('✅ No products need fixing');
    return;
  }

  let fixed = 0;
  let skipped = 0;

  for (const product of products) {
    // Calculate the scaled syn value (from per-100g to per-serving)
    const scaledSynValue = product.syn_value * (product.portion_size / 100);

    // Only update if the values are different (accounting for rounding)
    if (Math.abs(product.syn_value - scaledSynValue) > 0.01) {
      const roundedValue = Math.round(scaledSynValue * 2) / 2;
      await pool.query(
        `UPDATE foods SET syn_value = $1 WHERE id = $2`,
        [roundedValue, product.id]
      );

      console.log(`✅ Fixed: ${product.name}`);
      console.log(`   Before: ${product.syn_value} syns (per 100g)`);
      console.log(`   After: ${roundedValue} syns (per ${product.portion_size}${product.portion_unit})\n`);
      fixed++;
    } else {
      skipped++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Migration complete!`);
  console.log(`   Fixed: ${fixed} products`);
  console.log(`   Skipped: ${skipped} products (already correct)`);
  console.log('='.repeat(50));
};

// Run the migration
(async () => {
  try {
    await fixSynValues();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
})();
