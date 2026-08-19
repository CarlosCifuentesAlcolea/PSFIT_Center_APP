const API_URL = 'https://psfitcenter-api.onrender.com/api';
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
  cambiarPassword: (passwordActual, passwordNueva) =>
    request('/auth/cambiar-password', { method: 'POST', body: JSON.stringify({ passwordActual, passwordNueva }) }),
  olvidePassword: (email) => request('/auth/olvide-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, passwordNueva) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, passwordNueva }) }),

  getDashboard: () => request('/dashboard'),

  getSocios: () => request('/socios'),
  crearSocio: (data) => request('/socios', { method: 'POST', body: JSON.stringify(data) }),
  actualizarSocio: (id, data) => request(`/socios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  pagarSocio: (id, data) => request(`/socios/${id}/pagar`, { method: 'POST', body: JSON.stringify(data) }),
  eliminarSocio: (id) => request(`/socios/${id}`, { method: 'DELETE' }),

  getProductos: () => request('/productos'),
  crearProducto: (data) => request('/productos', { method: 'POST', body: JSON.stringify(data) }),
  actualizarProducto: (id, data) => request(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarProducto: (id) => request(`/productos/${id}`, { method: 'DELETE' }),
  venderProducto: (id, cantidad, metodo_pago) =>
    request(`/productos/${id}/vender`, { method: 'POST', body: JSON.stringify({ cantidad, metodo_pago }) }),
  reponerProducto: (id, cantidad, costo, metodo_pago) =>
    request(`/productos/${id}/reponer`, { method: 'POST', body: JSON.stringify({ cantidad, costo, metodo_pago }) }),

  getMovimientos: (filtro = {}) => {
    const params = new URLSearchParams();
    if (filtro.year) params.set('year', filtro.year);
    if (filtro.month) params.set('month', filtro.month);
    if (filtro.socio_id) params.set('socio_id', filtro.socio_id);
    const qs = params.toString();
    return request(`/movimientos${qs ? `?${qs}` : ''}`);
  },
  crearMovimiento: (data) => request('/movimientos', { method: 'POST', body: JSON.stringify(data) }),
  eliminarMovimiento: (id) => request(`/movimientos/${id}`, { method: 'DELETE' }),

  getUsuarios: () => request('/usuarios'),
  crearUsuario: (data) => request('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
  actualizarUsuario: (id, data) => request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarUsuario: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),

  getRutinas: (socioId) => request(socioId ? `/rutinas?socio_id=${socioId}` : '/rutinas'),
  crearRutina: (data) => request('/rutinas', { method: 'POST', body: JSON.stringify(data) }),
  actualizarRutina: (id, data) => request(`/rutinas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarRutina: (id) => request(`/rutinas/${id}`, { method: 'DELETE' }),

  getTiposEjercicio: () => request('/tipos-ejercicio'),
  crearTipoEjercicio: (nombre) => request('/tipos-ejercicio', { method: 'POST', body: JSON.stringify({ nombre }) }),
  actualizarTipoEjercicio: (id, nombre) => request(`/tipos-ejercicio/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) }),
  eliminarTipoEjercicio: (id) => request(`/tipos-ejercicio/${id}`, { method: 'DELETE' }),

  getDietas: (socioId) => request(socioId ? `/dietas?socio_id=${socioId}` : '/dietas'),
  crearDieta: (data) => request('/dietas', { method: 'POST', body: JSON.stringify(data) }),
  actualizarDieta: (id, data) => request(`/dietas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarDieta: (id) => request(`/dietas/${id}`, { method: 'DELETE' })
};
