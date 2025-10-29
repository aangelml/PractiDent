import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, UserPlus, Users, Clock, Calendar, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import PracticeForm from '../../components/practices/PracticeForm';
import AssignModal from '../../components/practices/AssignModal';
import PracticantesList from '../../components/practices/PracticantesList';
import Loader from '../../components/ui/Loader';
import practiceService from '../../services/practiceService';
import { 
  PRACTICE_ESTADO_COLORS, 
  PRACTICE_NIVEL_COLORS 
} from '../../utils/constants';

const PracticeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [practice, setPractice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [practicantes, setPracticantes] = useState([]);
  const [loadingPracticantes, setLoadingPracticantes] = useState(false);

  useEffect(() => {
    loadPractice();
    loadPracticantes();
  }, [id]);

  const loadPractice = async () => {
    try {
      setLoading(true);
      const result = await practiceService.getById(id);

      if (result.success) {
        setPractice(result.data);
      } else {
        toast.error(result.message || 'Error al cargar práctica');
        navigate('/practicas');
      }
    } catch (error) {
      console.error('Error loading practice:', error);
      toast.error('Error al cargar práctica');
      navigate('/practicas');
    } finally {
      setLoading(false);
    }
  };

  const loadPracticantes = async () => {
    try {
      setLoadingPracticantes(true);
      const result = await practiceService.getAssignedPracticantes(id);

      if (result.success) {
        setPracticantes(result.data || []);
      }
    } catch (error) {
      console.error('Error loading practicantes:', error);
    } finally {
      setLoadingPracticantes(false);
    }
  };

  const handleUpdate = async (data) => {
    try {
      setSaving(true);
      const result = await practiceService.update(id, data);

      if (result.success) {
        toast.success(result.message || 'Práctica actualizada exitosamente');
        setPractice(result.data);
        setIsEditing(false);
        loadPractice();
      } else {
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(error => {
            toast.error(error.message || error);
          });
        } else {
          toast.error(result.message || 'Error al actualizar práctica');
        }
      }
    } catch (error) {
      console.error('Error updating practice:', error);
      toast.error('Error al actualizar práctica');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const result = await practiceService.delete(id);

      if (result.success) {
        toast.success(result.message || 'Práctica eliminada exitosamente');
        navigate('/practicas');
      } else {
        toast.error(result.message || 'Error al eliminar práctica');
      }
    } catch (error) {
      console.error('Error deleting practice:', error);
      toast.error('Error al eliminar práctica');
    } finally {
      setDeleting(false);
      setDeleteModal(false);
    }
  };

  const handleAssignSuccess = () => {
    loadPracticantes();
    loadPractice();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <Loader fullScreen text="Cargando práctica..." />;
  }

  if (!practice) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/practicas')}
            className="gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{practice.nombre}</h1>
            <p className="mt-1 text-gray-600">{practice.tipo_practica}</p>
          </div>
        </div>

        {!isEditing && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setAssignModal(true)}
              className="gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Asignar Practicante
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="gap-2"
            >
              <Edit className="w-5 h-5" />
              Editar
            </Button>
            <Button
              variant="danger"
              onClick={() => setDeleteModal(true)}
              className="gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Eliminar
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        /* Modo Edición */
        <Card>
          <PracticeForm
            initialData={practice}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            loading={saving}
            isEdit={true}
          />
        </Card>
      ) : (
        /* Modo Vista */
        <>
          {/* Información General */}
          <Card title="Información General">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <p className="text-gray-900">{practice.descripcion || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requisitos
                </label>
                <p className="text-gray-900">{practice.requisitos || '-'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de Dificultad
                </label>
                <Badge
                  text={practice.nivel_dificultad?.charAt(0).toUpperCase() + practice.nivel_dificultad?.slice(1)}
                  variant={PRACTICE_NIVEL_COLORS[practice.nivel_dificultad]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <Badge
                  text={practice.estado?.charAt(0).toUpperCase() + practice.estado?.slice(1)}
                  variant={PRACTICE_ESTADO_COLORS[practice.estado]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración Estimada
                </label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span>{practice.duracion_estimada_horas} horas</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cupos
                </label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span>
                    {practice.cupo_disponible} disponibles de {practice.cupo_maximo} totales
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio
                </label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span>{formatDate(practice.fecha_inicio)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin
                </label>
                <div className="flex items-center gap-2 text-gray-900">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span>{formatDate(practice.fecha_fin)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Practicantes Asignados */}
          <Card 
            title="Practicantes Asignados"
            subtitle={`${practicantes.length} de ${practice.cupo_maximo} cupos ocupados`}
          >
            <PracticantesList 
              practicantes={practicantes}
              loading={loadingPracticantes}
            />
          </Card>
        </>
      )}

      {/* Modal Asignar Practicante */}
      <AssignModal
        open={assignModal}
        onClose={() => setAssignModal(false)}
        practiceId={id}
        practiceName={practice.nombre}
        onSuccess={handleAssignSuccess}
      />

      {/* Modal Eliminar */}
      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Confirmar Eliminación"
        subtitle="Esta acción no se puede deshacer"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleteModal(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
            >
              Eliminar Práctica
            </Button>
          </>
        }
      >
        <p className="text-gray-700">
          ¿Estás seguro de que deseas eliminar esta práctica? Todos los practicantes asignados perderán acceso a ella.
        </p>
      </Modal>
    </div>
  );
};

export default PracticeDetail;