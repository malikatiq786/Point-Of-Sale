import { BaseRepository } from './BaseRepository';
import { expenseCategories } from '@shared/schema';
import { InsertExpenseCategory, SelectExpenseCategory } from '@shared/schema';
import { eq, isNull, sql } from 'drizzle-orm';

export class ExpenseCategoryRepository extends BaseRepository<typeof expenseCategories, InsertExpenseCategory, SelectExpenseCategory> {
  constructor() {
    super(expenseCategories);
  }

  async findAllWithHierarchy() {
    try {
      console.log('ExpenseCategoryRepository: Finding categories with hierarchy');
      
      // Get all categories with their parent information
      const categories = await this.db
        .select({
          id: expenseCategories.id,
          name: expenseCategories.name,
          description: expenseCategories.description,
          parentId: expenseCategories.parentId,
          isActive: expenseCategories.isActive,
          color: expenseCategories.color,
          createdAt: expenseCategories.createdAt,
          parent: {
            id: sql<number>`parent_cat.id`,
            name: sql<string>`parent_cat.name`,
          }
        })
        .from(expenseCategories)
        .leftJoin(
          sql`${expenseCategories} as parent_cat`,
          eq(expenseCategories.parentId, sql`parent_cat.id`)
        )
        .where(eq(expenseCategories.isActive, true))
        .orderBy(expenseCategories.name);

      // Organize into hierarchy
      const rootCategories = categories.filter(cat => !cat.parentId);
      const subcategories = categories.filter(cat => cat.parentId);

      // Group subcategories by parent
      const subcategoriesByParent = subcategories.reduce((acc, subcat) => {
        const parentId = subcat.parentId!;
        if (!acc[parentId]) acc[parentId] = [];
        acc[parentId].push(subcat);
        return acc;
      }, {} as Record<number, any[]>);

      // Attach subcategories to their parents
      const hierarchicalCategories = rootCategories.map(category => ({
        ...category,
        subcategories: subcategoriesByParent[category.id] || []
      }));

      return hierarchicalCategories;
    } catch (error) {
      console.error('ExpenseCategoryRepository: Error in findAllWithHierarchy:', error);
      throw error;
    }
  }

  async findByName(name: string) {
    try {
      const [category] = await this.db
        .select()
        .from(expenseCategories)
        .where(eq(expenseCategories.name, name))
        .limit(1);

      return category;
    } catch (error) {
      console.error('ExpenseCategoryRepository: Error in findByName:', error);
      throw error;
    }
  }

  async findRootCategories() {
    try {
      return await this.db
        .select()
        .from(expenseCategories)
        .where(
          sql`${expenseCategories.parentId} IS NULL AND ${expenseCategories.isActive} = true`
        )
        .orderBy(expenseCategories.name);
    } catch (error) {
      console.error('ExpenseCategoryRepository: Error in findRootCategories:', error);
      throw error;
    }
  }

  async findSubcategories(parentId: number) {
    try {
      return await this.db
        .select()
        .from(expenseCategories)
        .where(
          sql`${expenseCategories.parentId} = ${parentId} AND ${expenseCategories.isActive} = true`
        )
        .orderBy(expenseCategories.name);
    } catch (error) {
      console.error('ExpenseCategoryRepository: Error in findSubcategories:', error);
      throw error;
    }
  }

  async getCategoryUsageStats() {
    try {
      return await this.db
        .select({
          categoryId: expenseCategories.id,
          categoryName: expenseCategories.name,
          expenseCount: sql<number>`count(expenses.id)`,
          totalAmount: sql<number>`coalesce(sum(expenses.total_amount), 0)`,
        })
        .from(expenseCategories)
        .leftJoin(
          sql`expenses`,
          eq(expenseCategories.id, sql`expenses.category_id`)
        )
        .where(eq(expenseCategories.isActive, true))
        .groupBy(expenseCategories.id, expenseCategories.name)
        .orderBy(sql`count(expenses.id) desc`);
    } catch (error) {
      console.error('ExpenseCategoryRepository: Error in getCategoryUsageStats:', error);
      throw error;
    }
  }
}