import express from 'express';
import { db } from '../db';
import * as schema from '../../shared/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Business Profile routes
router.get('/business-profile', async (req: any, res: any) => {
  try {
    const [profile] = await db.select().from(schema.businessProfiles).limit(1);
    
    if (!profile) {
      // Return default profile if none exists
      res.json({
        id: 1,
        businessName: "My Business Store",
        businessType: "retail",
        email: "contact@mybusiness.com",
        phone: "+1-555-0123",
        address: "123 Main Street",
        city: "New York",
        state: "NY",
        country: "United States",
        postalCode: "10001",
        taxId: "12-3456789",
        website: "https://mybusiness.com",
        description: "A modern retail business serving customers with quality products."
      });
    } else {
      res.json(profile);
    }
  } catch (error) {
    console.error('Get business profile error:', error);
    res.status(500).json({ message: 'Failed to fetch business profile' });
  }
});

router.put('/business-profile', async (req: any, res: any) => {
  try {
    const [existingProfile] = await db.select().from(schema.businessProfiles).limit(1);
    
    if (existingProfile) {
      const [updatedProfile] = await db.update(schema.businessProfiles)
        .set(req.body)
        .where(eq(schema.businessProfiles.id, existingProfile.id))
        .returning();
      res.json(updatedProfile);
    } else {
      const [newProfile] = await db.insert(schema.businessProfiles)
        .values(req.body)
        .returning();
      res.json(newProfile);
    }
  } catch (error) {
    console.error('Update business profile error:', error);
    res.status(500).json({ message: 'Failed to update business profile' });
  }
});

// Branches routes
router.get('/branches', async (req: any, res: any) => {
  try {
    const branches = await db.select().from(schema.branches).limit(50);
    res.json(branches);
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ message: 'Failed to fetch branches' });
  }
});

router.post('/branches', async (req: any, res: any) => {
  try {
    const [branch] = await db.insert(schema.branches)
      .values({
        ...req.body,
        businessProfileId: req.body.businessProfileId || 1
      })
      .returning();
    res.status(201).json(branch);
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({ message: 'Failed to create branch' });
  }
});

router.put('/branches/:id', async (req: any, res: any) => {
  try {
    const [branch] = await db.update(schema.branches)
      .set(req.body)
      .where(eq(schema.branches.id, parseInt(req.params.id)))
      .returning();
    res.json(branch);
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({ message: 'Failed to update branch' });
  }
});

router.delete('/branches/:id', async (req: any, res: any) => {
  try {
    await db.delete(schema.branches)
      .where(eq(schema.branches.id, parseInt(req.params.id)));
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ message: 'Failed to delete branch' });
  }
});

// Registers routes
router.get('/registers', async (req: any, res: any) => {
  try {
    const registers = await db.select({
      id: schema.registers.id,
      name: schema.registers.name,
      code: schema.registers.code,
      branchId: schema.registers.branchId,
      branchName: schema.branches.name,
      isActive: schema.registers.isActive,
      openingBalance: schema.registers.openingBalance,
      currentBalance: schema.registers.currentBalance,
      lastOpened: schema.registers.lastOpened,
      lastClosed: schema.registers.lastClosed,
    })
    .from(schema.registers)
    .leftJoin(schema.branches, eq(schema.registers.branchId, schema.branches.id))
    .limit(50);
    
    res.json(registers);
  } catch (error) {
    console.error('Get registers error:', error);
    res.status(500).json({ message: 'Failed to fetch registers' });
  }
});

router.post('/registers', async (req: any, res: any) => {
  try {
    const [register] = await db.insert(schema.registers)
      .values({
        ...req.body,
        currentBalance: req.body.openingBalance || 0
      })
      .returning();
    res.status(201).json(register);
  } catch (error) {
    console.error('Create register error:', error);
    res.status(500).json({ message: 'Failed to create register' });
  }
});

router.put('/registers/:id', async (req: any, res: any) => {
  try {
    const [register] = await db.update(schema.registers)
      .set(req.body)
      .where(eq(schema.registers.id, parseInt(req.params.id)))
      .returning();
    res.json(register);
  } catch (error) {
    console.error('Update register error:', error);
    res.status(500).json({ message: 'Failed to update register' });
  }
});

router.delete('/registers/:id', async (req: any, res: any) => {
  try {
    await db.delete(schema.registers)
      .where(eq(schema.registers.id, parseInt(req.params.id)));
    res.json({ message: 'Register deleted successfully' });
  } catch (error) {
    console.error('Delete register error:', error);
    res.status(500).json({ message: 'Failed to delete register' });
  }
});

export default router;