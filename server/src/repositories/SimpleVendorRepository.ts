import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export class SimpleVendorRepository {
  async findAll() {
    try {
      const result = await sql('SELECT * FROM expense_vendors ORDER BY name');
      return result;
    } catch (error) {
      console.error('SimpleVendorRepository: Error in findAll:', error);
      throw error;
    }
  }

  async create(data: { name: string; email?: string; phone?: string }) {
    try {
      const result = await sql(
        'INSERT INTO expense_vendors (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
        [data.name, data.email || null, data.phone || null]
      );
      return result[0];
    } catch (error) {
      console.error('SimpleVendorRepository: Error in create:', error);
      throw error;
    }
  }

  async findById(id: number) {
    try {
      const result = await sql(
        'SELECT * FROM expense_vendors WHERE id = $1',
        [id]
      );
      return result[0] || null;
    } catch (error) {
      console.error('SimpleVendorRepository: Error in findById:', error);
      throw error;
    }
  }

  async update(id: number, data: { name?: string; email?: string; phone?: string }) {
    try {
      const result = await sql(
        'UPDATE expense_vendors SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone) WHERE id = $4 RETURNING *',
        [data.name, data.email, data.phone, id]
      );
      return result[0] || null;
    } catch (error) {
      console.error('SimpleVendorRepository: Error in update:', error);
      throw error;
    }
  }

  async delete(id: number) {
    try {
      const result = await sql(
        'DELETE FROM expense_vendors WHERE id = $1 RETURNING id',
        [id]
      );
      return result.length > 0;
    } catch (error) {
      console.error('SimpleVendorRepository: Error in delete:', error);
      throw error;
    }
  }
}