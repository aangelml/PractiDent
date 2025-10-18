import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import UserFilters from '../../components/users/UserFilters';
import UserTable from '../../components/users/UserTable';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import userService from '../../services/userService';

const UsersList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    tipo_usuario: '',
    estado: ''
  });
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [deleteModal, setDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [currentPage, itemsPerPage, filters, sortBy, sortOrder]);

 const loadUsers = async () => {
  try {
    setLoading(true);
    const result = await userService.getAll({
      ...filters,
      page: currentPage,
      limit: itemsPerPage
    });

    console.log('=== FULL RESPONSE ===', result);
    console.log('result.data:', result.data);
    console.log('result.total:', result.total);
    console.log('Is array?', Array.isArray(result.data));

    if (result.success) {
      setUsers(Array.isArray(result.data) ? result.data : []);
      setTotalPages(Math.ceil((result.total || 0) / itemsPerPage));
    } else {
      toast.error(result.message || 'Error al cargar usuarios');
    }
  } catch (error) {
    console.error('Error loading users:', error);
    toast.error('Error al cargar usuarios');
  } finally {
    setLoading(false);
  }
};

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ search: '', tipo_usuario: '', estado: '' });
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
    navigate(`/usuarios/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/usuarios/${id}`);
  };

  const handleDeleteClick = (id) => {
    setUserToDelete(id);
    setDeleteModal(true);
  };

const handleConfirmDelete = async () => {
  if (!userToDelete) return;

  try {
    setDeleting(true);
    const result = await userService.delete(userToDelete);

    if (result.success) {
      toast.success(result.message || 'Usuario eliminado exitosamente');
      setDeleteModal(false);
      setUserToDelete(null);
      setCurrentPage(1);  // ← Vuelve a página 1
      setTimeout(() => loadUsers(), 500);  // ← Espera 500ms y recarga
    } else {
      toast.error(result.message || 'Error al eliminar usuario');
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    toast.error('Error al eliminar usuario');
  } finally {
    setDeleting(false);
  }
};

const stats = {
  total: Array.isArray(users) ? users.length : 0,
  practicantes: Array.isArray(users) ? users.filter(u => u.tipo_usuario === 'practicante').length : 0,
  maestros: Array.isArray(users) ? users.filter(u => u.tipo_usuario === 'maestro').length : 0,
  pacientes: Array.isArray(users) ? users.filter(u => u.tipo_usuario === 'paciente').length : 0
};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion de Usuarios</h1>
          <p className="mt-1 text-gray-600">Administra todos los usuarios del sistema</p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/usuarios/nuevo')}
          className="gap-2"
        >
          <Plus className="w-5 h-5" />
          Crear Usuario
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="text-center">
            <p className="text-sm text-blue-700 font-medium">Total Usuarios</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="text-center">
            <p className="text-sm text-green-700 font-medium">Practicantes</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{stats.practicantes}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="text-center">
            <p className="text-sm text-purple-700 font-medium">Maestros</p>
            <p className="text-3xl font-bold text-purple-900 mt-2">{stats.maestros}</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="text-center">
            <p className="text-sm text-orange-700 font-medium">Pacientes</p>
            <p className="text-3xl font-bold text-orange-900 mt-2">{stats.pacientes}</p>
          </div>
        </Card>
      </div>

      <Card>
        <UserFilters
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
          loading={loading}
        />
      </Card>

      <Card>
        <UserTable
          users={users}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      </Card>

      {users.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          showItemsPerPage={true}
        />
      )}

      <Modal
        open={deleteModal}
        onClose={() => {
          setDeleteModal(false);
          setUserToDelete(null);
        }}
        title="Confirmar Eliminacion"
        subtitle="Esta accion no se puede deshacer"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setDeleteModal(false);
                setUserToDelete(null);
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
              Eliminar Usuario
            </Button>
          </>
        }
      >
        <p className="text-gray-700">
          Estas seguro de que deseas eliminar este usuario? El usuario sera marcado como inactivo y no podra acceder al sistema.
        </p>
      </Modal>
    </div>
  );
};

export default UsersList;