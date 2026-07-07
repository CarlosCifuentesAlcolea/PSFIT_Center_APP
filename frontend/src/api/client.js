const API_URL = 'http://localhost:4000/api';
const TOKEN_KEY = 'psfit_token';

async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  });
  if (!res.ok) {
    if (res.status === 401) localStorage.removeItem(TOKEN_KEY);
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: async (nombre, password) => {
    const { token, usuario } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nombre, password })
    });
    localStorage.setItem(TOKEN_KEY, token);
    return usuario;
  },
  me: () => request('/auth/me').then((r) => r.usuario),
  logout: () => localStorage.removeItem(TOKEN_KEY),

  getDashboard: () => request('/dashboard'),

  getSocios: () => request('/socios'),
  crearSocio: (data) => request('/socios', { method: 'POST', body: JSON.stringify(data) }),
  actualizarSocio: (id, data) => request(`/socios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarSocio: (id) => request(`/socios/${id}`, { method: 'DELETE' }),

  getProductos: () => request('/productos'),
  crearProducto: (data) => request('/productos', { method: 'POST', body: JSON.stringify(data) }),
  actualizarProducto: (id, data) => request(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarProducto: (id) => request(`/productos/${id}`, { method: 'DELETE' }),

  getMovimientos: () => request('/movimientos'),
  crearMovimiento: (data) => request('/movimientos', { method: 'POST', body: JSON.stringify(data) }),
  eliminarMovimiento: (id) => request(`/movimientos/${id}`, { method: 'DELETE' }),

  getUsuarios: () => request('/usuarios'),
  crearUsuario: (data) => request('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  actualizarUsuario: (id, data) => request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarUsuario: (id) => request(`/usuarios/${id}`, { method: 'DELETE' })
};
