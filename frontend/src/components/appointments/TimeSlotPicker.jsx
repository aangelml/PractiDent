import { useState, useEffect } from 'react';
import { Calendar, Clock, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import appointmentService from '../../services/appointmentService';

const TimeSlotPicker = ({
  practicanteId,
  practicaId = 1, // ⭐ VALOR POR DEFECTO
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  disabled = false
}) => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar horarios cuando cambien practicante o fecha
  useEffect(() => {
    if (practicanteId && selectedDate) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [practicanteId, selectedDate]);

  const loadAvailableSlots = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('🔍 Cargando horarios para:', {
        practicante_id: practicanteId,
        practica_id: practicaId, // ⭐ INCLUIR ESTO
        fecha: selectedDate
      });

      const result = await appointmentService.getAvailableSlots(
        practicanteId,
        selectedDate,
        practicaId // ⭐ AGREGAR ESTE PARÁMETRO
      );

      console.log('✅ Resultado horarios:', result);

      if (result.success) {
        setAvailableSlots(result.data || []);
        
        if (!result.data || result.data.length === 0) {
          setError('No hay horarios disponibles para esta fecha');
        }
      } else {
        setError(result.message || 'Error al cargar horarios');
        setAvailableSlots([]);
      }
    } catch (err) {
      console.error('❌ Error cargando horarios:', err);
      setError('Error al cargar horarios disponibles');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSelect = (time) => {
    if (!disabled) {
      onTimeChange(time);
    }
  };

  const handleRefresh = () => {
    if (practicanteId && selectedDate) {
      loadAvailableSlots();
    }
  };

  // Obtener fecha mínima (mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      {/* Selector de Fecha */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Fecha de la cita
        </label>
        <input
          type="date"
          value={selectedDate || ''}
          onChange={(e) => onDateChange(e.target.value)}
          min={minDate}
          disabled={disabled || !practicanteId}
          className="block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg
                     focus:ring-2 focus:ring-amber-500 focus:border-transparent
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     transition-colors duration-200"
        />
        <p className="mt-1 text-xs text-gray-500">
          Selecciona una fecha con al menos 24 horas de anticipación
        </p>
      </div>

      {/* Horarios Disponibles */}
      {selectedDate && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horario disponible
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || disabled}
              className="text-amber-600 hover:text-amber-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {error && (
            <Alert type="error" className="mb-3">
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Cargando horarios...
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => handleTimeSelect(slot)}
                  disabled={disabled}
                  className={`
                    px-4 py-2.5 rounded-lg border-2 font-medium text-sm
                    transition-all duration-200
                    ${selectedTime === slot
                      ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-amber-400 hover:bg-amber-50'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No hay horarios disponibles</p>
              <p className="text-xs mt-1">Intenta con otra fecha</p>
            </div>
          )}
        </div>
      )}

      {!selectedDate && practicanteId && (
        <Alert type="info">
          Selecciona una fecha para ver los horarios disponibles
        </Alert>
      )}
    </div>
  );
};

export default TimeSlotPicker;