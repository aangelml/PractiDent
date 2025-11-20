import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AppointmentForm from '../../components/appointments/AppointmentForm';
import appointmentService from '../../services/appointmentService';
import { useAuth } from '../../hooks/useAuth';

const CreateAppointment = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(false);

  console.log('CreateAppointment - User:', user); // DEBUG
  console.log('CreateAppointment - UserRole:', userRole); // DEBUG

  const handleSubmit = async (appointmentData) => {
    console.log('Enviando datos de cita:', appointmentData); // DEBUG
    setLoading(true);

    try {
      const result = await appointmentService.create(appointmentData);

      console.log('Resultado de crear cita:', result); // DEBUG

      if (result.success) {
        toast.success(result.message || 'Cita agendada exitosamente');
        
        // Redirigir según el rol
        if (userRole === 'paciente') {
          navigate('/mis-citas');
        } else {
          navigate('/citas');
        }
      } else {
        toast.error(result.message || 'Error al agendar cita');
        
        // Mostrar errores de validación si existen
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(error => {
            toast.error(error.msg || error.message);
          });
        }
      }
    } catch (error) {
      console.error('Error al crear cita:', error);
      toast.error('Error inesperado al agendar cita');
    } finally {
      setLoading(false);
    }
  };

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
              Agendar Nueva Cita
            </h1>
            <p className="text-gray-600 mt-1">
              Completa el formulario para solicitar una cita
            </p>
          </div>
        </div>
      </div>

      {/* Debug info */}
      {!user && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">⚠️ ERROR: Usuario no detectado. Por favor recarga la página o inicia sesión nuevamente.</p>
        </div>
      )}

      {/* Formulario */}
      <div className="max-w-3xl">
        <Card>
          <AppointmentForm
            onSubmit={handleSubmit}
            loading={loading}
            userRole={userRole}
            currentUserId={user?.id || user?.user_id}
          />
        </Card>
      </div>

      {/* Información adicional */}
      <div className="max-w-3xl space-y-4">
        <Card
          title="Información Importante"
          className="bg-amber-50 border-amber-200"
        >
          <div className="space-y-2 text-sm text-gray-700">
            <p className="flex items-start gap-2">
              <span className="font-semibold text-amber-700">📅</span>
              <span>Las citas se agendan con un mínimo de 24 horas de anticipación.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-semibold text-amber-700">⏰</span>
              <span>El practicante debe confirmar tu cita. Recibirás notificación cuando esto ocurra.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-semibold text-amber-700">🔔</span>
              <span>Si necesitas cancelar, hazlo con al menos 12 horas de anticipación.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-semibold text-amber-700">📝</span>
              <span>Procura llegar 10 minutos antes de tu cita programada.</span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreateAppointment;