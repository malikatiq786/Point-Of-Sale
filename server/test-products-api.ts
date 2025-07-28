// Test products API directly
import { db } from './db';
import * as schema from '../shared/schema';
import { eq } from 'drizzle-orm';

async function testProductsAPI() {
  try {
    console.log('Testing products API...');
    
    const products = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        description: schema.products.description,
        price: schema.products.price,
        stock: schema.products.stock,
        barcode: schema.products.barcode,
        category: {
          id: schema.categories.id,
          name: schema.categories.name,
        },
        brand: {
          id: schema.brands.id,
          name: schema.brands.name,
        },
      })
      .from(schema.products)
      .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .leftJoin(schema.brands, eq(schema.products.brandId, schema.brands.id))
      .limit(5);
    
    console.log('Products found:', products);
  } catch (error) {
    console.error('Error:', error);
  }
}

testProductsAPI();