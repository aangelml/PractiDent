import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  Activity,
  UserCog,
  GraduationCap,
  Stethoscope,
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { userRole } = useAuth();

  // Menús por rol
  const menuItems = {
    [ROLES.ADMIN]: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/admin' },
      { icon: Users, label: 'Usuarios', path: '/usuarios' },
      { icon: GraduationCap, label: 'Practicantes', path: '/practicantes' },
      { icon: Stethoscope, label: 'Maestros', path: '/maestros' },
      { icon: UserCog, label: 'Pacientes', path: '/pacientes' },
      { icon: Calendar, label: 'Citas', path: '/citas' },
      { icon: FileText, label: 'Historiales', path: '/historiales' },
      { icon: Activity, label: 'Reportes', path: '/reportes' },
      { icon: Settings, label: 'Configuración', path: '/settings' }
    ],
    [ROLES.MAESTRO]: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/maestro' },
      { icon: GraduationCap, label: 'Mis Practicantes', path: '/mis-practicantes' },
      { icon: Calendar, label: 'Supervisión', path: '/supervision' },
      { icon: FileText, label: 'Evaluaciones', path: '/evaluaciones' },
      { icon: Activity, label: 'Reportes', path: '/reportes' },
      { icon: Settings, label: 'Configuración', path: '/settings' }
    ],
    [ROLES.PRACTICANTE]: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/practicante' },
      { icon: Calendar, label: 'Mis Citas', path: '/mis-citas' },
      { icon: Users, label: 'Mis Pacientes', path: '/mis-pacientes' },
      { icon: FileText, label: 'Historiales', path: '/historiales' },
      { icon: Stethoscope, label: 'Mi Maestro', path: '/mi-maestro' },
      { icon: Settings, label: 'Configuración', path: '/settings' }
    ],
    [ROLES.PACIENTE]: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/paciente' },
      { icon: Calendar, label: 'Mis Citas', path: '/mis-citas' },
      { icon: FileText, label: 'Mi Historial', path: '/mi-historial' },
      { icon: GraduationCap, label: 'Mi Practicante', path: '/mi-practicante' },
      { icon: Settings, label: 'Configuración', path: '/settings' }
    ]
  };

  const currentMenu = menuItems[userRole] || [];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-64 bg-white shadow-xl overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-30
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header del Sidebar - Solo en mobile */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="text-lg font-bold text-gray-900">PRACTIDENT</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {currentMenu.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${active
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer del Sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="text-xs text-gray-500 text-center">
            <p>PRACTIDENT v1.0</p>
            <p className="mt-1">© 2025 Todos los derechos reservados</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;