import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';
import { AuthenticatedRequest } from '../types';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // Get all users with roles
  getUsers = async (req: Request, res: Response) => {
    try {
      const { search, roleId } = req.query;
      
      const result = await this.userService.getUsers(
        search as string,
        roleId ? parseInt(roleId as string) : undefined
      );

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('UserController: Error in getUsers:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get user by ID
  getUserById = async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      
      const result = await this.userService.getUserById(userId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        const status = result.error === 'User not found' 
          ? HTTP_STATUS.NOT_FOUND 
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('UserController: Error in getUserById:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Create new user
  createUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await this.userService.createUser(req.body);

      if (result.success) {
        res.status(HTTP_STATUS.CREATED).json({
          message: SUCCESS_MESSAGES.CREATED,
          data: result.data
        });
      } else {
        const status = result.error?.includes('Validation failed') 
          ? HTTP_STATUS.BAD_REQUEST 
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('UserController: Error in createUser:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Update user
  updateUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.id;
      const userData = { ...req.body, id: userId };
      
      const result = await this.userService.updateUser(userData);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: SUCCESS_MESSAGES.UPDATED,
          data: result.data
        });
      } else {
        const status = result.error === 'User not found' 
          ? HTTP_STATUS.NOT_FOUND 
          : result.error?.includes('Validation failed')
          ? HTTP_STATUS.BAD_REQUEST
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('UserController: Error in updateUser:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Delete user
  deleteUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.id;
      
      const result = await this.userService.deleteUser(userId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: SUCCESS_MESSAGES.DELETED
        });
      } else {
        const status = result.error === 'User not found' 
          ? HTTP_STATUS.NOT_FOUND 
          : HTTP_STATUS.FORBIDDEN;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('UserController: Error in deleteUser:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get all roles
  getRoles = async (req: Request, res: Response) => {
    try {
      const result = await this.userService.getRoles();

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('UserController: Error in getRoles:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get all permissions
  getPermissions = async (req: Request, res: Response) => {
    try {
      const result = await this.userService.getPermissions();

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('UserController: Error in getPermissions:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get user permissions
  getUserPermissions = async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      
      const result = await this.userService.getUserPermissions(userId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('UserController: Error in getUserPermissions:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Update user role
  updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.id;
      const { roleId } = req.body;
      
      const result = await this.userService.updateUserRole(userId, roleId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: 'User role updated successfully',
          data: result.data
        });
      } else {
        const status = result.error === 'User not found' || result.error === 'Role not found'
          ? HTTP_STATUS.NOT_FOUND 
          : HTTP_STATUS.FORBIDDEN;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('UserController: Error in updateUserRole:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get all roles
  getAllRoles = async (req: Request, res: Response) => {
    try {
      const result = await this.userService.getAllRoles();

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('UserController: Error in getAllRoles:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get all permissions
  getAllPermissions = async (req: Request, res: Response) => {
    try {
      const result = await this.userService.getAllPermissions();

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('UserController: Error in getAllPermissions:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Get user permissions
  getUserPermissions = async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const result = await this.userService.getUserPermissions(userId);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json(result.data);
      } else {
        const status = result.error === 'User not found' 
          ? HTTP_STATUS.NOT_FOUND 
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('UserController: Error in getUserPermissions:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };

  // Update user permissions
  updateUserPermissions = async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const { permissionIds } = req.body;

      const result = await this.userService.updateUserPermissions(userId, permissionIds);

      if (result.success) {
        res.status(HTTP_STATUS.OK).json({
          message: SUCCESS_MESSAGES.UPDATED,
          data: result.data
        });
      } else {
        const status = result.error === 'User not found' 
          ? HTTP_STATUS.NOT_FOUND 
          : HTTP_STATUS.INTERNAL_SERVER_ERROR;
        
        res.status(status).json({
          message: result.error || ERROR_MESSAGES.INTERNAL_ERROR
        });
      }
    } catch (error) {
      console.error('UserController: Error in updateUserPermissions:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: ERROR_MESSAGES.INTERNAL_ERROR
      });
    }
  };
}