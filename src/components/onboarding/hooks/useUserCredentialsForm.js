import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';

/**
 * Validation schema for user credentials
 * All fields are required in Step 2
 */
const userCredentialsSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  phone: z.string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória')
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'As senhas não coincidem',
    path: ['confirmPassword']
  }
);

/**
 * useUserCredentialsForm Hook
 * Manages form state and API calls for user credentials
 */
export function useUserCredentialsForm(tenantId, onSuccess, onError) {
  const { user } = useAuth();

  const form = useForm({
    resolver: zodResolver(userCredentialsSchema),
    mode: 'onBlur',
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      password: '',
      confirmPassword: ''
    }
  });

  // Mutation for updating user credentials
  const updateCredentialsMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch('/api/onboarding/step-2', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erro ao atualizar credenciais');
      }

      return response.json();
    },
    onSuccess: (response) => {
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error.message);
    }
  });

  const onSubmit = async (data) => {
    try {
      await updateCredentialsMutation.mutateAsync(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return {
    form,
    isSubmitting: updateCredentialsMutation.isPending,
    error: updateCredentialsMutation.error?.message || null,
    onSubmit: form.handleSubmit(onSubmit)
  };
}
