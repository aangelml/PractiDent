import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import Loader from '../ui/Loader';
import TimeSlotPicker from './TimeSlotPicker';
import { 
  APPOINTMENT_DURACIONES, 
  MOTIVOS_CONSULTA
} from '../../utils/constants';
import userService from '../../services/userService';

const AppointmentForm = ({ 
  initialData = null, 
  onSubmit, 
  loading = false,
  userRole,
  currentUserId
}) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: initialData || {
      paciente_id: '',
      practicante_id: '',
      practica_id: 1, // Por defecto práctica 1
      fecha: '',
      hora: '',
      duracion_minutos: 60,
      motivo_consulta: '',
      observaciones_paciente: ''
    }
  });

  const [practicantes, setPracticantes] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [practicas, setPracticas] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  // Obtener valores actuales del formulario
  const practicanteId = watch('practicante_id');
  const selectedDate = watch('fecha');
  const selectedTime = watch('hora');

  // Cargar practicantes, pacientes y prácticas
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoadingData(true);
    setError('');
    
    try {
      console.log('📄 Cargando datos del formulario...');

      // 1. Cargar practicantes
      console.log('📥 Cargando practicantes...');
      const practicantesResult = await userService.getPracticantes();
      console.log('✅ Resultado practicantes:', practicantesResult);
      
      if (practicantesResult.success && Array.isArray(practicantesResult.data)) {
        console.log(`✅ ${practicantesResult.data.length} practicantes cargados`);
        setPracticantes(practicantesResult.data);
        
        if (practicantesResult.data.length === 0) {
          setError('⚠️ No hay practicantes disponibles. Por favor contacta al administrador.');
        }
      } else {
        console.error('❌ Practicantes no es un array:', practicantesResult);
        setError('⚠️ Error al cargar practicantes.');
        setPracticantes([]);
      }

      // 2. Cargar pacientes (solo si no es paciente)
      if (['admin', 'maestro', 'practicante'].includes(userRole)) {
        console.log('📥 Cargando pacientes...');
        const pacientesResult = await userService.getPacientes();
        console.log('✅ Resultado pacientes:', pacientesResult);
        
        if (pacientesResult.success && Array.isArray(pacientesResult.data)) {
          console.log(`✅ ${pacientesResult.data.length} pacientes cargados`);
          setPacientes(pacientesResult.data);
        } else {
          console.error('❌ Pacientes no es un array:', pacientesResult);
          setPacientes([]);
        }
      }

      // 3. Cargar prácticas (simplificado - usar práctica ID 1 por defecto)
      console.log('✅ Usando práctica por defecto');
      
    } catch (err) {
      console.error('❌ Error al cargar datos:', err);
      setError(`❌ Error: ${err.message}`);
      setPracticantes([]);
      setPacientes([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Si es paciente, pre-seleccionar su ID
  useEffect(() => {
    if (userRole === 'paciente' && currentUserId) {
      console.log('👤 Pre-seleccionando paciente ID:', currentUserId);
      setValue('paciente_id', String(currentUserId));
    }
  }, [userRole, currentUserId, setValue]);

  // Si es practicante, pre-seleccionar su ID
  useEffect(() => {
    if (userRole === 'practicante' && currentUserId) {
      console.log('🩺 Pre-seleccionando practicante ID:', currentUserId);
      setValue('practicante_id', String(currentUserId));
    }
  }, [userRole, currentUserId, setValue]);

  const handleFormSubmit = (data) => {
    console.log('📤 Enviando formulario:', data);

    // Validar que haya fecha y hora
    if (!data.fecha || !data.hora) {
      setError('Por favor selecciona fecha y hora');
      return;
    }

    // Validar que haya practicante
    if (!data.practicante_id) {
      setError('Por favor selecciona un practicante');
      return;
    }

    // Combinar fecha y hora
    const fechaHora = `${data.fecha}T${data.hora}:00`;
    
    // ⭐ CAMBIO CRÍTICO: Sin observaciones_paciente
    const appointmentData = {
      paciente_id: parseInt(data.paciente_id),
      practicante_id: parseInt(data.practicante_id),
      practica_id: parseInt(data.practica_id),
      fecha_hora: fechaHora,
      duracion_minutos: parseInt(data.duracion_minutos),
      motivo_consulta: data.motivo_consulta
      // observaciones_paciente eliminado - columna no existe en BD
    };

    console.log('✅ Datos procesados (sin observaciones_paciente):', appointmentData);

    onSubmit(appointmentData);
  };

  const isEditMode = !!initialData;

  if (loadingData) {
    return <Loader text="Cargando datos del formulario..." />;
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {error && (
        <Alert type="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Debug Info (temporal) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-3 rounded text-xs">
          <p><strong>Debug:</strong></p>
          <p>Rol: {userRole}</p>
          <p>Usuario ID: {currentUserId}</p>
          <p>Practicantes disponibles: {practicantes.length}</p>
          <p>Pacientes disponibles: {pacientes.length}</p>
        </div>
      )}

      {/* Selección de Practicante */}
      {userRole !== 'practicante' && (
        <div>
          <Select
            label="Practicante"
            placeholder="Selecciona un practicante"
            options={practicantes
              .filter(p => p.id !== currentUserId) // ⭐ Excluir usuario actual
              .map(p => ({
                value: p.id,
                label: `${p.nombre} ${p.apellido}${p.matricula ? ' - ' + p.matricula : ''}`
              }))}
            {...register('practicante_id', { 
              required: 'El practicante es requerido' 
            })}
            error={errors.practicante_id?.message}
            required
            disabled={loading || isEditMode || practicantes.length === 0}
          />
          {practicantes.filter(p => p.id !== currentUserId).length === 0 && (
            <p className="mt-2 text-sm text-red-600">
              ⚠️ No hay practicantes disponibles
            </p>
          )}
        </div>
      )}

      {/* Selección de Paciente */}
      {userRole !== 'paciente' && (
        <Select
          label="Paciente"
          placeholder="Selecciona un paciente"
          options={pacientes.map(p => ({
            value: p.id,
            label: `${p.nombre} ${p.apellido} - ${p.email}`
          }))}
          {...register('paciente_id', { 
            required: 'El paciente es requerido' 
          })}
          error={errors.paciente_id?.message}
          required
          disabled={loading || isEditMode || pacientes.length === 0}
        />
      )}

      {/* Selector de Fecha y Hora */}
      {practicantes.length > 0 && practicanteId && (
        <TimeSlotPicker
          practicanteId={practicanteId}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onDateChange={(date) => setValue('fecha', date)}
          onTimeChange={(time) => setValue('hora', time)}
          disabled={loading || isEditMode}
        />
      )}

      {!practicanteId && practicantes.length > 0 && userRole === 'paciente' && (
        <Alert type="info">
          Por favor selecciona un practicante para ver los horarios disponibles.
        </Alert>
      )}

      {/* Duración */}
      <Select
        label="Duración"
        placeholder="Selecciona la duración"
        options={APPOINTMENT_DURACIONES}
        {...register('duracion_minutos', { 
          required: 'La duración es requerida' 
        })}
        error={errors.duracion_minutos?.message}
        required
        disabled={loading}
      />

      {/* Motivo de Consulta */}
      <Select
        label="Motivo de Consulta"
        placeholder="Selecciona el motivo"
        options={MOTIVOS_CONSULTA}
        {...register('motivo_consulta', { 
          required: 'El motivo es requerido' 
        })}
        error={errors.motivo_consulta?.message}
        required
        disabled={loading}
      />

      {/* Observaciones del Paciente - MANTENER EN UI PERO NO ENVIAR */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Observaciones o Comentarios
          <span className="text-xs text-gray-500 ml-2">(Opcional - solo para referencia)</span>
        </label>
        <textarea
          {...register('observaciones_paciente')}
          rows={4}
          className="block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg
                     focus:ring-2 focus:ring-amber-500 focus:border-transparent
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     transition-colors duration-200"
          placeholder="Describe cualquier síntoma o información relevante..."
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          Nota: Este campo es para tu referencia. La información principal debe ir en "Motivo de Consulta".
        </p>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading || !selectedDate || !selectedTime || practicantes.length === 0}
          fullWidth
          className="bg-amber-500 hover:bg-amber-600"
        >
          {isEditMode ? 'Actualizar Cita' : 'Agendar Cita'}
        </Button>
      </div>

      {/* Nota informativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Nota:</span> La cita quedará en estado "Pendiente" hasta que el practicante la confirme.
        </p>
      </div>
    </form>
  );
};

export default AppointmentForm;