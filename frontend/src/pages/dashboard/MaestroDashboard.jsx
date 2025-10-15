import { GraduationCap, Calendar, FileText, Activity, Clock, CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';

const MaestroDashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      icon: GraduationCap,
      label: 'Mis Practicantes',
      value: '12',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Calendar,
      label: 'Supervisiones Hoy',
      value: '5',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: FileText,
      label: 'Evaluaciones Pendientes',
      value: '8',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: CheckCircle,
      label: 'Tratamientos Aprobados',
      value: '45',
      color: 'from-purple-500 to-purple-600'
    }
  ];

  const practicantes = [
    { nombre: 'Ana Martínez', semestre: '6° Semestre', citas: 8, evaluacion: 9.2 },
    { nombre: 'Carlos Ruiz', semestre: '7° Semestre', citas: 12, evaluacion: 8.8 },
    { nombre: 'Laura Sánchez', semestre: '5° Semestre', citas: 6, evaluacion: 9.5 },
    { nombre: 'Pedro Gómez', semestre: '8° Semestre', citas: 15, evaluacion: 8.5 }
  ];

  const proximasSupervisions = [
    { practicante: 'Ana Martínez', paciente: 'Roberto Silva', hora: '10:00 AM', tipo: 'Ortodoncia' },
    { practicante: 'Carlos Ruiz', paciente: 'María López', hora: '11:30 AM', tipo: 'Endodoncia' },
    { practicante: 'Laura Sánchez', paciente: 'José Ramírez', hora: '02:00 PM', tipo: 'Limpieza' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Panel del Maestro
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenido, Dr. {user?.nombre} {user?.apellido}
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
        {/* Mis Practicantes */}
        <Card title="Mis Practicantes" className="h-fit">
          <div className="space-y-4">
            {practicantes.map((practicante, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{practicante.nombre}</p>
                  <p className="text-sm text-gray-600">{practicante.semestre}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{practicante.citas} citas</p>
                  <p className="text-sm font-semibold text-primary">Eval: {practicante.evaluacion}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Próximas Supervisiones */}
        <Card title="Supervisiones de Hoy" className="h-fit">
          <div className="space-y-4">
            {proximasSupervisions.map((supervision, index) => (
              <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{supervision.hora}</p>
                  <p className="text-sm text-gray-600">{supervision.practicante}</p>
                  <p className="text-sm text-gray-500">Paciente: {supervision.paciente}</p>
                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                    {supervision.tipo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MaestroDashboard;