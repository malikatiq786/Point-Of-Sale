import { TaxRepository, type InsertTax, type SelectTax } from '../repositories/TaxRepository';

export class TaxService {
  private taxRepository: TaxRepository;

  constructor() {
    this.taxRepository = new TaxRepository();
  }

  // Get all taxes ordered by sort order
  async getAllTaxes() {
    try {
      const taxes = await this.taxRepository.findAllOrdered();
      return {
        success: true,
        data: taxes,
      };
    } catch (error) {
      console.error('TaxService: Error getting all taxes:', error);
      return {
        success: false,
        error: 'Failed to fetch taxes',
      };
    }
  }

  // Get only enabled taxes
  async getEnabledTaxes() {
    try {
      const taxes = await this.taxRepository.findAllEnabled();
      return {
        success: true,
        data: taxes,
      };
    } catch (error) {
      console.error('TaxService: Error getting enabled taxes:', error);
      return {
        success: false,
        error: 'Failed to fetch enabled taxes',
      };
    }
  }

  // Get tax by ID
  async getTaxById(id: number) {
    try {
      const tax = await this.taxRepository.findById(id);
      if (!tax) {
        return {
          success: false,
          error: 'Tax not found',
        };
      }

      return {
        success: true,
        data: tax,
      };
    } catch (error) {
      console.error('TaxService: Error getting tax by ID:', error);
      return {
        success: false,
        error: 'Failed to fetch tax',
      };
    }
  }

  // Create new tax
  async createTax(taxData: Omit<InsertTax, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Check if tax name already exists
      const existingTax = await this.taxRepository.findByName(taxData.name);
      if (existingTax) {
        return {
          success: false,
          error: 'Tax with this name already exists',
        };
      }

      // Validate rate
      if (taxData.rate < 0 || taxData.rate > 100) {
        return {
          success: false,
          error: 'Tax rate must be between 0 and 100',
        };
      }

      const tax = await this.taxRepository.create(taxData);
      return {
        success: true,
        data: tax,
        message: 'Tax created successfully',
      };
    } catch (error) {
      console.error('TaxService: Error creating tax:', error);
      return {
        success: false,
        error: 'Failed to create tax',
      };
    }
  }

  // Update existing tax
  async updateTax(id: number, taxData: Partial<Omit<InsertTax, 'id' | 'createdAt' | 'updatedAt'>>) {
    try {
      // Check if tax exists
      const existingTax = await this.taxRepository.findById(id);
      if (!existingTax) {
        return {
          success: false,
          error: 'Tax not found',
        };
      }

      // Check if name is being changed to an existing name
      if (taxData.name && taxData.name !== existingTax.name) {
        const duplicateTax = await this.taxRepository.findByName(taxData.name);
        if (duplicateTax) {
          return {
            success: false,
            error: 'Tax with this name already exists',
          };
        }
      }

      // Validate rate if provided
      if (taxData.rate !== undefined && (taxData.rate < 0 || taxData.rate > 100)) {
        return {
          success: false,
          error: 'Tax rate must be between 0 and 100',
        };
      }

      const updatedTax = await this.taxRepository.update(id, {
        ...taxData,
        updatedAt: new Date(),
      });

      if (!updatedTax) {
        return {
          success: false,
          error: 'Failed to update tax',
        };
      }

      return {
        success: true,
        data: updatedTax,
        message: 'Tax updated successfully',
      };
    } catch (error) {
      console.error('TaxService: Error updating tax:', error);
      return {
        success: false,
        error: 'Failed to update tax',
      };
    }
  }

  // Delete tax
  async deleteTax(id: number) {
    try {
      const existingTax = await this.taxRepository.findById(id);
      if (!existingTax) {
        return {
          success: false,
          error: 'Tax not found',
        };
      }

      const deleted = await this.taxRepository.delete(id);
      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete tax',
        };
      }

      return {
        success: true,
        message: 'Tax deleted successfully',
      };
    } catch (error) {
      console.error('TaxService: Error deleting tax:', error);
      return {
        success: false,
        error: 'Failed to delete tax',
      };
    }
  }

  // Toggle tax enabled status
  async toggleTaxEnabled(id: number) {
    try {
      const updatedTax = await this.taxRepository.toggleEnabled(id);
      if (!updatedTax) {
        return {
          success: false,
          error: 'Tax not found',
        };
      }

      return {
        success: true,
        data: updatedTax,
        message: `Tax ${updatedTax.isEnabled ? 'enabled' : 'disabled'} successfully`,
      };
    } catch (error) {
      console.error('TaxService: Error toggling tax enabled status:', error);
      return {
        success: false,
        error: 'Failed to toggle tax status',
      };
    }
  }

  // Update tax sort orders
  async updateTaxSortOrders(taxUpdates: { id: number; sortOrder: number }[]) {
    try {
      await this.taxRepository.updateSortOrders(taxUpdates);
      return {
        success: true,
        message: 'Tax order updated successfully',
      };
    } catch (error) {
      console.error('TaxService: Error updating tax sort orders:', error);
      return {
        success: false,
        error: 'Failed to update tax order',
      };
    }
  }

  // Calculate total tax amount for a given subtotal
  calculateTotalTax(subtotal: number, taxes: SelectTax[]): { totalTaxAmount: number; taxBreakdown: { id: number; name: string; rate: number; amount: number }[] } {
    const taxBreakdown = taxes
      .filter(tax => tax.isEnabled)
      .map(tax => {
        const amount = (subtotal * Number(tax.rate)) / 100;
        return {
          id: tax.id,
          name: tax.name,
          rate: Number(tax.rate),
          amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
        };
      });

    const totalTaxAmount = taxBreakdown.reduce((sum, tax) => sum + tax.amount, 0);

    return {
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
      taxBreakdown,
    };
  }
}