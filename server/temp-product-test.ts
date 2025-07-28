// Temporary standalone product creation test to debug the exact issue
import storage from './storage';
import * as schema from '../shared/schema';

const testProductCreation = async () => {
  try {
    console.log('Testing direct product creation...');
    
    const testData = {
      name: "Test Product API",
      description: "Testing API creation",
      barcode: "123456789",
      categoryId: 1,
      brandId: 2,
      unitId: 1,
      price: "999.99",
      stock: 50,
      lowStockAlert: 10,
      image: null
    };

    console.log('Test data:', testData);
    
    const result = await storage.db.insert(schema.products)
      .values(testData)
      .returning();
      
    console.log('Direct insert result:', result);
    return result[0];
  } catch (error) {
    console.error('Direct insert error:', error);
    throw error;
  }
};

testProductCreation().then(result => {
  console.log('Success:', result);
  process.exit(0);
}).catch(error => {
  console.error('Failed:', error);
  process.exit(1);
});