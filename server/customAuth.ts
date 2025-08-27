import bcrypt from 'bcryptjs';
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { pool } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";

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
    // Find user by email
    const userResults = await db.select().from(users).where(eq(users.email, email)).limit(1);
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

// Utility functions for password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};