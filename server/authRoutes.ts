import { Router, Request, Response } from 'express';
import passport from 'passport';
import { hashPassword, getCurrentUserPermissions } from './customAuth';
import { db } from './db';
import { users, roles } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  name: z.string().optional(),
});

// Register route
router.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, validatedData.email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Create user
    const newUser = await db.insert(users).values({
      email: validatedData.email,
      password: hashedPassword,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      name: validatedData.name || `${validatedData.firstName} ${validatedData.lastName}`,
    }).returning();

    // Auto-login after registration
    req.login({
      id: newUser[0].id,
      email: newUser[0].email,
      name: newUser[0].name,
      firstName: newUser[0].firstName,
      lastName: newUser[0].lastName,
    }, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Registration successful but login failed' });
      }
      res.status(201).json({ 
        message: 'User registered successfully',
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          name: newUser[0].name,
          firstName: newUser[0].firstName,
          lastName: newUser[0].lastName,
        }
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors
      });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login route
router.post('/api/auth/login', (req: Request, res: Response, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Internal server error' });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Authentication failed' });
      }
      
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed' });
        }
        
        res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role || 'user',
          }
        });
      });
    })(req, res, next);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors
      });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout route
router.post('/api/auth/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Session destruction failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logout successful' });
    });
  });
});

// Get current user
router.get('/api/auth/user', async (req: Request, res: Response) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    try {
      // Get user with role information
      const userId = (req.user as any).id;
      const userWithRole = await db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        roleName: roles.name,
      }).from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(eq(users.id, userId))
        .limit(1);

      if (userWithRole[0]) {
        // Get user permissions
        const userPermissions = await getCurrentUserPermissions(userId);
        
        res.json({
          user: {
            ...userWithRole[0],
            role: userWithRole[0].roleName || 'user',
            permissions: userPermissions,
          }
        });
      } else {
        res.status(401).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error('Error fetching user with role:', error);
      res.status(500).json({ message: 'Error fetching user information' });
    }
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

export default router;