import { Request, Response } from 'express';
import { db } from '../config/database.js';

interface FoodRecord {
  id: string;
  name: string;
  syn_value: number;
  portion_size: number;
  portion_unit: string;
  category: string;
}

export const checkSynValues = async (req: Request, res: Response) => {
  try {
    // Get all products to check their current state
    const stmt = db.prepare(`
      SELECT id, name, syn_value, portion_size, portion_unit, category
      FROM foods
      ORDER BY name
    `);

    const products = stmt.all() as FoodRecord[];

    res.json({
      success: true,
      count: products.length,
      products: products.map(p => ({
        name: p.name,
        synValue: p.syn_value,
        portionSize: p.portion_size,
        portionUnit: p.portion_unit,
        category: p.category,
        needsFix: p.category === 'commercial' && p.portion_size !== 100 && p.syn_value > 0
      }))
    });
  } catch (error) {
    console.error('❌ Check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const fixSynValues = async (req: Request, res: Response) => {
  try {
    console.log('🔧 Starting syn value migration...\n');

    // Get all commercial products (from Open Food Facts)
    // Note: Removed syn_value > 0 check to also fix products with 0 values
    const stmt = db.prepare(`
      SELECT id, name, syn_value, portion_size, portion_unit, category
      FROM foods
      WHERE category = 'commercial'
      AND portion_size != 100
    `);

    const products = stmt.all() as FoodRecord[];

    console.log(`Found ${products.length} products that need fixing\n`);

    if (products.length === 0) {
      return res.json({
        success: true,
        message: 'No products need fixing',
        fixed: 0,
        skipped: 0
      });
    }

    const updateStmt = db.prepare(`
      UPDATE foods
      SET syn_value = ?
      WHERE id = ?
    `);

    let fixed = 0;
    let skipped = 0;
    const fixedProducts: any[] = [];

    products.forEach(product => {
      // Calculate the scaled syn value (from per-100g to per-serving)
      const scaledSynValue = product.syn_value * (product.portion_size / 100);
      const roundedSynValue = Math.round(scaledSynValue * 2) / 2;

      // Only update if the values are different (accounting for rounding)
      if (Math.abs(product.syn_value - scaledSynValue) > 0.01) {
        updateStmt.run(roundedSynValue, product.id);

        fixedProducts.push({
          name: product.name,
          before: product.syn_value,
          after: roundedSynValue,
          portionSize: product.portion_size,
          portionUnit: product.portion_unit
        });

        console.log(`✅ Fixed: ${product.name}`);
        console.log(`   Before: ${product.syn_value} syns (per 100g)`);
        console.log(`   After: ${roundedSynValue} syns (per ${product.portion_size}${product.portion_unit})\n`);
        fixed++;
      } else {
        skipped++;
      }
    });

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Migration complete!`);
    console.log(`   Fixed: ${fixed} products`);
    console.log(`   Skipped: ${skipped} products (already correct)`);
    console.log('='.repeat(50));

    res.json({
      success: true,
      message: 'Migration completed successfully',
      fixed,
      skipped,
      products: fixedProducts
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
