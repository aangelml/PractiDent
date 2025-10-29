import { useForm } from 'react-hook-form';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { 
  PRACTICE_TIPOS, 
  PRACTICE_ESTADOS_OPTIONS, 
  PRACTICE_NIVELES 
} from '../../utils/constants';
import toast from 'react-hot-toast';

const PracticeForm = ({ 
  initialData = null, 
  onSubmit, 
  loading = false,
  isEdit = false,
  onCancel
}) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: initialData || {
      nombre: '',
      descripcion: '',
      requisitos: '',
      tipo_practica: '',
      duracion_estimada_horas: 1,
      cupo_maximo: 10,
      fecha_inicio: '',
      fecha_fin: '',
      estado: 'activa',
      nivel_dificultad: 'basico'
    }
  });

  const fecha_inicio = watch('fecha_inicio');

  const handleFormSubmit = async (data) => {
    // Validación de fechas
    if (data.fecha_inicio && data.fecha_fin) {
      const inicio = new Date(data.fecha_inicio);
      const fin = new Date(data.fecha_fin);
      
      if (fin <= inicio) {
        toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }
    }

    // Validación de cupos
    if (data.cupo_maximo < 1) {
      toast.error('El cupo máximo debe ser al menos 1');
      return;
    }

    // Validación de duración
    if (data.duracion_estimada_horas < 0.5) {
      toast.error('La duración debe ser al menos 0.5 horas');
      return;
    }

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Información Básica */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
        
        <Input
          label="Nombre de la Práctica"
          placeholder="Ej: Limpieza Dental Básica"
          error={errors.nombre?.message}
          required
          {...register('nombre', {
            required: 'El nombre es requerido',
            minLength: { value: 3, message: 'Mínimo 3 caracteres' }
          })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Tipo de Práctica"
            placeholder="Selecciona un tipo"
            options={PRACTICE_TIPOS}
            error={errors.tipo_practica?.message}
            required
            {...register('tipo_practica', {
              required: 'El tipo de práctica es requerido'
            })}
          />

          <Select
            label="Nivel de Dificultad"
            options={PRACTICE_NIVELES}
            error={errors.nivel_dificultad?.message}
            required
            {...register('nivel_dificultad', {
              required: 'El nivel es requerido'
            })}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Descripción <span className="text-red-500">*</span>
          </label>
          <textarea
            rows="3"
            placeholder="Describe la práctica odontológica..."
            className={`block w-full px-4 py-2.5 text-gray-900 bg-white border rounded-lg
              focus:ring-2 focus:ring-primary focus:border-transparent
              transition-colors duration-200
              ${errors.descripcion ? 'border-red-500' : 'border-gray-300'}`}
            {...register('descripcion', {
              required: 'La descripción es requerida',
              minLength: { value: 10, message: 'Mínimo 10 caracteres' }
            })}
          />
          {errors.descripcion && (
            <p className="text-sm text-red-600">{errors.descripcion.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Requisitos
          </label>
          <textarea
            rows="2"
            placeholder="Ej: Haber completado módulo 1"
            className="block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-lg
              focus:ring-2 focus:ring-primary focus:border-transparent
              transition-colors duration-200"
            {...register('requisitos')}
          />
        </div>
      </div>

      {/* Configuración */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Duración Estimada (horas)"
            type="number"
            step="0.5"
            min="0.5"
            placeholder="2"
            error={errors.duracion_estimada_horas?.message}
            required
            {...register('duracion_estimada_horas', {
              required: 'La duración es requerida',
              min: { value: 0.5, message: 'Mínimo 0.5 horas' },
              valueAsNumber: true
            })}
          />

          <Input
            label="Cupo Máximo"
            type="number"
            min="1"
            placeholder="10"
            error={errors.cupo_maximo?.message}
            required
            {...register('cupo_maximo', {
              required: 'El cupo es requerido',
              min: { value: 1, message: 'Mínimo 1 cupo' },
              valueAsNumber: true
            })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Fecha de Inicio"
            type="date"
            error={errors.fecha_inicio?.message}
            required
            {...register('fecha_inicio', {
              required: 'La fecha de inicio es requerida'
            })}
          />

          <Input
            label="Fecha de Fin"
            type="date"
            min={fecha_inicio}
            error={errors.fecha_fin?.message}
            required
            {...register('fecha_fin', {
              required: 'La fecha de fin es requerida'
            })}
          />
        </div>

        {isEdit && (
          <Select
            label="Estado"
            options={PRACTICE_ESTADOS_OPTIONS}
            {...register('estado')}
          />
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <Button
          variant="ghost"
          type="button"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          type="submit"
          loading={loading}
        >
          {isEdit ? 'Actualizar Práctica' : 'Crear Práctica'}
        </Button>
      </div>
    </form>
  );
};

export default PracticeForm;