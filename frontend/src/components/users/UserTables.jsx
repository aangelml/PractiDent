import { Edit2, Trash2, Eye } from 'lucide-react';
import Table from '../ui/Table';
import Badge from '../ui/Badge';

const UserTable = ({
  users = [],
  onView,
  onEdit,
  onDelete,
  loading = false,
  sortBy,
  sortOrder,
  onSort
}) => {
  const columns = [
    {
      key: 'id',
      label: 'ID',
      sortable: true,
      className: 'w-12'
    },
    {
      key: 'nombre',
      label: 'Nombre',
      sortable: true,
      render: (value, row) => `${row.nombre} ${row.apellido}`
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => (
        <a href={`mailto:${value}`} className="text-primary hover:underline">
          {value}
        </a>
      )
    },
    {
      key: 'tipo_usuario',
      label: 'Tipo',
      sortable: true,
      render: (value) => (
        <Badge
          text={value.charAt(0).toUpperCase() + value.slice(1)}
          variant={
            value === 'admin' ? 'danger' :
            value === 'maestro' ? 'info' :
            value === 'practicante' ? 'success' :
            'default'
          }
          size="sm"
        />
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      sortable: true,
      render: (value) => (
        <Badge
          text={value.charAt(0).toUpperCase() + value.slice(1)}
          variant={value}
          size="sm"
        />
      )
    },
    {
      key: 'telefono',
      label: 'Telefono',
      render: (value) => value || '-'
    },
    {
      key: 'acciones',
      label: 'Acciones',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(row.id);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Ver detalles"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(row.id);
            }}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Editar usuario"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(row.id);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar usuario"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      data={users}
      loading={loading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={onSort}
      className="bg-white rounded-lg shadow-sm"
    />
  );
};

export default UserTable;