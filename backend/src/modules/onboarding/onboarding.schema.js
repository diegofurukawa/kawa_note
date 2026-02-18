import { z } from 'zod';
import { normalizePhone } from '../../utils/normalizers.js';

/**
 * Schema for updating user credentials (STEP 2)
 */
export const updateUserCredentialsSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string()
    .transform((val) => {
      if (!val) return '';
      try {
        return normalizePhone(val);
      } catch (e) {
        return val;
      }
    })
    .refine((val) => val && (val.length === 10 || val.length === 11), 'Telefone deve ter 10 ou 11 dígitos'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres')
});

/**
 * Schema for selecting plan (STEP 3)
 */
export const selectPlanSchema = z.object({
  planName: z.enum(['FREE', 'STARTER', 'PRO'], {
    errorMap: () => ({ message: 'Plano inválido' })
  })
});
