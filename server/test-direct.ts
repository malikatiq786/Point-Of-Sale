// Test direct database connection
import { db } from './db';
import * as schema from '../shared/schema';

async function testProduct() {
  try {
    console.log('Testing direct product creation...');
    
    const productData = {
      name: "Direct Test Product",
      description: "Testing direct creation",
      price: "19.99",
      stock: 10,
      categoryId: 1,
      brandId: 1,
      unitId: 1,
      barcode: "123456",
      lowStockAlert: 5,
      image: null
    };

    const [result] = await db.insert(schema.products)
      .values(productData)
      .returning();
    
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testProduct();