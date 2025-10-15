import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { DASHBOARD_ROUTES, MESSAGES } from '../utils/constants';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = authService.getCurrentUser();
        
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          const result = await authService.getProfile();
          
          if (result.success) {
            setUser(result.user);
            setIsAuthenticated(true);
          } else {
            await logout();
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const result = await authService.login(email, password);

      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        toast.success(MESSAGES.LOGIN_SUCCESS);

        const dashboardRoute = DASHBOARD_ROUTES[result.user.tipo_usuario] || '/';
        navigate(dashboardRoute);

        return { success: true };
      }

      toast.error(result.message || MESSAGES.LOGIN_ERROR);
      return { success: false, message: result.message };
    } catch (error) {
      console.error('Login error:', error);
      toast.error(MESSAGES.NETWORK_ERROR);
      return { success: false, message: MESSAGES.NETWORK_ERROR };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const result = await authService.register(userData);

      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        toast.success(MESSAGES.REGISTER_SUCCESS);

        const dashboardRoute = DASHBOARD_ROUTES[result.user.tipo_usuario] || '/';
        navigate(dashboardRoute);

        return { success: true };
      }

      if (result.errors) {
        const errorMessages = result.errors.map(err => err.message).join(', ');
        toast.error(errorMessages);
        return { success: false, errors: result.errors };
      }

      toast.error(result.message || MESSAGES.REGISTER_ERROR);
      return { success: false, message: result.message };
    } catch (error) {
      console.error('Register error:', error);
      toast.error(MESSAGES.NETWORK_ERROR);
      return { success: false, message: MESSAGES.NETWORK_ERROR };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      toast.success(MESSAGES.LOGOUT_SUCCESS);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async () => {
    try {
      const result = await authService.getProfile();
      
      if (result.success) {
        setUser(result.user);
        return { success: true };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    userRole: user?.tipo_usuario || null
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};