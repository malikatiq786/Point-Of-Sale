import { CustomerRepository } from '../repositories/CustomerRepository';

export class CustomerService {
  private customerRepository: CustomerRepository;

  constructor() {
    this.customerRepository = new CustomerRepository();
  }

  async getCustomers() {
    try {
      const customers = await this.customerRepository.findAll();
      return { success: true, data: customers };
    } catch (error) {
      console.error('CustomerService: Error getting customers:', error);
      return { success: false, error: 'Failed to fetch customers' };
    }
  }

  async getCustomerById(id: number) {
    try {
      const customer = await this.customerRepository.findById(id);
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }
      return { success: true, data: customer };
    } catch (error) {
      console.error('CustomerService: Error getting customer by id:', error);
      return { success: false, error: 'Failed to fetch customer' };
    }
  }

  async createCustomer(customerData: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  }) {
    try {
      if (!customerData.name) {
        return { success: false, error: 'Customer name is required' };
      }

      // Check if customer with email already exists
      if (customerData.email) {
        const existingCustomer = await this.customerRepository.findByEmail(customerData.email);
        if (existingCustomer) {
          return { success: false, error: 'Customer with this email already exists' };
        }
      }

      // Check if customer with phone already exists
      if (customerData.phone) {
        const existingCustomer = await this.customerRepository.findByPhone(customerData.phone);
        if (existingCustomer) {
          return { success: false, error: 'Customer with this phone number already exists' };
        }
      }

      const customer = await this.customerRepository.create(customerData);
      return { success: true, data: customer };
    } catch (error) {
      console.error('CustomerService: Error creating customer:', error);
      return { success: false, error: 'Failed to create customer' };
    }
  }

  async updateCustomer(id: number, customerData: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  }) {
    try {
      const customer = await this.customerRepository.update(id, customerData);
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }
      return { success: true, data: customer };
    } catch (error) {
      console.error('CustomerService: Error updating customer:', error);
      return { success: false, error: 'Failed to update customer' };
    }
  }

  async deleteCustomer(id: number) {
    try {
      const success = await this.customerRepository.delete(id);
      if (!success) {
        return { success: false, error: 'Customer not found' };
      }
      return { success: true };
    } catch (error) {
      console.error('CustomerService: Error deleting customer:', error);
      return { success: false, error: 'Failed to delete customer' };
    }
  }

  async searchCustomers(query: string) {
    try {
      const customers = await this.customerRepository.searchCustomers(query);
      return { success: true, data: customers };
    } catch (error) {
      console.error('CustomerService: Error searching customers:', error);
      return { success: false, error: 'Failed to search customers' };
    }
  }
}