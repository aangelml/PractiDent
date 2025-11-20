// frontend/src/components/appointments/AppointmentCard.jsx
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

const AppointmentCard = ({ appointment, userRole, onConfirm, onCancel, onComplete, onNoShow }) => {
  const {
    id,
    fecha_hora,
    duracion_minutos,
    estado,
    motivo_consulta,
    paciente_nombre,
    paciente_apellido,
    practicante_nombre,
    practicante_apellido,
    practica_nombre
  } = appointment;

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear hora
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Colores según estado
  const estadoColors = {
    pendiente: 'warning',
    confirmada: 'info',
    completada: 'success',
    cancelada: 'error',
    no_asistio: 'error'
  };

  // Iconos según estado
  const estadoIcons = {
    pendiente: AlertCircle,
    confirmada: CheckCircle,
    completada: CheckCircle,
    cancelada: XCircle,
    no_asistio: XCircle
  };

  const EstadoIcon = estadoIcons[estado] || AlertCircle;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <div>
              <p className="font-semibold text-gray-900 capitalize">
                {formatDate(fecha_hora)}
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(fecha_hora)} ({duracion_minutos} min)
              </p>
            </div>
          </div>
          <Badge
            text={estado.charAt(0).toUpperCase() + estado.slice(1).replace('_', ' ')}
            variant={estadoColors[estado]}
            icon={<EstadoIcon className="w-4 h-4" />}
          />
        </div>

        {/* Información */}
        <div className="space-y-2">
          {userRole === 'practicante' && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Paciente:</span>
              <span className="font-medium text-gray-900">
                {paciente_nombre} {paciente_apellido}
              </span>
            </div>
          )}

          {userRole === 'paciente' && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Practicante:</span>
              <span className="font-medium text-gray-900">
                {practicante_nombre} {practicante_apellido}
              </span>
            </div>
          )}

          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5" />
            <div>
              <span className="text-gray-600">Motivo:</span>
              <p className="font-medium text-gray-900">{motivo_consulta}</p>
            </div>
          </div>

          {practica_nombre && (
            <div className="text-sm text-gray-600">
              Práctica: <span className="font-medium">{practica_nombre}</span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          {/* Practicante */}
          {userRole === 'practicante' && (
            <>
              {estado === 'pendiente' && (
                <>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onConfirm(id)}
                    className="flex-1"
                  >
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCancel(id)}
                  >
                    Rechazar
                  </Button>
                </>
              )}

              {estado === 'confirmada' && (
                <>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => onComplete(id)}
                    className="flex-1"
                  >
                    Completar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onNoShow(id)}
                  >
                    No Asistió
                  </Button>
                </>
              )}
            </>
          )}

          {/* Paciente */}
          {userRole === 'paciente' && (
            <>
              {(estado === 'pendiente' || estado === 'confirmada') && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => onCancel(id)}
                  className="flex-1"
                >
                  Cancelar Cita
                </Button>
              )}

              {estado === 'completada' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  Calificar Servicio
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AppointmentCard;