import { onboardingController } from './onboarding.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

/**
 * Onboarding Routes
 * 
 * ONBOARDING FLOW:
 * ================
 * STEP 1: Create Tenant (POST /api/tenants)
 *   - Public endpoint
 *   - Creates tenant with basic info (name, document, address)
 *   - Returns tenantId
 * 
 * STEP 2: Update User Credentials (PATCH /api/onboarding/step-2)
 *   - Protected endpoint (requires auth)
 *   - Updates user email/password
 *   - Associates user with tenant
 * 
 * STEP 3: Select Plan (POST /api/onboarding/step-3)
 *   - Protected endpoint (requires auth)
 *   - User selects subscription plan
 *   - Plan is associated with tenant
 * 
 * STEP 4: Complete Onboarding (POST /api/onboarding/complete)
 *   - Protected endpoint (requires auth)
 *   - Marks tenant as active
 *   - User can now use the application
 * 
 * VALIDATION:
 * - Steps must be completed in order
 * - Cannot skip steps
 * - Cannot go backwards
 */

export default async function onboardingRoutes(app) {
  // Update user credentials (STEP 2) - protected
  app.patch('/step-2', { onRequest: authenticate }, onboardingController.updateUserCredentials);

  // Get available plans (STEP 3) - protected
  app.get('/plans', { onRequest: authenticate }, onboardingController.getPlans);

  // Select plan (STEP 3) - protected
  app.post('/step-3', { onRequest: authenticate }, onboardingController.selectPlan);

  // Complete onboarding (STEP 4) - protected
  app.post('/complete', { onRequest: authenticate }, onboardingController.completeOnboarding);
}
