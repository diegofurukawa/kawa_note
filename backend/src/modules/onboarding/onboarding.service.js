import bcrypt from 'bcrypt';
import { prisma } from '../../config/database.js';
import { updateUserCredentialsSchema, selectPlanSchema } from './onboarding.schema.js';

/**
 * Onboarding Service
 * Handles business logic for onboarding flow
 */
export const onboardingService = {
  /**
   * Update user credentials (STEP 2)
   * @param {string} userId - User ID
   * @param {Object} data - Credentials data
   * @returns {Promise<Object>} Updated tenant
   */
  async updateUserCredentials(userId, data) {
    // Validate input
    const validatedData = updateUserCredentialsSchema.parse(data);

    // Get user with tenant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true }
    });

    if (!user) {
      const error = new Error('Usuário não encontrado');
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    if (!user.tenantId) {
      const error = new Error('Tenant não encontrado');
      error.code = 'TENANT_NOT_FOUND';
      throw error;
    }

    // Check if email is already in use by another user
    if (validatedData.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (existingUser && existingUser.id !== userId) {
        const error = new Error('Email já está em uso');
        error.code = 'EMAIL_IN_USE';
        throw error;
      }
    }

    // Update user data
    const updateData = {
      name: validatedData.name,
      email: validatedData.email
    };

    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 12);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Update tenant with phone and step
    const tenant = await prisma.tenant.update({
      where: { tenantId: user.tenantId },
      data: {
        mobilePhone: validatedData.phone,
        onboardingStep: 'STEP_2'
      }
    });

    return tenant;
  },

  /**
   * Get available plans
   * @returns {Promise<Array>} List of plans
   */
  async getPlans() {
    // Return hardcoded plans (can be extended to fetch from database)
    return [
      {
        id: 'FREE',
        name: 'FREE',
        maxCompanies: 1,
        maxUsers: 3,
        maxCustomers: 50,
        maxStorageGb: 5,
        priceMonthly: 0,
        features: {
          notes: true,
          folders: true,
          relations: true,
          sharing: false,
          api: false
        }
      },
      {
        id: 'STARTER',
        name: 'STARTER',
        maxCompanies: 2,
        maxUsers: 10,
        maxCustomers: 200,
        maxStorageGb: 20,
        priceMonthly: 49.90,
        features: {
          notes: true,
          folders: true,
          relations: true,
          sharing: true,
          api: false
        }
      },
      {
        id: 'PRO',
        name: 'PRO',
        maxCompanies: 5,
        maxUsers: 25,
        maxCustomers: 1000,
        maxStorageGb: 100,
        priceMonthly: 149.90,
        features: {
          notes: true,
          folders: true,
          relations: true,
          sharing: true,
          api: true
        }
      }
    ];
  },

  /**
   * Select plan (STEP 3)
   * @param {string} userId - User ID
   * @param {Object} data - Plan selection data
   * @returns {Promise<Object>} Updated tenant
   */
  async selectPlan(userId, data) {
    // Validate input
    const validatedData = selectPlanSchema.parse(data);

    // Get user with tenant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true }
    });

    if (!user) {
      const error = new Error('Usuário não encontrado');
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    if (!user.tenantId) {
      const error = new Error('Tenant não encontrado');
      error.code = 'TENANT_NOT_FOUND';
      throw error;
    }

    // Deactivate existing plans
    await prisma.tenantPlan.updateMany({
      where: { tenantId: user.tenantId, active: true },
      data: { active: false }
    });

    // Create new plan
    const plans = await this.getPlans();
    const selectedPlan = plans.find(p => p.name === validatedData.planName);

    if (!selectedPlan) {
      const error = new Error('Plano não encontrado');
      error.code = 'PLAN_NOT_FOUND';
      throw error;
    }

    await prisma.tenantPlan.create({
      data: {
        tenantId: user.tenantId,
        planName: selectedPlan.name,
        maxCompanies: selectedPlan.maxCompanies,
        maxUsers: selectedPlan.maxUsers,
        maxCustomers: selectedPlan.maxCustomers,
        maxStorageGb: selectedPlan.maxStorageGb,
        priceMonthly: selectedPlan.priceMonthly,
        features: selectedPlan.features,
        active: true
      }
    });

    // Update tenant step
    const tenant = await prisma.tenant.update({
      where: { tenantId: user.tenantId },
      data: {
        onboardingStep: 'STEP_3'
      }
    });

    return tenant;
  },

  /**
   * Complete onboarding (STEP 4)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated tenant
   */
  async completeOnboarding(userId) {
    // Get user with tenant
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true }
    });

    if (!user) {
      const error = new Error('Usuário não encontrado');
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    if (!user.tenantId) {
      const error = new Error('Tenant não encontrado');
      error.code = 'TENANT_NOT_FOUND';
      throw error;
    }

    // Verify all steps are completed
    const tenant = user.tenant;
    if (tenant.onboardingStep !== 'STEP_3') {
      const error = new Error('Onboarding não foi completado em todos os steps');
      error.code = 'ONBOARDING_INCOMPLETE';
      throw error;
    }

    // Complete onboarding
    const updatedTenant = await prisma.tenant.update({
      where: { tenantId: user.tenantId },
      data: {
        onboardingStep: 'STEP_4',
        onboardingStatus: 'COMPLETED',
        isActive: true
      }
    });

    return updatedTenant;
  }
};
