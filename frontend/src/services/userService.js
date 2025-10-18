import api from './api';

const userService = {
async getAll(filters = {}) {
  try {
    const { tipo_usuario, estado, search, page = 1, limit = 10 } = filters;
    
    const params = new URLSearchParams();
    if (tipo_usuario) params.append('tipo_usuario', tipo_usuario);
    if (estado) params.append('estado', estado);
    if (search) params.append('search', search);
    params.append('page', page);
    params.append('limit', limit);

    const response = await api.get(`/users?${params.toString()}`);
    
    console.log('Raw response:', response.data);
    
    // El backend devuelve { success: true, data: [...usuarios], total: X }
    const data = response.data.data || response.data;
    const users = Array.isArray(data) ? data : (data.users || []);
    const total = response.data.total || users.length;

    return {
      success: true,
      data: users,
      pagination: response.data.pagination || {},
      total: total
    };
  } catch (error) {
    console.error('UserService error:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error al obtener usuarios',
      error: error.response?.data?.error
    };
  }
},

  async getById(id) {
    try {
      const response = await api.get(`/users/${id}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener usuario',
        error: error.response?.data?.error
      };
    }
  },

  async create(userData) {
    try {
      const response = await api.post('/users', userData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Usuario creado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear usuario',
        errors: error.response?.data?.errors || [],
        error: error.response?.data?.error
      };
    }
  },

  async update(id, userData) {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message || 'Usuario actualizado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar usuario',
        errors: error.response?.data?.errors || [],
        error: error.response?.data?.error
      };
    }
  },

  async changeStatus(id, nuevoEstado) {
    try {
      const response = await api.put(`/users/${id}`, {
        estado: nuevoEstado
      });
      return {
        success: true,
        data: response.data.data || response.data,
        message: `Usuario ${nuevoEstado} exitosamente`
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cambiar estado',
        error: error.response?.data?.error
      };
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/users/${id}`);
      return {
        success: true,
        message: response.data.message || 'Usuario eliminado exitosamente'
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar usuario',
        error: error.response?.data?.error
      };
    }
  },

  async getMaestros(filters = {}) {
    try {
      const response = await api.get('/users?tipo_usuario=maestro');
      return {
        success: true,
        data: response.data.data || response.data,
        total: response.data.total || 0
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al obtener maestros',
        error: error.response?.data?.error
      };
    }
  },

  async getPracticantes(filters = {}) {
    try {
      const response = await api.get('/users?tipo_usuario=practicante');
      return {
        success: true,
        data: response.data.data || response.data,
        total: response.data.total || 0
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al obtener practicantes',
        error: error.response?.data?.error
      };
    }
  },

  async getPacientes(filters = {}) {
    try {
      const response = await api.get('/users?tipo_usuario=paciente');
      return {
        success: true,
        data: response.data.data || response.data,
        total: response.data.total || 0
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al obtener pacientes',
        error: error.response?.data?.error
      };
    }
  },

  async getStats() {
    try {
      const response = await api.get('/users/stats');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.response?.data?.error
      };
    }
  }
};

export default userService;