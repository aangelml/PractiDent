import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import UserForm from '../../components/users/UserForm';
import userService from '../../services/userService';

const CreateUser = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      const result = await userService.create(formData);

      if (result.success) {
        toast.success(result.message || 'Usuario creado exitosamente');
        navigate('/usuarios');
      } else {
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach(error => {
            toast.error(error.message);
          });
        } else {
          toast.error(result.message || 'Error al crear usuario');
        }
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Error al crear usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/usuarios')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Usuario</h1>
          <p className="mt-1 text-gray-600">Completa el formulario para crear un nuevo usuario</p>
        </div>
      </div>

      <Card
        title="Informacion del Usuario"
        subtitle="Ingresa los datos del nuevo usuario"
      >
        <UserForm
          onSubmit={handleSubmit}
          loading={loading}
          isEdit={false}
        />
      </Card>

      <Card className="bg-blue-50 border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Informacion importante:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• El email debe ser unico en el sistema</li>
          <li>• La contraseña debe cumplir los requisitos de seguridad</li>
          <li>• El usuario tendra estado "activo" por defecto</li>
          <li>• El tipo de usuario determina los permisos y acceso</li>
        </ul>
      </Card>
    </div>
  );
};

export default CreateUser;