// frontend/src/components/appointments/AppointmentFilters.jsx
import { Search, X, Filter } from 'lucide-react';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Input from '../ui/Input';

const AppointmentFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const handleChange = (field, value) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const hasActiveFilters = () => {
    return filters.estado || filters.fecha_inicio || filters.fecha_fin || filters.search;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Filtros</h3>
        </div>
        {hasActiveFilters() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-amber-600 hover:text-amber-700"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Búsqueda */}
        <div className="md:col-span-2">
          <Input
            type="text"
            placeholder="Buscar por nombre..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            icon={<Search className="w-4 h-4 text-gray-400" />}
          />
        </div>

        {/* Estado */}
        <Select
          placeholder="Estado"
          value={filters.estado || ''}
          onChange={(e) => handleChange('estado', e.target.value)}
          options={[
            { value: '', label: 'Todos los estados' },
            { value: 'pendiente', label: 'Pendiente' },
            { value: 'confirmada', label: 'Confirmada' },
            { value: 'completada', label: 'Completada' },
            { value: 'cancelada', label: 'Cancelada' },
            { value: 'no_asistio', label: 'No Asistió' }
          ]}
        />

        {/* Fecha Desde */}
        <Input
          type="date"
          placeholder="Fecha desde"
          value={filters.fecha_inicio || ''}
          onChange={(e) => handleChange('fecha_inicio', e.target.value)}
        />
      </div>
    </div>
  );
};

export default AppointmentFilters;