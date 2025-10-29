import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { PRACTICE_TIPOS, PRACTICE_ESTADOS_OPTIONS, PRACTICE_NIVELES } from '../../utils/constants';

const PracticeFilters = ({ onFilterChange, onClear, loading = false }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    tipo_practica: '',
    estado: '',
    nivel_dificultad: ''
  });

  const handleInputChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClear = () => {
    const clearedFilters = {
      search: '',
      tipo_practica: '',
      estado: '',
      nivel_dificultad: ''
    };
    setFilters(clearedFilters);
    onClear();
  };

  const hasActiveFilters = filters.tipo_practica || filters.estado || filters.nivel_dificultad;

  return (
    <div className="space-y-4">
      {/* Búsqueda y Toggle Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre de práctica..."
            value={filters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            icon={<Search className="w-5 h-5 text-gray-400" />}
            disabled={loading}
          />
        </div>
        <Button
          variant={showFilters ? 'primary' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="w-5 h-5" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 bg-white text-primary rounded-full text-xs font-bold">
              {[filters.tipo_practica, filters.estado, filters.nivel_dificultad].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Panel de Filtros */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Tipo de Práctica"
              placeholder="Todos los tipos"
              options={PRACTICE_TIPOS}
              value={filters.tipo_practica}
              onChange={(e) => handleInputChange('tipo_practica', e.target.value)}
              disabled={loading}
            />

            <Select
              label="Estado"
              placeholder="Todos los estados"
              options={PRACTICE_ESTADOS_OPTIONS}
              value={filters.estado}
              onChange={(e) => handleInputChange('estado', e.target.value)}
              disabled={loading}
            />

            <Select
              label="Nivel de Dificultad"
              placeholder="Todos los niveles"
              options={PRACTICE_NIVELES}
              value={filters.nivel_dificultad}
              onChange={(e) => handleInputChange('nivel_dificultad', e.target.value)}
              disabled={loading}
            />
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Limpiar Filtros
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PracticeFilters;