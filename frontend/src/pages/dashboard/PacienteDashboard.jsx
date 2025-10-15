import { Calendar, FileText, User, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';

const PacienteDashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      icon: Calendar,
      label: 'Próximas Citas',
value: '2',
color: 'from-blue-500 to-blue-600'
},
{
icon: FileText,
label: 'Tratamientos Activos',
value: '1',
color: 'from-green-500 to-green-600'
},
{
icon: CheckCircle,
label: 'Citas Completadas',
value: '8',
color: 'from-purple-500 to-purple-600'
},
{
icon: Clock,
label: 'Última Visita',
value: 'Hace 5 días',
color: 'from-orange-500 to-orange-600'
}
];
const proximasCitas = [
{
fecha: '2025-10-18',
hora: '10:00 AM',
practicante: 'Ana Martínez',
tipo: 'Limpieza Dental',
estado: 'confirmada'
},
{
fecha: '2025-10-25',
hora: '03:00 PM',
practicante: 'Carlos Ruiz',
tipo: 'Revisión de Ortodoncia',
estado: 'pendiente'
}
];
const historialReciente = [
{ fecha: '2025-10-10', tratamiento: 'Limpieza Dental', practicante: 'Ana Martínez', estado: 'completado' },
{ fecha: '2025-09-28', tratamiento: 'Extracción', practicante: 'Laura Sánchez', estado: 'completado' },
{ fecha: '2025-09-15', tratamiento: 'Revisión General', practicante: 'Carlos Ruiz', estado: 'completado' }
];
const miPracticante = {
nombre: 'Ana Martínez',
semestre: '6° Semestre',
especialidad: 'Ortodoncia',
email: 'ana.martinez@practident.com'
};
return (
<div className="space-y-6">
{/* Header */}
<div className="flex justify-between items-center">
<div>
<h1 className="text-3xl font-bold text-gray-900">
Panel del Paciente
</h1>
<p className="text-gray-600 mt-1">
Bienvenido, {user?.nombre} {user?.apellido}
</p>
</div>
<Button variant="primary">
<Calendar className="w-4 h-4 mr-2" />
Agendar Cita
</Button>
</div>{/* Alert de Próxima Cita */}
  {proximasCitas.length > 0 && (
    <Alert type="info">
      <strong>Próxima cita:</strong> {proximasCitas[0].tipo} el {new Date(proximasCitas[0].fecha).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las {proximasCitas[0].hora}
    </Alert>
  )}

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
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Próximas Citas */}
    <Card title="Mis Próximas Citas" className="lg:col-span-2 h-fit">
      <div className="space-y-4">
        {proximasCitas.map((cita, index) => (
          <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900">{cita.tipo}</p>
                <span className={`px-2 py-1 text-xs rounded ${
                  cita.estado === 'confirmada' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {cita.estado}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                {new Date(cita.fecha).toLocaleDateString('es-MX')} - {cita.hora}
              </p>
              <p className="text-sm text-gray-600">
                <User className="w-4 h-4 inline mr-1" />
                {cita.practicante}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm">Cancelar</Button>
              {cita.estado === 'pendiente' && (
                <Button variant="primary" size="sm">Confirmar</Button>
              )}
            </div>
          </div>
        ))}
      </div>
      {proximasCitas.length === 0 && (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No tienes citas programadas</p>
          <Button variant="primary" className="mt-4">
            Agendar Nueva Cita
          </Button>
        </div>
      )}
    </Card>

    {/* Mi Practicante */}
    <Card title="Mi Practicante Asignado" className="h-fit">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 text-lg mb-1">
          {miPracticante.nombre}
        </h3>
        <p className="text-sm text-gray-600 mb-1">{miPracticante.semestre}</p>
        <p className="text-sm text-gray-500 mb-4">{miPracticante.especialidad}</p>
        <Button variant="outline" size="sm" fullWidth>
          Contactar
        </Button>
      </div>
    </Card>
  </div>

  {/* Historial Reciente */}
  <Card title="Historial de Citas Recientes">
    <div className="space-y-3">
      {historialReciente.map((registro, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{registro.tratamiento}</p>
              <p className="text-sm text-gray-600">{registro.practicante}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{new Date(registro.fecha).toLocaleDateString('es-MX')}</p>
            <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
              {registro.estado}
            </span>
          </div>
        </div>
      ))}
    </div>
    <Button variant="outline" fullWidth className="mt-4">
      Ver Historial Completo
    </Button>
  </Card>
</div>);
};
export default PacienteDashboard;