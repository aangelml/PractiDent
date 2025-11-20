import { Calendar, Clock, User, Stethoscope, FileText, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { APPOINTMENT_ESTADO_COLORS } from '../../utils/constants';

const AppointmentCard = ({ appointment, userRole, onConfirm, onCancel, onComplete, onNoShow }) => {
  const navigate = useNavigate();

  // Formatear fecha y hora
  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    const dateStr = date.toLocaleDateString('es-MX', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    return { dateStr, timeStr };
  };

  const { dateStr, timeStr } = formatDateTime(appointment.fecha_hora);

  // Determinar si se puede realizar acciones
  const canConfirm = appointment.estado === 'pendiente' && ['practicante', 'maestro', 'admin'].includes(userRole);
  const canCancel = ['pendiente', 'confirmada'].includes(appointment.estado);
  const canComplete = appointment.estado === 'confirmada' && ['practicante', 'maestro', 'admin'].includes(userRole);
  const canNoShow = appointment.estado === 'confirmada' && ['practicante', 'maestro', 'admin'].includes(userRole);

  // Verificar si la cita es próxima (dentro de 24 horas)
  const isUpcoming = () => {
    const citaDate = new Date(appointment.fecha_hora);
    const now = new Date();
    const diffHours = (citaDate - now) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24;
  };

  return (
    <div 
      className={`
        bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200
        border-l-4 overflow-hidden
        ${appointment.estado === 'pendiente' ? 'border-l-amber-500' : ''}
        ${appointment.estado === 'confirmada' ? 'border-l-blue-500' : ''}
        ${appointment.estado === 'completada' ? 'border-l-green-500' : ''}
        ${appointment.estado === 'cancelada' ? 'border-l-red-500' : ''}
        ${appointment.estado === 'no_asistio' ? 'border-l-gray-500' : ''}
        ${isUpcoming() && appointment.estado === 'confirmada' ? 'ring-2 ring-amber-300' : ''}
      `}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{dateStr}</p>
              <p className="text-xs text-gray-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeStr} ({appointment.duracion_minutos} min)
              </p>
            </div>
          </div>
          
          <Badge 
            text={appointment.estado === 'no_asistio' ? 'No Asistió' : appointment.estado.charAt(0).toUpperCase() + appointment.estado.slice(1)}
            variant={APPOINTMENT_ESTADO_COLORS[appointment.estado]}
            size="sm"
          />
        </div>

        {/* Alerta de cita próxima */}
        {isUpcoming() && appointment.estado === 'confirmada' && (
          <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800 font-medium">
              ⏰ Cita próxima - ¡No olvides asistir!
            </p>
          </div>
        )}

        {/* Información según rol */}
        <div className="space-y-2 mb-3">
          {/* Para practicante: mostrar paciente */}
          {userRole === 'practicante' && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">
                <span className="font-medium">Paciente:</span> {appointment.paciente_nombre}
              </span>
            </div>
          )}

          {/* Para paciente: mostrar practicante */}
          {userRole === 'paciente' && (
            <div className="flex items-center gap-2 text-sm">
              <Stethoscope className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">
                <span className="font-medium">Practicante:</span> {appointment.practicante_nombre}
              </span>
            </div>
          )}

          {/* Para maestro/admin: mostrar ambos */}
          {['maestro', 'admin'].includes(userRole) && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <Stethoscope className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">
                  <span className="font-medium">Practicante:</span> {appointment.practicante_nombre}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">
                  <span className="font-medium">Paciente:</span> {appointment.paciente_nombre}
                </span>
              </div>
            </>
          )}

          {/* Motivo de consulta */}
          <div className="flex items-start gap-2 text-sm">
            <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
            <span className="text-gray-700">
              <span className="font-medium">Motivo:</span> {appointment.motivo_consulta}
            </span>
          </div>

          {/* Práctica asociada */}
          {appointment.practica_nombre && (
            <div className="text-xs text-gray-500 mt-1">
              Práctica: {appointment.practica_nombre}
            </div>
          )}

          {/* Calificación (si existe) */}
          {appointment.calificacion_servicio && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-gray-700 font-medium">
                {appointment.calificacion_servicio}/5
              </span>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/citas/${appointment.id}`)}
            className="flex-1 min-w-[100px]"
          >
            Ver Detalles
          </Button>

          {canConfirm && (
            <Button
              variant="success"
              size="sm"
              onClick={() => onConfirm(appointment.id)}
              className="flex-1 min-w-[100px]"
            >
              ✓ Confirmar
            </Button>
          )}

          {canComplete && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onComplete(appointment.id)}
              className="flex-1 min-w-[100px]"
            >
              ✓ Completar
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(appointment.id)}
              className="flex-1 min-w-[100px] text-red-600 border-red-300 hover:bg-red-50"
            >
              ✕ Cancelar
            </Button>
          )}

          {canNoShow && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNoShow(appointment.id)}
              className="flex-1 min-w-[100px] text-gray-600"
            >
              No Asistió
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;