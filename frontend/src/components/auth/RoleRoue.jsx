import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../ui/Loader';
import { ROLES } from '../../utils/constants';

const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (loading) {
    return <Loader fullScreen text="Verificando permisos..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin siempre tiene acceso a todo
  if (userRole === ROLES.ADMIN) {
    return children;
  }

  // Verificar si el rol del usuario está en los roles permitidos
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleRoute;