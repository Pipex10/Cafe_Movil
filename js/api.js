// ============================================================
// js/api.js
// ============================================================

const API = {
  _base: './api',

  async _req(method, path, body = null) {
    const opts = {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== null) opts.body = JSON.stringify(body);
    const res  = await fetch(this._base + path, opts);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Error desconocido');
    return data.data;
  },

  // ---- Auth ----
  login:    (email, password)         => API._req('POST', '/auth.php?action=login',    { email, password }),
  register: (nombre, email, password) => API._req('POST', '/auth.php?action=register', { nombre, email, password }),
  logout:   ()                        => API._req('POST', '/auth.php?action=logout'),
  me:       ()                        => API._req('GET',  '/auth.php?action=me'),

  // ---- Productos ----
  getProducts:   ()         => API._req('GET',    '/products.php'),
  createProduct: (data)     => API._req('POST',   '/products.php', data),
  updateProduct: (id, data) => API._req('PUT',    `/products.php?id=${id}`, data),
  deleteProduct: (id)       => API._req('DELETE', `/products.php?id=${id}`),

  // ---- Ingredientes de producto ----
  getIngredientes:   (producto_id)        => API._req('GET',    `/productos_ingredientes.php?producto_id=${producto_id}`),
  addIngrediente:    (data)               => API._req('POST',   '/productos_ingredientes.php', data),
  deleteIngrediente: (id)                 => API._req('DELETE', `/productos_ingredientes.php?id=${id}`),

  // ---- Pedidos ----
  createOrder: (items, tiempo) => API._req('POST', '/orders.php', { items, tiempo }),
  createVenta: (items) => API._req('POST', '/ventas.php', { items }),
  getVentasHoy: () => API._req('GET', '/ventas.php'),
  getOrders:   (params = {})   => {
    const qs = new URLSearchParams(params).toString();
    return API._req('GET', `/orders.php${qs ? '?' + qs : ''}`);
  },
  markDone: (id) => API._req('PUT', `/orders.php?id=${id}`),

  // ---- Ubicacion ----
  getLocation:    ()     => API._req('GET',  '/location.php'),
  updateLocation: (data) => API._req('POST', '/location.php', data),

  // ---- Admin ----
  getDashboard:   () => API._req('GET', '/admin.php?action=dashboard'),
  getStockAlerts: () => API._req('GET', '/admin.php?action=stock_alerts'),

  // ---- Egresos ----
  getEgresos:  (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return API._req('GET', `/egresos.php${qs ? '?' + qs : ''}`);
  },
  getGrafico:        (tipo, periodo) => API._req('GET', `/egresos.php?action=grafico&tipo=${tipo}&periodo=${periodo}`),
  getRankingVentas:  (periodo)       => API._req('GET', `/egresos.php?action=ranking_ventas&periodo=${periodo}`),
  getRankingEgresos: (periodo)       => API._req('GET', `/egresos.php?action=ranking_egresos&periodo=${periodo}`),
  createEgreso: (data)               => API._req('POST',   '/egresos.php', data),
  deleteEgreso: (id)                 => API._req('DELETE', `/egresos.php?id=${id}`),

  // ---- Inventario ----
  getInventario:  ()         => API._req('GET',    '/inventario.php'),
  comprarItem:    (data)     => API._req('POST',   '/inventario.php', data),
  editarItem:     (id, data) => API._req('PUT',    `/inventario.php?id=${id}`, data),
  updateMinimo:   (id, min)  => API._req('GET',    `/inventario.php?action=minimo&id=${id}&minimo=${min}`),
  eliminarItem:   (id)       => API._req('DELETE', `/inventario.php?id=${id}`),

  // ---- Proveedores ----
  getProveedores:  ()     => API._req('GET',    '/proveedores.php'),
  createProveedor: (data) => API._req('POST',   '/proveedores.php', data),
  deleteProveedor: (id)   => API._req('DELETE', `/proveedores.php?id=${id}`),
};
