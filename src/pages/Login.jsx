import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/AuthContext';
import { useLogin } from '@/api/useAuth';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

export default function Login() {
  const navigate = useNavigate();
  const { checkAppState } = useAuth();
  const loginMutation = useLogin();
  const [apiError, setApiError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    setApiError(null);

    try {
      console.log('🔐 Attempting login with:', data.email);
      const response = await loginMutation.mutateAsync(data);
      console.log('✅ Login response:', response);

      // Token and encryption are already handled by useLogin hook
      console.log('🔄 Updating auth context...');
      await checkAppState();

      console.log('🚀 Redirecting to home...');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (error) {
      console.error('❌ Login error:', error);
      if (error.status === 401) {
        setApiError('Email ou senha inválidos');
      } else if (error.message?.includes('Encryption key')) {
        setApiError('Erro ao inicializar encriptação. Tente novamente.');
      } else {
        setApiError(error.data?.message || error.message || 'Erro ao fazer login');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Entre com suas credenciais para acessar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                disabled={loginMutation.isPending}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                disabled={loginMutation.isPending}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            {apiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {apiError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center text-sm">
              <p className="text-slate-600">
                Não tem conta?{' '}
                <a href="/onboarding" className="text-slate-900 font-semibold hover:underline">
                  Clique aqui!
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
