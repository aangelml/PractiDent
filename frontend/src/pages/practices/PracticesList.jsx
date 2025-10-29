import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, GraduationCap, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PracticeFilters from '../../components/practices/PracticeFilters';
import PracticeTable from '../../components/practices/PracticeTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import PracticantesList from '../../components/practices/PracticantesList';
import practiceService from '../../services/practiceService';

const PracticesList = () => {
  const navigate = useNavigate();
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    tipo_practica: '',
    estado: '',
    nivel_dificultad: ''
  });
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteModal, setDeleteModal] = useState(false);
  const [practiceToDelete, setPracticeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewPracticantesModal, setViewPracticantesModal] = useState(false);
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [practicantes, setPracticantes] = useState([]);
  const [loadingPracticantes, setLoadingPracticantes] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    activas: 0,
    completadas: 0,
    canceladas: 0
  });

  useEffect(() => {
    loadPractices();
  }, [currentPage, itemsPerPage, filters, sortBy, sortOrder]);

  const loadPractices = async () => {
    try {
      setLoading(true);
      const result = await practiceService.getAll({
        ...filters,
        page: currentPage,
        limit: itemsPerPage
      });

      if (result.success) {
        const practicesData = Array.isArray(result.data) ? result.data : [];
        setPractices(practicesData);
        setTotalPages(Math.ceil((result.total || 0) / itemsPerPage));
        
        // Calcular estadísticas
        setStats({
          total: practicesData.length,
          activas: practicesData.filter(p => p.estado === 'activa').length,
          completadas: practicesData.filter(p => p.estado === 'completada').length,
          canceladas: practicesData.filter(p => p.estado === 'cancelada').length
        });
      } else {
        toast.error(result.message || 'Error al cargar prácticas');
      }
    } catch (error) {
      console.error('Error loading practices:', error);
      toast.error('Error al cargar prácticas');
    } finally {
      setLoading(false);
    }
  };

  const loadPracticantes = async (practiceId) => {
    try {
      setLoadingPracticantes(true);
      const result = await practiceService.getAssignedPracticantes(practiceId);

      if (result.success) {
        setPracticantes(result.data || []);
      } else {
        toast.error(result.message || 'Error al cargar practicantes');
      }
    } catch (error) {
      console.error('Error loading practicantes:', error);
      toast.error('Error al cargar practicantes');
    } finally {
      setLoadingPracticantes(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ search: '', tipo_practica: '', estado: '', nivel_dificultad: '' });
    setCurrentPage(1);
  };

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (limit) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };

  const handleView = (id) => {
    navigate(`/practicas/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/practicas/${id}`);
  };

  const handleDeleteClick = (id) => {
    setPracticeToDelete(id);
    setDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!practiceToDelete) return;

    try {
      setDeleting(true);
      const result = await practiceService.delete(practiceToDelete);

      if (result.success) {
        toast.success(result.message || 'Práctica eliminada exitosamente');
        setDeleteModal(false);
        setPracticeToDelete(null);
        setCurrentPage(1);
        setTimeout(() => loadPractices(), 500);
      } else {
        toast.error(result.message || 'Error al eliminar práctica');
      }
    } catch (error) {
      console.error('Error deleting practice:', error);
      toast.error('Error al eliminar práctica');
    } finally {
      setDeleting(false);
    }
  };

  const handleViewPracticantes = async (id) => {
    const practice = practices.find(p => p.id === id);
    setSelectedPractice(practice);
    setViewPracticantesModal(true);
    await loadPracticantes(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Prácticas</h1>
          <p className="mt-1 text-gray-600">Gestiona las prácticas odontológicas</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/practicas/nueva')}
          className="gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Práctica
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm text-blue-700 font-medium">Total Prácticas</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-green-700 font-medium">Activas</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{stats.activas}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm text-purple-700 font-medium">Completadas</p>
            <p className="text-3xl font-bold text-purple-900 mt-2">{stats.completadas}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-sm text-red-700 font-medium">Canceladas</p>
            <p className="text-3xl font-bold text-red-900 mt-2">{stats.canceladas}</p>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <PracticeFilters
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
          loading={loading}
        />
      </Card>

      {/* Tabla */}
      <Card>
        <PracticeTable
          practices={practices}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onViewPracticantes={handleViewPracticantes}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      </Card>

      {/* Paginación */}
      {practices.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          showItemsPerPage={true}
        />
      )}

      {/* Modal Eliminar */}
      <Modal
        open={deleteModal}
        onClose={() => {
          setDeleteModal(false);
          setPracticeToDelete(null);
        }}
        title="Confirmar Eliminación"
        subtitle="Esta acción no se puede deshacer"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteModal(false);
                setPracticeToDelete(null);
              }}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              loading={deleting}
            >
              Eliminar Práctica
            </Button>
          </>
        }
      >
        <p className="text-gray-700">
          ¿Estás seguro de que deseas eliminar esta práctica? Esta acción no se puede deshacer.
        </p>
      </Modal>

      {/* Modal Ver Practicantes */}
      <Modal
        open={viewPracticantesModal}
        onClose={() => {
          setViewPracticantesModal(false);
          setSelectedPractice(null);
          setPracticantes([]);
        }}
        title="Practicantes Asignados"
        subtitle={selectedPractice?.nombre}
        size="2xl"
      >
        <PracticantesList 
          practicantes={practicantes} 
          loading={loadingPracticantes}
        />
      </Modal>
    </div>
  );
};

export default PracticesList;