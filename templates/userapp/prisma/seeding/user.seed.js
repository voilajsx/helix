/**
 * User Feature Seed Data - Creates all 9 role accounts for testing
 * @file prisma/seeding/user.seed.js
 *
 * Requires DEFAULT_USER_PASSWORD environment variable to be set.
 * This ensures no hardcoded passwords in the repository.
 *
 * Run this seed file individually:
 * node prisma/seeding/user.seed.js
 *
 * Or include in your main seed file:
 * require('./seeding/user.seed.js');
 */

import dotenv from 'dotenv';
import { databaseClass } from '@voilajsx/appkit/database';
import { authClass } from '@voilajsx/appkit/auth';

// Load environment variables
dotenv.config();

// AppKit modules will be initialized in the function

export async function seedUsers() {
  console.log('🌱 Seeding user data with all 9 role accounts...');

  try {
    // Initialize AppKit database
    const db = await databaseClass.get();
    const auth = authClass.get();

    // Check if user data already exists
    const existingCount = await db.user.count();

    if (existingCount > 0) {
      console.log(`⚠️  User table already has ${existingCount} records. Skipping seed...`);
      return { skipped: true, count: existingCount };
    }

    // Hash default password for all accounts (from environment)
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD;
    if (!defaultPassword) {
      throw new Error('DEFAULT_USER_PASSWORD environment variable is required for seeding');
    }
    const hashedPassword = await auth.hashPassword(defaultPassword);

    // Create all 9 role accounts based on AppKit's role hierarchy
    const userData = [
      // User roles (3 levels)
      {
        email: 'user.basic@helix-basicapp.com',
        password: hashedPassword,
        name: 'Basic User',
        phone: '+1-555-0001',
        role: 'user',
        level: 'basic',
        isVerified: true,
        isActive: true,
      },
      {
        email: 'user.pro@helix-basicapp.com',
        password: hashedPassword,
        name: 'Pro User',
        phone: '+1-555-0002',
        role: 'user',
        level: 'pro',
        isVerified: true,
        isActive: true,
      },
      {
        email: 'user.max@helix-basicapp.com',
        password: hashedPassword,
        name: 'Max User',
        phone: '+1-555-0003',
        role: 'user',
        level: 'max',
        isVerified: true,
        isActive: true,
      },

      // Moderator roles (3 levels - matching AppKit hierarchy)
      {
        email: 'moderator.review@helix-basicapp.com',
        password: hashedPassword,
        name: 'Review Moderator',
        phone: '+1-555-0004',
        role: 'moderator',
        level: 'review',
        isVerified: true,
        isActive: true,
      },
      {
        email: 'moderator.approve@helix-basicapp.com',
        password: hashedPassword,
        name: 'Approve Moderator',
        phone: '+1-555-0005',
        role: 'moderator',
        level: 'approve',
        isVerified: true,
        isActive: true,
      },
      {
        email: 'moderator.manage@helix-basicapp.com',
        password: hashedPassword,
        name: 'Manage Moderator',
        phone: '+1-555-0006',
        role: 'moderator',
        level: 'manage',
        isVerified: true,
        isActive: true,
      },

      // Admin roles (3 levels)
      {
        email: 'admin.tenant@helix-basicapp.com',
        password: hashedPassword,
        name: 'Tenant Admin',
        phone: '+1-555-0007',
        role: 'admin',
        level: 'tenant',
        isVerified: true,
        isActive: true,
      },
      {
        email: 'admin.org@helix-basicapp.com',
        password: hashedPassword,
        name: 'Organization Admin',
        phone: '+1-555-0008',
        role: 'admin',
        level: 'org',
        isVerified: true,
        isActive: true,
      },
      {
        email: 'admin.system@helix-basicapp.com',
        password: hashedPassword,
        name: 'System Admin',
        phone: '+1-555-0009',
        role: 'admin',
        level: 'system',
        isVerified: true,
        isActive: true,
      },
    ];

    const result = await db.user.createMany({
      data: userData
    });

    console.log(`✅ Successfully seeded ${result.count} user accounts with all 9 roles`);
    console.log('📋 Test accounts created:');
    console.log(`   Default password for all accounts: ${defaultPassword}`);
    console.log(`
👤 USER ACCOUNTS:
   • user.basic@helix-basicapp.com (role: user.basic)
   • user.pro@helix-basicapp.com (role: user.pro)
   • user.max@helix-basicapp.com (role: user.max)

🛡️ MODERATOR ACCOUNTS:
   • moderator.review@helix-basicapp.com (role: moderator.review)
   • moderator.approve@helix-basicapp.com (role: moderator.approve)
   • moderator.manage@helix-basicapp.com (role: moderator.manage)

🔑 ADMIN ACCOUNTS:
   • admin.tenant@helix-basicapp.com (role: admin.tenant)
   • admin.org@helix-basicapp.com (role: admin.org)
   • admin.system@helix-basicapp.com (role: admin.system)`);

    return { seeded: true, count: result.count };

  } catch (error) {
    console.error(`❌ Error seeding user data:`, error);
    throw error;
  }
}

// Run directly if this file is executed
if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers()
    .then((result) => {
      console.log('User seeding completed:', result);
    })
    .catch((error) => {
      console.error('User seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      // AppKit handles database disconnection
    });
}