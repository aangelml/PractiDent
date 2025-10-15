import { Calendar, Users, FileText, Stethoscope, Clock, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';

const PracticanteDashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      icon: Calendar,
      label: 'Citas Esta Semana',
      value: '8',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Users,
      label: 'Mis Pacientes',
      value: '15',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: FileText,
      label: 'Historiales Activos',
      value: '12',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Stethoscope,
      label: 'Tratamientos en Curso',
      value: '6',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const citasHoy = [
    { paciente: 'Roberto Silva', hora: '09:00 AM', tipo: 'Limpieza', estado: 'pendiente' },
    { paciente: 'Ana Torres', hora: '11:00 AM', tipo: 'Revisión', estado: 'pendiente' },
    { paciente: 'Luis Hernández', hora: '03:00 PM', tipo: 'Ortodoncia', estado: 'confirmada' }
  ];

  const proximasCitas = [
    { paciente: 'María González', fecha: 'Mañana', hora: '10:00 AM', tipo: 'Endodoncia' },
    { paciente: 'Jorge Ramírez', fecha: 'Viernes', hora: '02:00 PM', tipo: 'Extracción' },
    { paciente: 'Sofía Mendoza', fecha: 'Lunes', hora: '09:30 AM', tipo: 'Limpieza' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Panel del Practicante
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenido, {user?.nombre} {user?.apellido}
          </p>
          <p className="text-sm text-gray-500">
            Matrícula: {user?.matricula} • {user?.semestre}° Semestre • Turno {user?.turno}
          </p>
        </div>
        <Button variant="primary">
          <Calendar className="w-4 h-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Alert de Supervisión */}
      <Alert type="info">
        <strong>Próxima supervisión:</strong> Hoy a las 11:30 AM con el Dr. Rodríguez
      </Alert>

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
        {/* Citas de Hoy */}
        <Card title="Citas de Hoy" className="h-fit">
          <div className="space-y-4">
            {citasHoy.map((cita, index) => (
              <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{cita.paciente}</p>
                    <span className={`px-2 py-1 text-xs rounded ${
                      cita.estado === 'confirmada' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {cita.estado}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{cita.hora}</p>
                  <p className="text-sm text-gray-500">{cita.tipo}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" fullWidth className="mt-4">
            Ver Todas las Citas
          </Button>
        </Card>

        {/* Próximas Citas */}
        <Card title="Próximas Citas" className="h-fit">
          <div className="space-y-4">
            {proximasCitas.map((cita, index) => (
              <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{cita.paciente}</p>
                  <p className="text-sm text-gray-600">{cita.fecha} - {cita.hora}</p>
                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                    {cita.tipo}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" fullWidth className="mt-4">
            Ver Calendario Completo
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default PracticanteDashboard;