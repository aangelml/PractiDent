import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import UserForm from '../../components/users/UserForm';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import userService from '../../services/userService';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const result = await userService.getById(id);

      if (result.success) {
        setUser(result.data);
      } else {
        toast.error(result.message || 'Error al cargar usuario');
        navigate('/usuarios');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Error al cargar usuario');
      navigate('/usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setUpdating(true);
      const result = await userService.update(id, formData);

      if (result.success) {
        toast.success(result.message || 'Usuario actualizado exitosamente');
        setUser(result.data);
        loadUser();
      } else {
        if (result.errors && Array.isArray(result.errors)) {
          result.errors.forEach(error => {
            toast.error(error.message);
          });
        } else {
          toast.error(result.message || 'Error al actualizar usuario');
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Error al actualizar usuario');
    } finally {
      setUpdating(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setResettingPassword(true);
      toast.info('Funcion en desarrollo - Contacta al administrador');
      setResetModal(false);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Error al restablecer contraseña');
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return <Loader fullScreen text="Cargando usuario..." />;
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Usuario no encontrado</p>
        <Button
          variant="primary"
          onClick={() => navigate('/usuarios')}
          className="mt-4"
        >
          Volver a Usuarios
        </Button>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">
            {user.nombre} {user.apellido}
          </h1>
          <p className="mt-1 text-gray-600">{user.email}</p>
        </div>
      </div>

      <Card title="Informacion Actual">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Nombre Completo</p>
            <p className="text-lg font-medium text-gray-900">
              {user.nombre} {user.apellido}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-lg font-medium text-gray-900">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Telefono</p>
            <p className="text-lg font-medium text-gray-900">{user.telefono || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tipo de Usuario</p>
            <p className="text-lg font-medium text-gray-900 capitalize">
              {user.tipo_usuario}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <p className="text-lg font-medium text-gray-900 capitalize">
              {user.estado}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Creado</p>
            <p className="text-lg font-medium text-gray-900">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>

      <Card title="Editar Usuario">
        <UserForm
          initialData={user}
          onSubmit={handleSubmit}
          loading={updating}
          isEdit={true}
        />
      </Card>

      <Card>
        <div className="space-y-3">
          <Button
            variant="outline"
            fullWidth
            onClick={() => setResetModal(true)}
            className="gap-2"
          >
            <Key className="w-5 h-5" />
            Restablecer Contraseña
          </Button>
          <p className="text-sm text-gray-500 text-center">
            Genera una nueva contraseña temporal para este usuario
          </p>
        </div>
      </Card>

      <Modal
        open={resetModal}
        onClose={() => setResetModal(false)}
        title="Restablecer Contraseña"
        subtitle="Genera una nueva contraseña temporal"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setResetModal(false)}
              disabled={resettingPassword}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleResetPassword}
              loading={resettingPassword}
            >
              Restablecer
            </Button>
          </>
        }
      >
        <p className="text-gray-700">
          Se generara una nueva contraseña temporal. El usuario debera cambiarla en su proximo inicio de sesion.
        </p>
      </Modal>
    </div>
  );
};

export default UserDetail;