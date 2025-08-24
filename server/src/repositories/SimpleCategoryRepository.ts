import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export class SimpleCategoryRepository {
  async findAll() {
    try {
      const result = await sql('SELECT * FROM expense_categories ORDER BY name');
      return result;
    } catch (error) {
      console.error('SimpleCategoryRepository: Error in findAll:', error);
      throw error;
    }
  }

  async create(data: { name: string }) {
    try {
      const result = await sql(
        'INSERT INTO expense_categories (name) VALUES ($1) RETURNING *',
        [data.name]
      );
      return result[0];
    } catch (error) {
      console.error('SimpleCategoryRepository: Error in create:', error);
      throw error;
    }
  }

  async findById(id: number) {
    try {
      const result = await sql(
        'SELECT * FROM expense_categories WHERE id = $1',
        [id]
      );
      return result[0] || null;
    } catch (error) {
      console.error('SimpleCategoryRepository: Error in findById:', error);
      throw error;
    }
  }

  async update(id: number, data: { name: string }) {
    try {
      const result = await sql(
        'UPDATE expense_categories SET name = $1 WHERE id = $2 RETURNING *',
        [data.name, id]
      );
      return result[0] || null;
    } catch (error) {
      console.error('SimpleCategoryRepository: Error in update:', error);
      throw error;
    }
  }

  async delete(id: number) {
    try {
      const result = await sql(
        'DELETE FROM expense_categories WHERE id = $1 RETURNING id',
        [id]
      );
      return result.length > 0;
    } catch (error) {
      console.error('SimpleCategoryRepository: Error in delete:', error);
      throw error;
    }
  }
}