import { authService } from './auth.service.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import { loginSchema, refreshTokenSchema, encryptionSaltSchema } from './auth.schema.js';

export const authController = {
  async login(request, reply) {
    try {
      const data = loginSchema.parse(request.body);
      const result = await authService.login(data);
      return reply.send(successResponse(result, 'Login successful'));
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        return reply.status(401).send(errorResponse('Invalid credentials', 'INVALID_CREDENTIALS', 401));
      }
      throw error;
    }
  },

  async me(request, reply) {
    const user = await authService.getMe(request.user.id);
    return reply.send(successResponse(user));
  },

  async logout(request, reply) {
    // In a more complex implementation, we would invalidate the token
    // For now, we just return success and let the client remove the token
    return reply.send(successResponse(null, 'Logout successful'));
  },

  async refresh(request, reply) {
    try {
      const data = refreshTokenSchema.parse(request.body);
      const tokens = await authService.refreshToken(data.refreshToken);
      return reply.send(successResponse(tokens, 'Token refreshed successfully'));
    } catch (error) {
      if (error.message === 'Invalid refresh token') {
        return reply.status(401).send(errorResponse('Invalid refresh token', 'INVALID_TOKEN', 401));
      }
      throw error;
    }
  },

  async updateEncryptionSalt(request, reply) {
    try {
      const data = encryptionSaltSchema.parse(request.body);
      const user = await authService.updateEncryptionSalt(request.user.id, data.encryptionSalt);
      return reply.send(successResponse(user, 'Encryption salt updated successfully'));
    } catch (error) {
      throw error;
    }
  }
};
