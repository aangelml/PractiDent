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
      
      // Manejar estructura de respuesta
      let users = [];
      if (response.data.users && Array.isArray(response.data.users)) {
        users = response.data.users;
      } else if (response.data.data && Array.isArray(response.data.data.users)) {
        users = response.data.data.users;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        users = response.data.data;
      } else if (Array.isArray(response.data)) {
        users = response.data;
      }

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
        error: error.response?.data?.error,
        data: []
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
      console.log('📥 getMaestros - Llamando backend...');
      const response = await api.get('/users?tipo_usuario=maestro');
      console.log('✅ getMaestros - Respuesta:', response.data);
      
      let usuarios = [];
      
      // Extraer usuarios según estructura
      if (response.data.users && Array.isArray(response.data.users)) {
        usuarios = response.data.users;
      } else if (response.data.data && Array.isArray(response.data.data.users)) {
        usuarios = response.data.data.users;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        usuarios = response.data.data;
      } else if (Array.isArray(response.data)) {
        usuarios = response.data;
      }

      console.log(`✅ ${usuarios.length} maestros encontrados`);

      return {
        success: true,
        data: usuarios,
        total: response.data.total || usuarios.length
      };
    } catch (error) {
      console.error('❌ getMaestros error:', error);
      return {
        success: false,
        message: 'Error al obtener maestros',
        error: error.response?.data?.error,
        data: []
      };
    }
  },

 async getPracticantes(filters = {}) {
  try {
    console.log('📥 getPracticantes - Llamando backend...');
    const response = await api.get('/users?tipo_usuario=practicante');
    console.log('✅ getPracticantes - Respuesta completa:', response.data);
    
    let usuarios = [];
    
    // Extraer usuarios según estructura de respuesta
    if (response.data.users && Array.isArray(response.data.users)) {
      usuarios = response.data.users;
    } else if (response.data.data && Array.isArray(response.data.data.users)) {
      usuarios = response.data.data.users;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      usuarios = response.data.data;
    } else if (Array.isArray(response.data)) {
      usuarios = response.data;
    }

    console.log(`✅ ${usuarios.length} usuarios recibidos del backend:`, usuarios);

    // ⭐ FILTRO SIMPLIFICADO: Solo verificar que sea practicante
    // No filtrar por estado porque viene undefined
    const practicantes = usuarios.filter(user => {
      const esPracticante = user.tipo_usuario === 'practicante';
      
      console.log(`Usuario ${user.id} - ${user.nombre}:`, {
        tipo_usuario: user.tipo_usuario,
        esPracticante
      });
      
      return esPracticante;
    });

    console.log(`✅ ${practicantes.length} practicantes encontrados:`, practicantes);

    return {
      success: true,
      data: practicantes,
      total: practicantes.length
    };
  } catch (error) {
    console.error('❌ getPracticantes error:', error);
    return {
      success: false,
      message: 'Error al obtener practicantes',
      error: error.response?.data?.error,
      data: []
    };
  }
},

async getPacientes(filters = {}) {
  try {
    console.log('📥 getPacientes - Llamando backend...');
    const response = await api.get('/users?tipo_usuario=paciente');
    console.log('✅ getPacientes - Respuesta:', response.data);
    
    let usuarios = [];
    
    // Extraer usuarios según estructura
    if (response.data.users && Array.isArray(response.data.users)) {
      usuarios = response.data.users;
    } else if (response.data.data && Array.isArray(response.data.data.users)) {
      usuarios = response.data.data.users;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      usuarios = response.data.data;
    } else if (Array.isArray(response.data)) {
      usuarios = response.data;
    }

    // ⭐ FILTRO SIMPLIFICADO: Solo verificar que sea paciente
    const pacientes = usuarios.filter(user => user.tipo_usuario === 'paciente');

    console.log(`✅ ${pacientes.length} pacientes encontrados`);

    return {
      success: true,
      data: pacientes,
      total: pacientes.length
    };
  } catch (error) {
    console.error('❌ getPacientes error:', error);
    return {
      success: false,
      message: 'Error al obtener pacientes',
      error: error.response?.data?.error,
      data: []
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