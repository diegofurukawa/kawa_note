import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from './client';
import { initializeEncryption, clearKey } from '@/lib/keyManager';
import { generateSalt } from '@/lib/crypto';
import { setAppToken } from '@/lib/app-params';

const AUTH_QUERY_KEY = 'auth';
const USER_QUERY_KEY = 'user';

/**
 * Hook to fetch current user data
 */
export const useCurrentUser = (options = {}) => {
  return useQuery({
    queryKey: [AUTH_QUERY_KEY, USER_QUERY_KEY],
    queryFn: () => authApi.me(),
    retry: false,
    ...options
  });
};

/**
 * Hook to login
 */
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials) => {
      console.log('🔐 useLogin: Starting login process...');
      const response = await authApi.login(credentials);
      console.log('✅ useLogin: Login API response received');
      
      // Store token immediately so subsequent calls are authenticated
      if (response.data?.accessToken) {
        console.log('💾 useLogin: Storing access token...');
        setAppToken(response.data.accessToken);
        
        if (response.data.refreshToken) {
          localStorage.setItem('kawa_refresh_token', response.data.refreshToken);
        }
      }
      
      // Fetch fresh user data with /me (now authenticated)
      console.log('👤 useLogin: Fetching user data via /me...');
      const meResponse = await authApi.me();
      const user = meResponse.data;
      console.log('✅ useLogin: User data received');
      
      let salt = user.encryptionSalt;
      console.log('🔑 useLogin: Encryption salt:', salt ? 'EXISTS' : 'NULL - will generate');
      
      // First login: generate and save salt
      if (!salt) {
        console.log('🔑 useLogin: Generating new encryption salt...');
        salt = await generateSalt();
        console.log('💾 useLogin: Saving encryption salt to backend...');
        await authApi.updateEncryptionSalt(salt);
        console.log('✅ useLogin: Encryption salt saved');
      }
      
      // Derive encryption key
      console.log('🔐 useLogin: Deriving encryption key from password...');
      await initializeEncryption(credentials.password, salt);
      console.log('✅ useLogin: Encryption key initialized successfully');
      
      return response;
    },
    onSuccess: () => {
      console.log('🔄 useLogin: Invalidating auth queries...');
      queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY] });
    },
    onError: (error) => {
      console.error('❌ useLogin: Login failed:', error);
    }
  });
};

/**
 * Hook to logout
 */
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await authApi.logout();
      clearKey(); // Clear encryption key
      return response;
    },
    onSuccess: () => {
      queryClient.clear();
    }
  });
};

/**
 * Hook to refresh token
 */
export const useRefreshToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (refreshToken) => authApi.refresh(refreshToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AUTH_QUERY_KEY] });
    }
  });
};
