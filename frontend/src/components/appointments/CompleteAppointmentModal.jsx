// frontend/src/components/appointments/CompleteAppointmentModal.jsx
import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';

const CompleteAppointmentModal = ({ open, onClose, appointmentId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tratamiento_realizado: '',
    notas: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tratamiento_realizado.trim()) {
      toast.error('El tratamiento realizado es requerido');
      return;
    }

    setLoading(true);
    try {
      // Llamar al servicio
      const appointmentService = (await import('../../services/appointmentService')).default;
      const result = await appointmentService.complete(appointmentId, formData);

      if (result.success) {
        toast.success(result.message || 'Cita completada exitosamente');
        onSuccess();
        onClose();
        setFormData({ tratamiento_realizado: '', notas: '' });
      } else {
        toast.error(result.message || 'Error al completar cita');
      }
    } catch (error) {
      console.error('Error completando cita:', error);
      toast.error('Error inesperado al completar cita');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Completar Cita"
      subtitle="Ingresa los detalles del tratamiento realizado"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="success"
            onClick={handleSubmit}
            loading={loading}
          >
            Completar Cita
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tratamiento Realizado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tratamiento Realizado <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.tratamiento_realizado}
            onChange={(e) => handleChange('tratamiento_realizado', e.target.value)}
            rows={4}
            className="block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-amber-500 focus:border-transparent
                       disabled:bg-gray-100 disabled:cursor-not-allowed
                       transition-colors duration-200"
            placeholder="Describe el tratamiento que realizaste..."
            required
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            Describe brevemente el procedimiento realizado
          </p>
        </div>

        {/* Notas Adicionales */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Notas Adicionales (Opcional)
          </label>
          <textarea
            value={formData.notas}
            onChange={(e) => handleChange('notas', e.target.value)}
            rows={3}
            className="block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-amber-500 focus:border-transparent
                       disabled:bg-gray-100 disabled:cursor-not-allowed
                       transition-colors duration-200"
            placeholder="Observaciones, recomendaciones o próximos pasos..."
            disabled={loading}
          />
        </div>

        {/* Información */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Nota:</strong> Al completar la cita, el estado cambiará a "Completada" y el paciente podrá calificar el servicio.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default CompleteAppointmentModal;