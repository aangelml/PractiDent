import api from './api';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '../utils/constants';

const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { token, refreshToken, user } = response.data.data;
        
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        return { success: true, user, token };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión'
      };
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        const { token, refreshToken, user } = response.data.data;
        
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        return { success: true, user, token };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Register error:', error);
      
      if (error.response?.data?.errors) {
        return {
          success: false,
          errors: error.response.data.errors
        };
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Error al registrar usuario'
      };
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('user');
    }
  },

  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      
      if (response.data.success) {
        const user = response.data.data.user;
        localStorage.setItem('user', JSON.stringify(user));
        return { success: true, user };
      }
      
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener perfil'
      };
    }
  },

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cambiar contraseña'
      };
    }
  },

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      
      if (response.data.success) {
        const { token, refreshToken: newRefreshToken } = response.data.data;
        
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        
        return { success: true };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Refresh token error:', error);
      this.logout();
      return { success: false };
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getUserRole() {
    const user = this.getCurrentUser();
    return user?.tipo_usuario || null;
  }
};

export default authService;