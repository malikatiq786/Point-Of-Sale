import { SupplierRepository } from '../repositories/SupplierRepository';

export class SupplierService {
  private supplierRepository: SupplierRepository;

  constructor() {
    this.supplierRepository = new SupplierRepository();
  }

  async getSuppliers() {
    try {
      const suppliers = await this.supplierRepository.findAll();
      return { success: true, data: suppliers };
    } catch (error) {
      console.error('SupplierService: Error getting suppliers:', error);
      return { success: false, error: 'Failed to fetch suppliers' };
    }
  }

  async getSupplierById(id: number) {
    try {
      const supplier = await this.supplierRepository.findById(id);
      if (!supplier) {
        return { success: false, error: 'Supplier not found' };
      }
      return { success: true, data: supplier };
    } catch (error) {
      console.error('SupplierService: Error getting supplier by id:', error);
      return { success: false, error: 'Failed to fetch supplier' };
    }
  }

  async createSupplier(supplierData: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  }) {
    try {
      if (!supplierData.name) {
        return { success: false, error: 'Supplier name is required' };
      }

      // Check if supplier with email already exists
      if (supplierData.email) {
        const existingSupplier = await this.supplierRepository.findByEmail(supplierData.email);
        if (existingSupplier) {
          return { success: false, error: 'Supplier with this email already exists' };
        }
      }

      // Check if supplier with phone already exists
      if (supplierData.phone) {
        const existingSupplier = await this.supplierRepository.findByPhone(supplierData.phone);
        if (existingSupplier) {
          return { success: false, error: 'Supplier with this phone number already exists' };
        }
      }

      const supplier = await this.supplierRepository.create(supplierData);
      return { success: true, data: supplier };
    } catch (error) {
      console.error('SupplierService: Error creating supplier:', error);
      return { success: false, error: 'Failed to create supplier' };
    }
  }

  async updateSupplier(id: number, supplierData: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  }) {
    try {
      const supplier = await this.supplierRepository.update(id, supplierData);
      if (!supplier) {
        return { success: false, error: 'Supplier not found' };
      }
      return { success: true, data: supplier };
    } catch (error) {
      console.error('SupplierService: Error updating supplier:', error);
      return { success: false, error: 'Failed to update supplier' };
    }
  }

  async deleteSupplier(id: number) {
    try {
      const success = await this.supplierRepository.delete(id);
      if (!success) {
        return { success: false, error: 'Supplier not found' };
      }
      return { success: true };
    } catch (error) {
      console.error('SupplierService: Error deleting supplier:', error);
      return { success: false, error: 'Failed to delete supplier' };
    }
  }

  async searchSuppliers(query: string) {
    try {
      const suppliers = await this.supplierRepository.searchSuppliers(query);
      return { success: true, data: suppliers };
    } catch (error) {
      console.error('SupplierService: Error searching suppliers:', error);
      return { success: false, error: 'Failed to search suppliers' };
    }
  }

  async bulkDeleteSuppliers(supplierIds: number[]) {
    try {
      console.log(`Attempting to delete ${supplierIds.length} suppliers:`, supplierIds);
      
      let deletedCount = 0;
      const failedIds: number[] = [];

      for (const supplierId of supplierIds) {
        console.log(`Deleting supplier ${supplierId} (type: ${typeof supplierId})`);
        try {
          const success = await this.supplierRepository.delete(supplierId);
          if (success) {
            console.log(`Successfully deleted supplier ${supplierId}`);
            deletedCount++;
          } else {
            console.log(`Failed to delete supplier ${supplierId} - not found`);
            failedIds.push(supplierId);
          }
        } catch (error) {
          console.error(`Error deleting supplier ${supplierId}:`, error);
          failedIds.push(supplierId);
        }
      }

      console.log(`Successfully deleted ${deletedCount} out of ${supplierIds.length} suppliers`);
      
      if (failedIds.length > 0) {
        console.log('Failed to delete suppliers:', failedIds);
        return { 
          success: false, 
          error: `Failed to delete suppliers with IDs: ${failedIds.join(', ')}`,
          deletedCount 
        };
      }

      return { success: true, deletedCount };
    } catch (error) {
      console.error('SupplierService: Error in bulk delete:', error);
      return { success: false, error: 'Failed to perform bulk delete operation' };
    }
  }
}