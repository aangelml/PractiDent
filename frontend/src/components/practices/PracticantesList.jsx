import { Mail, Phone, GraduationCap, Calendar } from 'lucide-react';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { ASSIGNMENT_ESTADO_COLORS } from '../../utils/constants';

const PracticantesList = ({ practicantes = [], loading = false }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (practicantes.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p>No hay practicantes asignados a esta práctica</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {practicantes.map((practicante) => (
        <Card key={practicante.id} className="hover:shadow-lg transition-shadow">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">
                  {practicante.nombre} {practicante.apellido}
                </h4>
                {practicante.matricula && (
                  <p className="text-sm text-gray-500">{practicante.matricula}</p>
                )}
              </div>
              <Badge
                text={practicante.estado_asignacion?.replace('_', ' ') || 'Asignado'}
                variant={ASSIGNMENT_ESTADO_COLORS[practicante.estado_asignacion] || 'info'}
              />
            </div>

            {/* Información de Contacto */}
            <div className="space-y-2 text-sm">
              {practicante.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{practicante.email}</span>
                </div>
              )}
              {practicante.telefono && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{practicante.telefono}</span>
                </div>
              )}
            </div>

            {/* Información Académica */}
            {practicante.semestre && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <GraduationCap className="w-4 h-4 text-gray-400" />
                <span>{practicante.semestre}° Semestre</span>
                {practicante.turno && (
                  <>
                    <span>•</span>
                    <span className="capitalize">{practicante.turno}</span>
                  </>
                )}
              </div>
            )}

            {/* Fecha de Asignación */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>Asignado: {formatDate(practicante.fecha_asignacion)}</span>
              </div>
            </div>

            {/* Observaciones */}
            {practicante.observaciones && (
              <div className="pt-2 text-sm">
                <p className="text-gray-600 italic">
                  "{practicante.observaciones}"
                </p>
              </div>
            )}

            {/* Calificación */}
            {practicante.calificacion_maestro && (
              <div className="pt-2 flex items-center gap-2">
                <span className="text-sm text-gray-600">Calificación:</span>
                <Badge
                  text={`${practicante.calificacion_maestro}/5.0`}
                  variant="success"
                />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PracticantesList;