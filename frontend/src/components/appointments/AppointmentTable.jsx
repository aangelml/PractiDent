// frontend/src/components/appointments/AppointmentTable.jsx
import { Calendar, User, Clock } from 'lucide-react';
import Badge from '../ui/Badge';

const AppointmentTable = ({ appointments, loading, userRole }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const estadoColors = {
    pendiente: 'warning',
    confirmada: 'info',
    completada: 'success',
    cancelada: 'error',
    no_asistio: 'error'
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha y Hora
            </th>
            {userRole === 'practicante' && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paciente
              </th>
            )}
            {userRole === 'paciente' && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Practicante
              </th>
            )}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Motivo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Duración
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {appointments.map((appointment) => (
            <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(appointment.fecha_hora)}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(appointment.fecha_hora)}
                    </div>
                  </div>
                </div>
              </td>

              {userRole === 'practicante' && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div className="text-sm text-gray-900">
                      {appointment.paciente_nombre} {appointment.paciente_apellido}
                    </div>
                  </div>
                </td>
              )}

              {userRole === 'paciente' && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div className="text-sm text-gray-900">
                      {appointment.practicante_nombre} {appointment.practicante_apellido}
                    </div>
                  </div>
                </td>
              )}

              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-xs truncate">
                  {appointment.motivo_consulta}
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <Badge
                  text={appointment.estado.charAt(0).toUpperCase() + appointment.estado.slice(1).replace('_', ' ')}
                  variant={estadoColors[appointment.estado]}
                />
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {appointment.duracion_minutos} min
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {appointments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay citas para mostrar
        </div>
      )}
    </div>
  );
};

export default AppointmentTable;