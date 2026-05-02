// src/utils/jwt.js
import jwt from 'jsonwebtoken';
import { env } from '../config/environment.js';

/**
 * Signs a JWT with the given payload.
 * @param {object} payload
 * @returns {string} signed token
 */
export const generateToken = (payload) =>
  jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });

/**
 * Verifies and decodes a JWT.
 * @param {string} token
 * @returns {object} decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
export const verifyToken = (token) => jwt.verify(token, env.jwt.secret);