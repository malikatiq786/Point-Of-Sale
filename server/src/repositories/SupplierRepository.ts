import { BaseRepository, eq, like, or } from './BaseRepository';
import { suppliers } from '../../../shared/schema';

export class SupplierRepository extends BaseRepository<typeof suppliers.$inferSelect> {
  constructor() {
    super('suppliers', suppliers);
  }

  // Search suppliers by name, email, or phone
  async searchSuppliers(searchQuery: string) {
    try {
      return await this.findAll(
        or(
          like(suppliers.name, `%${searchQuery}%`),
          like(suppliers.email, `%${searchQuery}%`),
          like(suppliers.phone, `%${searchQuery}%`)
        )
      );
    } catch (error) {
      console.error('Error searching suppliers:', error);
      throw error;
    }
  }

  // Find supplier by email
  async findByEmail(email: string) {
    try {
      const results = await this.findAll(eq(suppliers.email, email), 1);
      return results[0] || null;
    } catch (error) {
      console.error('Error finding supplier by email:', error);
      throw error;
    }
  }

  // Find supplier by phone
  async findByPhone(phone: string) {
    try {
      const results = await this.findAll(eq(suppliers.phone, phone), 1);
      return results[0] || null;
    } catch (error) {
      console.error('Error finding supplier by phone:', error);
      throw error;
    }
  }
}