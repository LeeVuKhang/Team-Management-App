import db from '../utils/db.js';

/**
 * User Model
 * Handles database operations for user authentication and profile management
 * Security: Passwords are never returned in queries
 */

/**
 * Create a new user
 * @param {string} username - User's display name
 * @param {string} email - User's email (unique)
 * @param {string} passwordHash - Bcrypt hashed password
 * @returns {Promise<Object>} Created user object (without password)
 * @throws {Error} If email already exists
 */
export const createUser = async (username, email, passwordHash) => {
  // Insert new user
  const [user] = await db`
    INSERT INTO users (username, email, password_hash)
    VALUES (${username}, ${email}, ${passwordHash})
    RETURNING id, username, email, avatar_url, created_at
  `;

  return user;
};

/**
 * Find user by email (for login)
 * @param {string} email - User's email
 * @returns {Promise<Object|null>} User with password_hash, or null if not found
 */
export const findUserByEmail = async (email) => {
  const [user] = await db`
    SELECT id, username, email, password_hash, avatar_url, created_at
    FROM users
    WHERE email = ${email}
  `;

  return user || null;
};

/**
 * Find user by ID (for token verification)
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object without password
 */
export const findUserById = async (userId) => {
  const [user] = await db`
    SELECT id, username, email, avatar_url, created_at
    FROM users
    WHERE id = ${userId}
  `;

  return user || null;
};

/**
 * Check if email already exists
 * @param {string} email - Email to check
 * @returns {Promise<boolean>} True if email exists
 */
export const emailExists = async (email) => {
  const [result] = await db`
    SELECT 1 FROM users WHERE email = ${email}
  `;

  return !!result;
};
