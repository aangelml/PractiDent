import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { USER_TYPES, ESTADOS } from '../../utils/constants';

const UserFilters = ({
  onFilterChange,
  onClear,
  loading = false
}) => {
  const [filters, setFilters] = useState({
    search: '',
    tipo_usuario: '',
    estado: ''
  });

  const [isOpen, setIsOpen] = useState(false);

  const estadoOptions = Object.entries(ESTADOS).map(([key, value]) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1)
  }));

  const handleChange = (field, value) => {
    const newFilters = {
      ...filters,
      [field]: value
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClear = () => {
    setFilters({
      search: '',
      tipo_usuario: '',
      estado: ''
    });
    onClear();
  };

  const hasActiveFilters = filters.search || filters.tipo_usuario || filters.estado;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre, email o matricula..."
            icon={<Search className="w-5 h-5 text-gray-400" />}
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            disabled={loading}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Filter className="w-5 h-5" />
          <span className="hidden sm:inline">Filtros</span>
        </Button>
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <Select
            label="Tipo de Usuario"
            placeholder="Todos los tipos"
            options={USER_TYPES}
            value={filters.tipo_usuario}
            onChange={(e) => handleChange('tipo_usuario', e.target.value)}
            disabled={loading}
          />

          <Select
            label="Estado"
            placeholder="Todos los estados"
            options={estadoOptions}
            value={filters.estado}
            onChange={(e) => handleChange('estado', e.target.value)}
            disabled={loading}
          />

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={loading}
              className="sm:col-span-2 gap-2"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </Button>
          )}
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              <span>Busqueda: "{filters.search}"</span>
              <button onClick={() => handleChange('search', '')} className="hover:text-primary/70">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {filters.tipo_usuario && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
              <span>Tipo: {USER_TYPES.find(t => t.value === filters.tipo_usuario)?.label}</span>
              <button onClick={() => handleChange('tipo_usuario', '')} className="hover:text-secondary/70">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {filters.estado && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              <span>Estado: {filters.estado}</span>
              <button onClick={() => handleChange('estado', '')} className="hover:opacity-70">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserFilters;