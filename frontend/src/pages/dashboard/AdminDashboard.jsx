import { Users, GraduationCap, Stethoscope, Calendar, Activity, TrendingUp } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      icon: Users,
      label: 'Total Usuarios',
      value: '156',
      change: '+12%',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: GraduationCap,
      label: 'Practicantes',
      value: '89',
      change: '+8%',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Stethoscope,
      label: 'Maestros',
      value: '23',
      change: '+3%',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Calendar,
      label: 'Citas Hoy',
      value: '34',
      change: '+15%',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const recentActivities = [
    { action: 'Nuevo practicante registrado', user: 'Juan Pérez', time: 'Hace 5 minutos' },
    { action: 'Cita agendada', user: 'María García', time: 'Hace 15 minutos' },
    { action: 'Maestro actualizado', user: 'Dr. Rodríguez', time: 'Hace 1 hora' },
    { action: 'Paciente registrado', user: 'Carlos López', time: 'Hace 2 horas' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Administración
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenido, {user?.nombre} {user?.apellido}
          </p>
        </div>
        <Button variant="primary">
          <Activity className="w-4 h-4 mr-2" />
          Ver Reportes
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">{stat.change}</span>
                  </div>
                </div>
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-full flex items-center justify-center`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad Reciente */}
        <Card title="Actividad Reciente" className="h-fit">
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.user}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Acciones Rápidas */}
        <Card title="Acciones Rápidas" className="h-fit">
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" fullWidth>
              <Users className="w-4 h-4 mr-2" />
              Usuarios
            </Button>
            <Button variant="outline" fullWidth>
              <Calendar className="w-4 h-4 mr-2" />
              Citas
            </Button>
            <Button variant="outline" fullWidth>
              <GraduationCap className="w-4 h-4 mr-2" />
              Practicantes
            </Button>
            <Button variant="outline" fullWidth>
              <Stethoscope className="w-4 h-4 mr-2" />
              Maestros
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;