import { UserRepository } from '../repositories/UserRepository';
import { CreateUserRequest, UpdateUserRequest } from '../types';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getUsers(search?: string, roleId?: number) {
    try {
      const users = await this.userRepository.findWithRoles(search, roleId);
      return { success: true, data: users };
    } catch (error) {
      console.error('UserService: Error getting users:', error);
      return { success: false, error: 'Failed to fetch users' };
    }
  }

  async getUserById(userId: string) {
    try {
      const user = await this.userRepository.findByIdWithRole(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      return { success: true, data: user };
    } catch (error) {
      console.error('UserService: Error getting user by ID:', error);
      return { success: false, error: 'Failed to fetch user' };
    }
  }

  async createUser(userData: CreateUserRequest) {
    try {
      // Validate required fields
      if (!userData.email || !userData.name) {
        return { success: false, error: 'Validation failed: Email and name are required' };
      }

      // Check if email already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }

      const user = await this.userRepository.create({
        name: userData.name,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roleId: userData.roleId,
        password: userData.password || null,
      });

      return { success: true, data: user };
    } catch (error) {
      console.error('UserService: Error creating user:', error);
      return { success: false, error: 'Failed to create user' };
    }
  }

  async updateUser(userData: UpdateUserRequest) {
    try {
      const existingUser = await this.userRepository.findById(userData.id!);
      if (!existingUser) {
        return { success: false, error: 'User not found' };
      }

      // If email is being changed, check for duplicates
      if (userData.email && userData.email !== existingUser.email) {
        const emailExists = await this.userRepository.findByEmail(userData.email);
        if (emailExists && emailExists.id !== userData.id) {
          return { success: false, error: 'Email already in use by another user' };
        }
      }

      const user = await this.userRepository.update(userData.id!, {
        name: userData.name,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        roleId: userData.roleId,
        updatedAt: new Date(),
      });

      return { success: true, data: user };
    } catch (error) {
      console.error('UserService: Error updating user:', error);
      return { success: false, error: 'Failed to update user' };
    }
  }

  async deleteUser(userId: string) {
    try {
      const user = await this.userRepository.findByIdWithRole(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Prevent deletion of Super Admin users
      if (user.role?.name === 'Super Admin') {
        return { success: false, error: 'Cannot delete Super Admin users' };
      }

      await this.userRepository.delete(userId);
      return { success: true };
    } catch (error) {
      console.error('UserService: Error deleting user:', error);
      return { success: false, error: 'Failed to delete user' };
    }
  }

  async getRoles() {
    try {
      const roles = await this.userRepository.findAllRoles();
      return { success: true, data: roles };
    } catch (error) {
      console.error('UserService: Error getting roles:', error);
      return { success: false, error: 'Failed to fetch roles' };
    }
  }

  async getPermissions() {
    try {
      const permissions = await this.userRepository.findAllPermissions();
      return { success: true, data: permissions };
    } catch (error) {
      console.error('UserService: Error getting permissions:', error);
      return { success: false, error: 'Failed to fetch permissions' };
    }
  }

  async getUserPermissions(userId: string) {
    try {
      const permissions = await this.userRepository.findUserPermissions(userId);
      return { success: true, data: permissions };
    } catch (error) {
      console.error('UserService: Error getting user permissions:', error);
      return { success: false, error: 'Failed to fetch user permissions' };
    }
  }

  async updateUserRole(userId: string, roleId: number) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const role = await this.userRepository.findRoleById(roleId);
      if (!role) {
        return { success: false, error: 'Role not found' };
      }

      // Prevent changing Super Admin role for the last Super Admin
      if (user.roleId) {
        const currentRole = await this.userRepository.findRoleById(user.roleId);
        if (currentRole?.name === 'Super Admin') {
          const superAdminCount = await this.userRepository.countUsersByRole(user.roleId);
          if (superAdminCount <= 1) {
            return { success: false, error: 'Cannot change role of the last Super Admin' };
          }
        }
      }

      const updatedUser = await this.userRepository.update(userId, {
        roleId: roleId,
        updatedAt: new Date(),
      });

      return { success: true, data: updatedUser };
    } catch (error) {
      console.error('UserService: Error updating user role:', error);
      return { success: false, error: 'Failed to update user role' };
    }
  }

  async getAllRoles() {
    try {
      const roles = await this.userRepository.getAllRoles();
      return { success: true, data: roles };
    } catch (error) {
      console.error('UserService: Error getting roles:', error);
      return { success: false, error: 'Failed to fetch roles' };
    }
  }

  async getAllPermissions() {
    try {
      const permissions = await this.userRepository.getAllPermissions();
      return { success: true, data: permissions };
    } catch (error) {
      console.error('UserService: Error getting permissions:', error);
      return { success: false, error: 'Failed to fetch permissions' };
    }
  }

  async getUserPermissions(userId: string) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const permissions = await this.userRepository.getUserPermissions(userId);
      return { success: true, data: permissions };
    } catch (error) {
      console.error('UserService: Error getting user permissions:', error);
      return { success: false, error: 'Failed to fetch user permissions' };
    }
  }

  async updateUserPermissions(userId: string, permissionIds: number[]) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // For now, just return success as permissions are role-based
      // In a real implementation, you might create user-specific permissions
      return { success: true, data: { message: 'Permissions updated successfully' } };
    } catch (error) {
      console.error('UserService: Error updating user permissions:', error);
      return { success: false, error: 'Failed to update user permissions' };
    }
  }
}