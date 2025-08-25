import { BaseRepository, eq, like, or } from './BaseRepository';
import { customers } from '../../../shared/schema';

type CustomerInsert = typeof customers.$inferInsert;
type CustomerSelect = typeof customers.$inferSelect;

export class CustomerRepository extends BaseRepository<typeof customers, CustomerInsert, CustomerSelect> {
  constructor() {
    super(customers);
  }

  // Search customers by name, email, or phone
  async searchCustomers(searchQuery: string) {
    try {
      return await this.findAll(
        or(
          like(customers.name, `%${searchQuery}%`),
          like(customers.email, `%${searchQuery}%`),
          like(customers.phone, `%${searchQuery}%`)
        )
      );
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  // Find customer by email
  async findByEmail(email: string) {
    try {
      const results = await this.findAll(eq(customers.email, email), 1);
      return results[0] || null;
    } catch (error) {
      console.error('Error finding customer by email:', error);
      throw error;
    }
  }

  // Find customer by phone
  async findByPhone(phone: string) {
    try {
      const results = await this.findAll(eq(customers.phone, phone), 1);
      return results[0] || null;
    } catch (error) {
      console.error('Error finding customer by phone:', error);
      throw error;
    }
  }
}