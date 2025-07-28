import { BaseRepository, eq, like, or } from './BaseRepository';
import { sql } from 'drizzle-orm';
import { users, roles, permissions, rolePermissions } from '../../../shared/schema';
import { db } from './BaseRepository';

export class UserRepository extends BaseRepository<typeof users.$inferSelect> {
  constructor() {
    super('users', users);
  }

  // Find users with their roles
  async findWithRoles(search?: string, roleId?: number) {
    try {
      let query = db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        role: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id));

      if (search) {
        query = query.where(
          or(
            like(users.name, `%${search}%`),
            like(users.email, `%${search}%`),
            like(users.firstName, `%${search}%`),
            like(users.lastName, `%${search}%`)
          )
        );
      }

      if (roleId) {
        query = query.where(eq(users.roleId, roleId));
      }

      return await query.orderBy(users.createdAt);
    } catch (error) {
      console.error('Error finding users with roles:', error);
      throw error;
    }
  }

  // Find user by ID with role
  async findByIdWithRole(userId: string) {
    try {
      const results = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        roleId: users.roleId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        role: {
          id: roles.id,
          name: roles.name,
        },
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId))
      .limit(1);

      return results[0] || null;
    } catch (error) {
      console.error('Error finding user by ID with role:', error);
      throw error;
    }
  }

  // Find user by email
  async findByEmail(email: string) {
    try {
      const results = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return results[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Get all roles
  async findAllRoles() {
    try {
      return await db.select()
        .from(roles)
        .orderBy(roles.name);
    } catch (error) {
      console.error('Error finding all roles:', error);
      throw error;
    }
  }

  // Get all permissions
  async findAllPermissions() {
    try {
      return await db.select()
        .from(permissions)
        .orderBy(permissions.name);
    } catch (error) {
      console.error('Error finding all permissions:', error);
      throw error;
    }
  }

  // Get user permissions through role
  async findUserPermissions(userId: string) {
    try {
      const results = await db.select({
        id: permissions.id,
        name: permissions.name,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(users.id, userId));

      return results;
    } catch (error) {
      console.error('Error finding user permissions:', error);
      throw error;
    }
  }

  // Find role by ID
  async findRoleById(roleId: number) {
    try {
      const results = await db.select()
        .from(roles)
        .where(eq(roles.id, roleId))
        .limit(1);

      return results[0] || null;
    } catch (error) {
      console.error('Error finding role by ID:', error);
      throw error;
    }
  }

  // Count users by role
  async countUsersByRole(roleId: number) {
    try {
      const results = await db.select({ 
        count: sql`count(*)::text` 
      })
      .from(users)
      .where(eq(users.roleId, roleId));

      return parseInt(results[0]?.count || '0');
    } catch (error) {
      console.error('Error counting users by role:', error);
      throw error;
    }
  }

  // Create user with UUID
  async create(userData: any) {
    try {
      const results = await db.insert(users)
        .values({
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return results[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Get all roles (alias for compatibility)
  async getAllRoles() {
    return this.findAllRoles();
  }

  // Get all permissions (alias for compatibility)
  async getAllPermissions() {
    return this.findAllPermissions();
  }

  // Get user permissions (alias for compatibility)
  async getUserPermissions(userId: string) {
    return this.findUserPermissions(userId);
  }
}