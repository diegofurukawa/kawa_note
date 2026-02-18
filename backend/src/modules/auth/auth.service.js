import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';

const SALT_ROUNDS = 12;

export const authService = {
  async login(data) {
    const { email, password } = data;

    // Single query to get user with password
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Return generic error for both cases (user not found or password invalid)
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const tokens = generateTokens(user.id, user.tenantId);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        encryptionSalt: user.encryptionSalt,
        createdAt: user.createdAt
      },
      ...tokens
    };
  },

  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true,
        encryptionSalt: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },

  async refreshToken(token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      
      // Validate token type
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      const tokens = generateTokens(decoded.userId, decoded.tenantId);
      return tokens;
    } catch {
      throw new Error('Invalid refresh token');
    }
  },

  async updateEncryptionSalt(userId, encryptionSalt) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { encryptionSalt },
      select: {
        id: true,
        email: true,
        name: true,
        tenantId: true,
        encryptionSalt: true,
        createdAt: true
      }
    });

    return user;
  }
};

function generateTokens(userId, tenantId = null) {
  const accessToken = jwt.sign(
    { userId, tenantId, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId, tenantId, type: 'refresh' },
    env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: env.JWT_EXPIRES_IN
  };
}
