// frontend/src/components/layout/Sidebar.jsx - VERSIÓN FINAL
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  GraduationCap,
  Stethoscope,
  LogOut,
  X,
  CalendarPlus
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import { ROLES } from '../../utils/constants';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Menú según rol - COINCIDE CON TUS RUTAS EXACTAS
  const getMenuItems = () => {
    const menus = {
      [ROLES.ADMIN]: [
        { path: '/dashboard/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/usuarios', icon: Users, label: 'Usuarios' },
        { path: '/practicas', icon: GraduationCap, label: 'Prácticas' },
        { path: '/citas', icon: Calendar, label: 'Citas' },
      ],
      [ROLES.MAESTRO]: [
        { path: '/dashboard/maestro', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/practicas', icon: GraduationCap, label: 'Mis Prácticas' },
        { path: '/citas', icon: Calendar, label: 'Citas' },
      ],
      [ROLES.PRACTICANTE]: [
        { path: '/dashboard/practicante', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/mis-practicas', icon: GraduationCap, label: 'Mis Prácticas' },
        { path: '/mis-citas', icon: Calendar, label: 'Mis Citas' },
        { path: '/agenda', icon: Stethoscope, label: 'Mi Agenda' },
      ],
      [ROLES.PACIENTE]: [
        { path: '/dashboard/paciente', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/citas/nueva', icon: CalendarPlus, label: 'Agendar Cita' },
        { path: '/mis-citas', icon: Calendar, label: 'Mis Citas' },
      ]
    };

    return menus[userRole] || [];
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Botón cerrar (móvil) */}
        <div className="flex justify-end p-4 lg:hidden">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menú de navegación */}
        <nav className="px-4 py-2">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors duration-200
                    ${isActive(item.path)
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;