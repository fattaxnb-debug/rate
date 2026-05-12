import axios from 'axios';

// Configuração base da API
const API_BASE_URL = 'http://localhost:5000/api';

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Serviços de Autenticação
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data.data;
    
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    
    return { token, user };
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  },

  changePassword: async (currentPassword, newPassword) => {
    return await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
  }
};

// Serviços de Clientes
export const clientService = {
  getAll: async () => {
    const response = await api.get('/clients');
    return response.data.data;
  },

  getById: async (id) => {
    const response = await api.get(`/clients/${id}`);
    return response.data.data;
  },

  create: async (clientData) => {
    const response = await api.post('/clients', clientData);
    return response.data.data;
  },

  update: async (id, clientData) => {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data.data;
  },

  delete: async (id) => {
    await api.delete(`/clients/${id}`);
  }
};

// Serviços de Equipamentos
export const equipmentService = {
  getAll: async () => {
    const response = await api.get('/equipments');
    return response.data.data;
  },

  getById: async (id) => {
    const response = await api.get(`/equipments/${id}`);
    return response.data.data;
  },

  create: async (equipmentData) => {
    const response = await api.post('/equipments', equipmentData);
    return response.data.data;
  },

  update: async (id, equipmentData) => {
    const response = await api.put(`/equipments/${id}`, equipmentData);
    return response.data.data;
  },

  delete: async (id) => {
    await api.delete(`/equipments/${id}`);
  }
};

// Serviços de Agendamentos
export const scheduleService = {
  getAll: async () => {
    const response = await api.get('/schedules');
    return response.data.data;
  },

  getToday: async () => {
    const response = await api.get('/schedules/today');
    return response.data.data;
  },

  getById: async (id) => {
    const response = await api.get(`/schedules/${id}`);
    return response.data.data;
  },

  create: async (scheduleData) => {
    const response = await api.post('/schedules', scheduleData);
    return response.data.data;
  },

  update: async (id, scheduleData) => {
    const response = await api.put(`/schedules/${id}`, scheduleData);
    return response.data.data;
  },

  delete: async (id) => {
    await api.delete(`/schedules/${id}`);
  }
};

// Serviços de Relatórios
export const reportService = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/reports?${params}`);
    return response.data.data;
  },

  getById: async (id) => {
    const response = await api.get(`/reports/${id}`);
    return response.data.data;
  },

  create: async (reportData) => {
    const response = await api.post('/reports', reportData);
    return response.data.data;
  },

  update: async (id, reportData) => {
    const response = await api.put(`/reports/${id}`, reportData);
    return response.data.data;
  },

  delete: async (id) => {
    await api.delete(`/reports/${id}`);
  },

  submit: async (id) => {
    const response = await api.post(`/reports/${id}/submit`);
    return response.data.data;
  }
};

// Serviços de Upload de Fotos
export const uploadService = {
  uploadPhoto: async (file, reportId, comment = '', photoType = 'outro', sequence = 0) => {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('report_id', reportId);
    formData.append('comment', comment);
    formData.append('photo_type', photoType);
    formData.append('sequence', sequence);

    const response = await api.post('/uploads/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  uploadMultiplePhotos: async (files, reportId) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));
    formData.append('report_id', reportId);

    const response = await api.post('/uploads/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  deletePhoto: async (photoId) => {
    await api.delete(`/uploads/photo/${photoId}`);
  },

  getPhotoUrl: (filename) => {
    return `${API_BASE_URL}/uploads/photo/${filename}`;
  }
};

// Serviços de Usuários
export const userService = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data.data;
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },

  create: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data.data;
  },

  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data.data;
  },

  delete: async (id) => {
    await api.delete(`/users/${id}`);
  }
};

// Exportar API principal
export default api;
