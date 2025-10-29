import api from './api';

const practiceService = {
  // ==================== PRÁCTICAS ====================
  
  /**
   * Obtener todas las prácticas (con filtros)
   */
  async getAll(filters = {}) {
    try {
      const { tipo_practica, estado, nivel_dificultad, search, page = 1, limit = 10 } = filters;
      
      const params = new URLSearchParams();
      if (tipo_practica) params.append('tipo_practica', tipo_practica);
      if (estado) params.append('estado', estado);
      if (nivel_dificultad) params.append('nivel_dificultad', nivel_dificultad);
      if (search) params.append('search', search);
      params.append('page', page);
      params.append('limit', limit);

      const response = await api.get(`/practices?${params.toString()}`);
      
      const data = response.data.data || response.data;
      const practices = Array.isArray(data) ? data : (data.practices || []);
      const total = response.data.total || practices.length;

      return {
        success: true,
        data: practices,
        pagination: response.data.pagination || {},
        total: total
      };
    } catch (error) {
      console.error('PracticeService getAll error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener prácticas',
        error: error.response?.data?.error
      };
    }
  },

  /**
   * Obtener práctica por ID
   */
  async getById(id) {
    try {
      const response = await api.get(`/practices/${id}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener práctica',
        error: error.response?.data?.error
      };
    }
  },

  /**
   * Crear nueva práctica (solo maestro)
   */
  async create(practiceData) {
    try {
      const response = await api.post('/practices', practiceData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Práctica creada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear práctica',
        errors: error.response?.data?.errors || [],
        error: error.response?.data?.error
      };
    }
  },

  /**
   * Actualizar práctica
   */
  async update(id, practiceData) {
    try {
      const response = await api.put(`/practices/${id}`, practiceData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Práctica actualizada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar práctica',
        errors: error.response?.data?.errors || [],
        error: error.response?.data?.error
      };
    }
  },

  /**
   * Eliminar práctica
   */
  async delete(id) {
    try {
      const response = await api.delete(`/practices/${id}`);
      return {
        success: true,
        message: response.data.message || 'Práctica eliminada exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar práctica',
        error: error.response?.data?.error
      };
    }
  },

  /**
   * Cambiar estado de práctica
   */
  async changeStatus(id, nuevoEstado) {
    try {
      const response = await api.put(`/practices/${id}`, {
        estado: nuevoEstado
      });
      return {
        success: true,
        data: response.data.data || response.data,
        message: `Práctica ${nuevoEstado} exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cambiar estado',
        error: error.response?.data?.error
      };
    }
  },

  // ==================== MIS PRÁCTICAS (PRACTICANTE) ====================
  
  /**
   * Obtener mis prácticas asignadas (practicante)
   */
  async getMyPractices(filters = {}) {
    try {
      const { estado, page = 1, limit = 10 } = filters;
      
      const params = new URLSearchParams();
      if (estado) params.append('estado', estado);
      params.append('page', page);
      params.append('limit', limit);

      const response = await api.get(`/practices/my-practices?${params.toString()}`);
      
      const data = response.data.data || response.data;
      const practices = Array.isArray(data) ? data : (data.practices || []);
      const total = response.data.total || practices.length;

      return {
        success: true,
        data: practices,
        pagination: response.data.pagination || {},
        total: total
      };
    } catch (error) {
      console.error('PracticeService getMyPractices error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener mis prácticas',
        error: error.response?.data?.error
      };
    }
  },

  // ==================== ASIGNACIONES ====================
  
  /**
   * Asignar practicante a práctica
   */
  async assignPracticante(practiceId, practicanteId, observaciones = '') {
    try {
      const response = await api.post(`/practices/${practiceId}/assign`, {
        practicante_id: practicanteId,
        observaciones
      });
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Practicante asignado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al asignar practicante',
        error: error.response?.data?.error
      };
    }
  },

  /**
   * Obtener practicantes asignados a una práctica
   */
  async getAssignedPracticantes(practiceId) {
    try {
      const response = await api.get(`/practices/${practiceId}/practicantes`);
      
      const data = response.data.data || response.data;
      const practicantes = Array.isArray(data) ? data : (data.practicantes || []);

      return {
        success: true,
        data: practicantes,
        total: response.data.total || practicantes.length
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener practicantes asignados',
        error: error.response?.data?.error
      };
    }
  },

  /**
   * Actualizar estado de asignación (practicante cambia su propio estado)
   */
  async updateAssignmentStatus(practiceId, nuevoEstado) {
    try {
      // Asumiendo que el endpoint permite al practicante cambiar su estado
      const response = await api.put(`/practices/${practiceId}/assignment`, {
        estado: nuevoEstado
      });
      return {
        success: true,
        data: response.data.data || response.data,
        message: `Estado actualizado a ${nuevoEstado}`
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar estado',
        error: error.response?.data?.error
      };
    }
  },

  // ==================== ESTADÍSTICAS ====================
  
  /**
   * Obtener estadísticas de prácticas
   */
  async getStatistics() {
    try {
      const response = await api.get('/practices/statistics');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener estadísticas',
        error: error.response?.data?.error
      };
    }
  },

  /**
   * Obtener disponibilidad de maestro
   */
  async getMaestroDisponibilidad(maestroId) {
    try {
      const response = await api.get(`/practices/maestros/${maestroId}/disponibilidad`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener disponibilidad',
        error: error.response?.data?.error
      };
    }
  }
};

export default practiceService;