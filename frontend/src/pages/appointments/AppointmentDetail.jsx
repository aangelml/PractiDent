import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, ArrowLeft, CheckCircle, XCircle, Clock, User, 
  Stethoscope, FileText, Star, AlertTriangle 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import appointmentService from '../../services/appointmentService';
import { useAuth } from '../../hooks/useAuth';
import { APPOINTMENT_ESTADO_COLORS, CALIFICACIONES } from '../../utils/constants';

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userRole, user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modales
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  // Datos para completar cita
  const [completionData, setCompletionData] = useState({
    diagnostico: '',
    tratamiento_realizado: '',
    observaciones_practicante: '',
    notas_maestro: ''
  });

  // Calificación
  const [rating, setRating] = useState(0);

  useEffect(() => {
    loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    setLoading(true);
    try {
      const result = await appointmentService.getById(id);
      if (result.success) {
        setAppointment(result.data);
        
        // Pre-cargar datos si ya existen
        if (result.data.diagnostico || result.data.tratamiento_realizado) {
          setCompletionData({
            diagnostico: result.data.diagnostico || '',
            tratamiento_realizado: result.data.tratamiento_realizado || '',
            observaciones_practicante: result.data.observaciones_practicante || '',
            notas_maestro: result.data.notas_maestro || ''
          });
        }
      } else {
        toast.error(result.message);
        navigate(-1);
      }
    } catch (error) {
      toast.error('Error al cargar cita');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  // Acciones de cita
  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      const result = await appointmentService.confirm(id);
      if (result.success) {
        toast.success(result.message);
        loadAppointment();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al confirmar cita');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const result = await appointmentService.cancel(id, 'Cancelada por el usuario');
      if (result.success) {
        toast.success(result.message);
        setShowCancelModal(false);
        loadAppointment();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al cancelar cita');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!completionData.diagnostico || !completionData.tratamiento_realizado) {
      toast.error('El diagnóstico y tratamiento son requeridos');
      return;
    }

    setActionLoading(true);
    try {
      const result = await appointmentService.complete(id, completionData);
      if (result.success) {
        toast.success(result.message);
        setShowCompleteModal(false);
        loadAppointment();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al completar cita');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoShow = async () => {
    setActionLoading(true);
    try {
      const result = await appointmentService.noShow(id);
      if (result.success) {
        toast.success(result.message);
        loadAppointment();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al marcar como no asistió');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRating = async () => {
    if (rating === 0) {
      toast.error('Selecciona una calificación');
      return;
    }

    setActionLoading(true);
    try {
      const result = await appointmentService.update(id, {
        calificacion_servicio: rating
      });
      if (result.success) {
        toast.success('¡Gracias por tu calificación!');
        setShowRatingModal(false);
        loadAppointment();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Error al calificar');
    } finally {
      setActionLoading(false);
    }
  };

  // Formatear fecha y hora
  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('es-MX', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  // Verificar permisos
  const canConfirm = appointment?.estado === 'pendiente' && ['practicante', 'maestro', 'admin'].includes(userRole);
  const canCancel = ['pendiente', 'confirmada'].includes(appointment?.estado);
  const canComplete = appointment?.estado === 'confirmada' && ['practicante', 'maestro', 'admin'].includes(userRole);
  const canNoShow = appointment?.estado === 'confirmada' && ['practicante', 'maestro', 'admin'].includes(userRole);
  const canRate = appointment?.estado === 'completada' && userRole === 'paciente' && !appointment?.calificacion_servicio;

  if (loading) {
    return <Loader fullScreen text="Cargando cita..." />;
  }

  if (!appointment) {
    return (
      <Alert type="error">
        No se encontró la cita solicitada.
      </Alert>
    );
  }

  const { date, time } = formatDateTime(appointment.fecha_hora);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-amber-500" />
              Detalle de Cita
            </h1>
            <p className="text-gray-600 mt-1">
              #{appointment.id} - {date}
            </p>
          </div>
        </div>

        <Badge 
          text={appointment.estado === 'no_asistio' ? 'No Asistió' : appointment.estado.charAt(0).toUpperCase() + appointment.estado.slice(1)}
          variant={APPOINTMENT_ESTADO_COLORS[appointment.estado]}
          size="lg"
        />
      </div>

      {/* Alertas según estado */}
      {appointment.estado === 'pendiente' && userRole === 'practicante' && (
        <Alert type="warning" title="Acción Requerida">
          Esta cita está pendiente de confirmación. Por favor, confirma o rechaza la cita.
        </Alert>
      )}

      {appointment.estado === 'confirmada' && (
        <Alert type="info" title="Cita Confirmada">
          La cita ha sido confirmada. No olvides asistir a la hora programada.
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detalles de la Cita */}
          <Card title="Información de la Cita">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-amber-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-semibold text-gray-900">{date}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Hora</p>
                  <p className="font-semibold text-gray-900">{time}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Stethoscope className="w-5 h-5 text-amber-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Practicante</p>
                  <p className="font-semibold text-gray-900">{appointment.practicante_nombre}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-amber-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Paciente</p>
                  <p className="font-semibold text-gray-900">{appointment.paciente_nombre}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 md:col-span-2">
                <FileText className="w-5 h-5 text-amber-500 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Motivo de Consulta</p>
                  <p className="font-semibold text-gray-900">{appointment.motivo_consulta}</p>
                </div>
              </div>

              {appointment.observaciones_paciente && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Observaciones del Paciente</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {appointment.observaciones_paciente}
                  </p>
                </div>
              )}

              {appointment.practica_nombre && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Práctica Asociada</p>
                  <p className="font-semibold text-gray-900">{appointment.practica_nombre}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Diagnóstico y Tratamiento (solo si está completada) */}
          {appointment.estado === 'completada' && (
            <Card title="Diagnóstico y Tratamiento">
              <div className="space-y-4">
                {appointment.diagnostico && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Diagnóstico</p>
                    <p className="text-gray-900 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      {appointment.diagnostico}
                    </p>
                  </div>
                )}

                {appointment.tratamiento_realizado && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Tratamiento Realizado</p>
                    <p className="text-gray-900 bg-green-50 p-3 rounded-lg border border-green-200">
                      {appointment.tratamiento_realizado}
                    </p>
                  </div>
                )}

                {appointment.observaciones_practicante && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Observaciones del Practicante</p>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      {appointment.observaciones_practicante}
                    </p>
                  </div>
                )}

                {appointment.notas_maestro && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Notas del Maestro</p>
                    <p className="text-gray-900 bg-purple-50 p-3 rounded-lg border border-purple-200">
                      {appointment.notas_maestro}
                    </p>
                  </div>
                )}

                {appointment.calificacion_servicio && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Calificación del Servicio</p>
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${
                            i < appointment.calificacion_servicio
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-gray-700 font-semibold ml-2">
                        {appointment.calificacion_servicio}/5
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Panel de Acciones */}
        <div className="space-y-6">
          <Card title="Acciones">
            <div className="space-y-3">
              {canConfirm && (
                <Button
                  variant="success"
                  fullWidth
                  onClick={handleConfirm}
                  loading={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirmar Cita
                </Button>
              )}

              {canComplete && (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => setShowCompleteModal(true)}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Completar Cita
                </Button>
              )}

              {canCancel && (
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => setShowCancelModal(true)}
                  loading={actionLoading}
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Cancelar Cita
                </Button>
              )}

              {canNoShow && (
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleNoShow}
                  loading={actionLoading}
                  className="text-gray-600 border-gray-300"
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Marcar No Asistió
                </Button>
              )}

              {canRate && (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => setShowRatingModal(true)}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Star className="w-5 h-5 mr-2" />
                  Calificar Servicio
                </Button>
              )}
            </div>
          </Card>

          {/* Información Adicional */}
          <Card title="Información Adicional">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Duración:</span>
                <span className="font-semibold">{appointment.duracion_minutos} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Creada:</span>
                <span className="font-semibold">
                  {new Date(appointment.created_at).toLocaleDateString('es-MX')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Última actualización:</span>
                <span className="font-semibold">
                  {new Date(appointment.updated_at).toLocaleDateString('es-MX')}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Cancelar */}
      <Modal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancelar Cita"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>
              Cerrar
            </Button>
            <Button variant="danger" onClick={handleCancel} loading={actionLoading}>
              Confirmar Cancelación
            </Button>
          </>
        }
      >
        <p className="text-gray-700">
          ¿Estás seguro de cancelar esta cita? Esta acción no se puede deshacer.
        </p>
      </Modal>

      {/* Modal Completar */}
      <Modal
        open={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Completar Cita"
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCompleteModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleComplete} 
              loading={actionLoading}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Guardar y Completar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Diagnóstico <span className="text-red-500">*</span>
            </label>
            <textarea
              value={completionData.diagnostico}
              onChange={(e) => setCompletionData(prev => ({ ...prev, diagnostico: e.target.value }))}
              rows={3}
              className="block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg"
              placeholder="Describe el diagnóstico..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tratamiento Realizado <span className="text-red-500">*</span>
            </label>
            <textarea
              value={completionData.tratamiento_realizado}
              onChange={(e) => setCompletionData(prev => ({ ...prev, tratamiento_realizado: e.target.value }))}
              rows={3}
              className="block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg"
              placeholder="Describe el tratamiento..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Observaciones Adicionales
            </label>
            <textarea
              value={completionData.observaciones_practicante}
              onChange={(e) => setCompletionData(prev => ({ ...prev, observaciones_practicante: e.target.value }))}
              rows={2}
              className="block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg"
              placeholder="Observaciones opcionales..."
            />
          </div>

          {['maestro', 'admin'].includes(userRole) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notas del Maestro
              </label>
              <textarea
                value={completionData.notas_maestro}
                onChange={(e) => setCompletionData(prev => ({ ...prev, notas_maestro: e.target.value }))}
                rows={2}
                className="block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg"
                placeholder="Notas de supervisión..."
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Calificar */}
      <Modal
        open={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title="Calificar Servicio"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowRatingModal(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              onClick={handleRating} 
              loading={actionLoading}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Enviar Calificación
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Qué te pareció el servicio recibido?
          </p>
          
          <div className="flex justify-center gap-3 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= rating
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-gray-300 hover:text-amber-300'
                  }`}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="text-center text-gray-600">
              {CALIFICACIONES.find(c => c.value === rating)?.label}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AppointmentDetail;