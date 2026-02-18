import { appParams, setAppToken } from '@/lib/app-params';

/** @typedef {import('@/types/api').ApiResponse} ApiResponse */

// Use relative paths - Nginx proxy handles routing to backend
const API_BASE_URL = '/api';

/**
 * API Client for KawaMyCenter Backend
 * Handles HTTP requests with authentication and error handling
 * 
 * SECURITY NOTE: Refresh tokens are stored in localStorage.
 * For enhanced security in production, consider:
 * 1. Using httpOnly cookies for refresh tokens (requires backend support)
 * 2. Implementing Content Security Policy (CSP) headers
 * 3. Adding CSRF token validation
 * 4. Using SameSite cookie attribute
 * 
 * @type {Object}
 */
export const apiClient = {
  /**
   * @template T
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<ApiResponse<T>>}
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('📡 API Request:', { method: options.method || 'GET', url });
    
    const headers = {
      'Content-Type': 'application/json',
      ...(appParams.token && { 'Authorization': `Bearer ${appParams.token}` }),
      ...(appParams.appId && { 'X-App-Id': appParams.appId }),
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include' // Include cookies for httpOnly token support
      });

      console.log('📡 API Response:', { status: response.status, url });

      if (!response.ok) {
        // Handle 401 with token refresh
        if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
          const refreshToken = localStorage.getItem('kawa_refresh_token');
          if (refreshToken) {
            try {
              const refreshResponse = await this.post('/auth/refresh', { refreshToken });
              if (refreshResponse.data?.accessToken) {
                setAppToken(refreshResponse.data.accessToken);
                if (refreshResponse.data.refreshToken) {
                  localStorage.setItem('kawa_refresh_token', refreshResponse.data.refreshToken);
                }
                // Retry original request with new token
                return this.request(endpoint, options);
              }
            } catch {
              // Refresh failed, clear tokens and redirect to login
              setAppToken(null);
              localStorage.removeItem('kawa_refresh_token');
              window.location.href = `/login?from_url=${encodeURIComponent(window.location.href)}`;
              throw new Error('Session expired');
            }
          } else {
            // No refresh token, redirect to login
            setAppToken(null);
            window.location.href = `/login?from_url=${encodeURIComponent(window.location.href)}`;
          }
        }

        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        try {
          error.data = await response.json();
        } catch {
          error.data = null;
        }
        throw error;
      }

      return response.json();
    } catch (error) {
      console.error('❌ API Error:', { url, error: error.message });
      throw error;
    }
  },

  /**
   * @template T
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<ApiResponse<T>>}
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  /**
   * @template T
   * @param {string} endpoint - API endpoint
   * @param {T} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise<ApiResponse<T>>}
   */
  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * @template T
   * @param {string} endpoint - API endpoint
   * @param {Partial<T>} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise<ApiResponse<T>>}
   */
  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * @template T
   * @param {string} endpoint - API endpoint
   * @param {Partial<T>} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise<ApiResponse<T>>}
   */
  patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  /**
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<ApiResponse<void>>}
   */
  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
};

/**
 * Auth API
 */
export const authApi = {
  login: (data) => apiClient.post('/auth/login', data),
  me: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
  refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
  updateEncryptionSalt: (encryptionSalt) => apiClient.put('/auth/encryption-salt', { encryptionSalt })
};

/**
 * Notes API
 */
export const notesApi = {
  list: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/notes?${queryString}`);
  },
  get: (id) => apiClient.get(`/notes/${id}`),
  create: (data) => apiClient.post('/notes', data),
  update: (id, data) => apiClient.put(`/notes/${id}`, data),
  delete: (id) => apiClient.delete(`/notes/${id}`),
  search: (query) => apiClient.get(`/notes/search?q=${encodeURIComponent(query)}`)
};

/**
 * Folders API
 */
export const foldersApi = {
  list: (parentId) => {
    const query = parentId ? `?parentId=${parentId}` : '';
    return apiClient.get(`/folders${query}`);
  },
  hierarchy: () => apiClient.get('/folders/hierarchy'),
  get: (id) => apiClient.get(`/folders/${id}`),
  getNotes: (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/folders/${id}/notes?${queryString}`);
  },
  create: (data) => apiClient.post('/folders', data),
  update: (id, data) => apiClient.put(`/folders/${id}`, data),
  delete: (id) => apiClient.delete(`/folders/${id}`)
};

/**
 * Relations API
 */
export const relationsApi = {
  list: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiClient.get(`/relations?${queryString}`);
  },
  getRelatedNotes: (noteId) => apiClient.get(`/relations/note/${noteId}`),
  create: (data) => apiClient.post('/relations', data),
  update: (id, data) => apiClient.put(`/relations/${id}`, data),
  delete: (id) => apiClient.delete(`/relations/${id}`),
  getGraph: () => apiClient.get('/relations/graph')
};

/**
 * Apps API (Public)
 */
export const appsApi = {
  getPublicSettings: (appId) => apiClient.get(`/apps/public/prod/public-settings/by-id/${appId}`)
};

/**
 * Tenants API
 */
export const tenantsApi = {
  create: (data) => apiClient.post('/tenants', data),
  update: (tenantId, data) => apiClient.put(`/tenants/${tenantId}`, data),
  get: (tenantId) => apiClient.get(`/tenants/${tenantId}`),
  getByDocument: (document) => apiClient.get(`/tenants/by-document/${document}`)
};
