/**
 * User Model - User database operations with AppKit integration
 * @file src/api/features/user/user.model.ts
 *
 * @llm-rule WHEN: Need database layer separation for user feature with multi-tenant support
 * @llm-rule AVOID: Database operations directly in service - use model layer
 * @llm-rule NOTE: Handles all Prisma database operations for User authentication
 */

import { databaseClass } from '@voilajsx/appkit/database';
import { loggerClass } from '@voilajsx/appkit/logger';
import { authClass } from '@voilajsx/appkit/auth';
import type { UserUpdateRequest } from './user.types.js';

const logger = loggerClass.get('user-model');
const auth = authClass.get();

export const model = {
  /**
   * Find user by email (for login)
   */
  async findByEmail(email: string) {
    logger.info('Finding user by email', { email });
    const db = await databaseClass.get();
    return await db.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
  },

  /**
   * Find user by ID
   */
  async findById(id: number) {
    logger.info('Finding user by ID', { id });
    const db = await databaseClass.get();
    return await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        level: true,
        tenantId: true,
        isVerified: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });
  },

  /**
   * Get all users (admin only)
   */
  async findAll(tenantId?: string) {
    logger.info('Finding all users', { tenantId });
    const db = await databaseClass.get();
    const where = tenantId ? { tenantId } : {};

    return await db.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        level: true,
        tenantId: true,
        isVerified: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  /**
   * Create new user with hashed password
   */
  async create(data: {
    name?: string | null;
    email: string;
    phone?: string | null;
    password: string;
    role?: string;
    level?: string;
    tenantId?: string | null;
    isActive?: boolean;
    isVerified?: boolean;
  }) {
    logger.info('Creating new user', { email: data.email, role: data.role, level: data.level });
    const db = await databaseClass.get();

    // Hash password using AppKit auth (compatible with all verification methods)
    const hashedPassword = await auth.hashPassword(data.password);

    return await db.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
        name: data.name?.trim(),
        phone: data.phone?.trim(),
        role: data.role || 'user',
        level: data.level || 'basic',
        tenantId: data.tenantId,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isVerified: data.isVerified !== undefined ? data.isVerified : false
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        level: true,
        tenantId: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
  },

  /**
   * Update user profile
   */
  async update(id: number, data: UserUpdateRequest) {
    logger.info('Updating user', { id, data });
    const db = await databaseClass.get();

    return await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        level: true,
        tenantId: true,
        isVerified: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true
      }
    });
  },

  /**
   * Update user's last login time
   */
  async updateLastLogin(id: number) {
    logger.info('Updating last login', { id });
    const db = await databaseClass.get();

    return await db.user.update({
      where: { id },
      data: { lastLogin: new Date() },
      select: { id: true, lastLogin: true }
    });
  },

  /**
   * Verify user password (for login)
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await auth.comparePassword(plainPassword, hashedPassword);
  },

  /**
   * Update user password
   */
  async updatePassword(id: number, newPassword: string) {
    logger.info('Updating user password', { id });
    const db = await databaseClass.get();

    const hashedPassword = await auth.hashPassword(newPassword);

    return await db.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: { id: true, email: true }
    });
  },

  /**
   * Set password reset token
   */
  async setResetToken(email: string, token: string, expiry: Date) {
    logger.info('Setting reset token', { email });
    const db = await databaseClass.get();

    return await db.user.update({
      where: { email: email.toLowerCase().trim() },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry
      },
      select: { id: true, email: true }
    });
  },

  /**
   * Find user by reset token
   */
  async findByResetToken(token: string) {
    logger.info('Finding user by reset token');
    const db = await databaseClass.get();

    return await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }
      }
    });
  },

  /**
   * Clear reset token after use
   */
  async clearResetToken(id: number) {
    logger.info('Clearing reset token', { id });
    const db = await databaseClass.get();

    return await db.user.update({
      where: { id },
      data: {
        resetToken: null,
        resetTokenExpiry: null
      },
      select: { id: true, email: true }
    });
  },

  /**
   * Delete user (admin only)
   */
  async delete(id: number) {
    logger.info('Deleting user', { id });
    const db = await databaseClass.get();

    return await db.user.delete({
      where: { id }
    });
  }
};