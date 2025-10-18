import { useForm } from 'react-hook-form';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { USER_TYPES, ESTADOS, PASSWORD_REGEX, PHONE_REGEX } from '../../utils/constants';
import toast from 'react-hot-toast';

const UserForm = ({ 
  initialData = null, 
  onSubmit, 
  loading = false,
  isEdit = false 
}) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: initialData || {
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      tipo_usuario: '',
      estado: 'activo',
      password: '',
      password_confirm: ''
    }
  });

  const password = watch('password');

  const estadoOptions = Object.entries(ESTADOS).map(([key, value]) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1)
  }));

  const handleFormSubmit = async (data) => {
    if (!isEdit && !data.password) {
      toast.error('La contraseña es requerida');
      return;
    }

    if (data.password && data.password !== data.password_confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    const submitData = {
      nombre: data.nombre,
      apellido: data.apellido,
      telefono: data.telefono,
      tipo_usuario: data.tipo_usuario,
      estado: data.estado
    };

    if (!isEdit && data.email) {
      submitData.email = data.email;
    }

    if (data.password) {
      submitData.password = data.password;
    }

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nombre"
          placeholder="Juan"
          error={errors.nombre?.message}
          required
          {...register('nombre', {
            required: 'El nombre es requerido',
            minLength: { value: 2, message: 'Minimo 2 caracteres' }
          })}
        />

        <Input
          label="Apellido"
          placeholder="Perez"
          error={errors.apellido?.message}
          required
          {...register('apellido', {
            required: 'El apellido es requerido',
            minLength: { value: 2, message: 'Minimo 2 caracteres' }
          })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!isEdit ? (
          <Input
            label="Email"
            type="email"
            placeholder="juan@example.com"
            error={errors.email?.message}
            required
            {...register('email', {
              required: 'El email es requerido',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Email invalido'
              }
            })}
          />
        ) : (
          <Input
            label="Email"
            type="email"
            placeholder="juan@example.com"
            disabled
            value={initialData?.email || ''}
            helper="No se puede editar el email"
          />
        )}

        <Input
          label="Telefono"
          placeholder="1234567890"
          error={errors.telefono?.message}
          {...register('telefono', {
            pattern: {
              value: PHONE_REGEX,
              message: 'Telefono debe tener 10 digitos'
            }
          })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Tipo de Usuario"
          placeholder="Selecciona un tipo"
          options={USER_TYPES}
          error={errors.tipo_usuario?.message}
          required
          disabled={isEdit}
          {...register('tipo_usuario', {
            required: 'El tipo de usuario es requerido'
          })}
        />

        <Select
          label="Estado"
          options={estadoOptions}
          {...register('estado')}
        />
      </div>

      {!isEdit ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            required
            helper="Minimo 8 caracteres, 1 mayuscula, 1 minuscula, 1 numero, 1 especial"
            {...register('password', {
              required: 'La contraseña es requerida',
              minLength: { value: 8, message: 'Minimo 8 caracteres' },
              pattern: {
                value: PASSWORD_REGEX,
                message: 'Debe incluir mayusculas, minusculas, numeros y caracteres especiales'
              }
            })}
          />

          <Input
            label="Confirmar Contraseña"
            type="password"
            placeholder="••••••••"
            error={errors.password_confirm?.message}
            required
            {...register('password_confirm', {
              required: 'Debe confirmar la contraseña',
              validate: (value) =>
                value === password || 'Las contraseñas no coinciden'
            })}
          />
        </div>
      ) : (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Para cambiar la contraseña, contacta al usuario o usa la funcion de "Restablecer contraseña"
          </p>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4">
        <Button
          variant="ghost"
          type="button"
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          type="submit"
          loading={loading}
        >
          {isEdit ? 'Actualizar Usuario' : 'Crear Usuario'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;