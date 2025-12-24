import bcrypt from 'bcryptjs';
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { pool } from "./db";
import { users, roles, permissions, rolePermissions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";

// Cache for user permissions (in-memory, keyed by user ID)
const permissionCache = new Map<string, { permissions: string[], expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get user permissions from database
async function getUserPermissions(userId: string): Promise<string[]> {
  // Check cache first
  const cached = permissionCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.permissions;
  }

  try {
    // Get user's role
    const userResult = await db.select({ roleId: users.roleId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!userResult[0]?.roleId) {
      return [];
    }

    // Get role's permissions
    const permissionResults = await db.select({ name: permissions.name })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, userResult[0].roleId));

    const userPermissions = permissionResults.map(p => p.name);

    // Cache the result
    permissionCache.set(userId, {
      permissions: userPermissions,
      expiresAt: Date.now() + CACHE_TTL
    });

    return userPermissions;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
}

// Clear permission cache for a user
export function clearPermissionCache(userId?: string) {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
}

interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool: pool,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'development-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

// Configure passport local strategy
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email: string, password: string, done) => {
  try {
    // Find user by email with role information
    const userResults = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      password: users.password,
      roleName: roles.name,
    }).from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.email, email))
      .limit(1);
    
    const user = userResults[0];

    if (!user) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    if (!user.password) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return done(null, false, { message: 'Invalid email or password' });
    }

    return done(null, {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      profileImageUrl: user.profileImageUrl,
      role: user.roleName || 'user',
    });
  } catch (error) {
    return done(error);
  }
}));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const userResults = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const user = userResults[0];
    
    if (user) {
      done(null, {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      });
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error);
  }
});

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());
}

// Authentication middleware
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};

// Permission checking middleware factory
export const requirePermission = (...requiredPermissions: string[]): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First check authentication
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = req.user as any;
    if (!user || !user.id) {
      return res.status(401).json({ message: "User not found" });
    }

    // Super Admin bypasses all permission checks
    if (user.role === 'Super Admin') {
      return next();
    }

    // Get user permissions
    const userPermissions = await getUserPermissions(user.id);

    // Check if user has at least one of the required permissions
    const hasPermission = requiredPermissions.some(perm => 
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      return res.status(403).json({ 
        message: "Access denied. You don't have permission to perform this action.",
        required: requiredPermissions,
        // Don't expose user's permissions in response for security
      });
    }

    next();
  };
};

// Get current user's permissions (for API response)
export async function getCurrentUserPermissions(userId: string): Promise<string[]> {
  return getUserPermissions(userId);
}

// Utility functions for password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};