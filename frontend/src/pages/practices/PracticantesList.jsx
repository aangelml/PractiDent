// frontend/src/components/practices/PracticantesList.jsx
import { User, Mail, IdCard, Calendar } from 'lucide-react';
import Loader from '../ui/Loader';
import Badge from '../ui/Badge';

const PracticantesList = ({ practicantes, loading }) => {
  if (loading) {
    return <Loader text="Cargando practicantes..." />;
  }

  if (!practicantes || practicantes.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg font-medium">
          No hay practicantes asignados
        </p>
        <p className="text-gray-400 text-sm mt-2">
          Usa el botón "Asignar Practicante" para agregar estudiantes a esta práctica
        </p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const estadoColors = {
    asignado: 'warning',
    en_progreso: 'info',
    completado: 'success',
    cancelado: 'error'
  };

  return (
    <div className="space-y-4">
      {/* Contador */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {practicantes.length} {practicantes.length === 1 ? 'practicante' : 'practicantes'}
        </p>
      </div>

      {/* Lista de Practicantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {practicantes.map((practicante) => (
          <div
            key={practicante.id || practicante.practicante_id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {practicante.practicante_nombre?.charAt(0) || practicante.nombre?.charAt(0)}
                    {practicante.practicante_apellido?.charAt(0) || practicante.apellido?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {practicante.practicante_nombre || practicante.nombre}{' '}
                    {practicante.practicante_apellido || practicante.apellido}
                  </h4>
                  {practicante.matricula && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <IdCard className="w-3 h-3" />
                      {practicante.matricula}
                    </p>
                  )}
                </div>
              </div>
              {practicante.estado_asignacion && (
                <Badge
                  text={practicante.estado_asignacion.replace('_', ' ')}
                  variant={estadoColors[practicante.estado_asignacion] || 'default'}
                />
              )}
            </div>

            {/* Información */}
            <div className="space-y-2 text-sm">
              {(practicante.email || practicante.practicante_email) && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">
                    {practicante.email || practicante.practicante_email}
                  </span>
                </div>
              )}

              {practicante.fecha_asignacion && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>Asignado: {formatDate(practicante.fecha_asignacion)}</span>
                </div>
              )}

              {practicante.semestre && (
                <div className="text-gray-600">
                  <span className="font-medium">Semestre:</span> {practicante.semestre}
                </div>
              )}

              {practicante.turno && (
                <div className="text-gray-600">
                  <span className="font-medium">Turno:</span>{' '}
                  <span className="capitalize">{practicante.turno}</span>
                </div>
              )}

              {practicante.calificacion_maestro && (
                <div className="text-gray-600">
                  <span className="font-medium">Calificación:</span>{' '}
                  {practicante.calificacion_maestro}/10
                </div>
              )}

              {practicante.observaciones && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Observaciones:</span>{' '}
                    {practicante.observaciones}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PracticantesList;