// ============================================================
// js/app.js — Logica principal
// ============================================================

let currentUser     = null;
let PRODUCTS        = [];
let vehicleLocation = { lat: 4.7110, lng: -74.0721, descripcion: 'Parque de la 93 - Chapinero' };
let cart            = {};

// Estado edicion de productos
let editingProductId = null;

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  await loadProducts();
  await loadLocation();

  try {
    currentUser = await API.me();
    updateNavbar();
  } catch { /* no hay sesion */ }

  renderPublicMenu();
  showPage('landing');
});

// ============================================================
// ROUTER DE PAGINAS
// ============================================================
function showPage(page) {
  ['landing', 'order', 'admin', 'vendedor'].forEach(p =>
    document.getElementById('page-' + p).classList.add('hidden')
  );
  window.scrollTo(0, 0);

  if (page === 'landing') {
    document.getElementById('page-landing').classList.remove('hidden');
    setTimeout(() => Maps.initHero(vehicleLocation), 100);
  } else if (page === 'order') {
    document.getElementById('page-order').classList.remove('hidden');
    renderOrderProducts();
    setTimeout(() => Maps.initOrder(vehicleLocation), 120);
  } else if (page === 'admin') {
    document.getElementById('page-admin').classList.remove('hidden');
    showAdminPanel('dashboard');
  } else if (page === 'vendedor') {
    document.getElementById('page-vendedor').classList.remove('hidden');
    renderVentaProducts();
    renderVentasHoy();
    checkStockAlertsVendedor();
  }
}

// ============================================================
// DATOS INICIALES
// ============================================================
async function loadProducts() {
  try {
    PRODUCTS = await API.getProducts();
  } catch (e) {
    console.error('Error cargando productos:', e);
  }
}

async function loadLocation() {
  try {
    vehicleLocation = await API.getLocation();
  } catch { /* usar default */ }
}

// ============================================================
// AUTH
// ============================================================
function openAuthModal(tab) {
  document.getElementById('auth-modal').classList.remove('hidden');
  switchAuthTab(tab || 'login');
}
function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}
function switchAuthTab(tab) {
  document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
  document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('login-error').classList.add('hidden');
  document.getElementById('register-error').classList.add('hidden');
}
function showError(elId, msg) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.classList.remove('hidden');
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  if (!email || !pass) { showError('login-error', 'Completa todos los campos.'); return; }
  try {
    currentUser = await API.login(email, pass);
    afterLogin();
  } catch (e) {
    showError('login-error', e.message);
  }
}

async function doRegister() {
  const nombre = document.getElementById('reg-name').value.trim();
  const email  = document.getElementById('reg-email').value.trim();
  const pass   = document.getElementById('reg-pass').value;
  if (!nombre || !email || !pass) { showError('register-error', 'Completa todos los campos.'); return; }
  try {
    currentUser = await API.register(nombre, email, pass);
    afterLogin();
  } catch (e) {
    showError('register-error', e.message);
  }
}

function afterLogin() {
  closeAuthModal();
  updateNavbar();
  if (currentUser.rol === 'admin')          showPage('admin');
  else if (currentUser.rol === 'vendedor')  showPage('vendedor');
  else                                      showPage('order');
}

async function doLogout() {
  try { await API.logout(); } catch { /* ok */ }
  currentUser = null;
  cart = {};
  updateNavbar();
  showPage('landing');
}

function updateNavbar() {
  const actions = document.getElementById('nav-actions');
  if (currentUser) {
    actions.innerHTML = `
      <span id="nav-user-name">${currentUser.nombre}</span>
      ${currentUser.rol === 'admin'
        ? `<button class="btn btn-sm" onclick="showPage('admin')">Panel Admin</button>`
        : currentUser.rol === 'vendedor'
        ? `<button class="btn btn-sm" onclick="showPage('vendedor')">Panel Ventas</button>`
        : `<button class="btn btn-sm" onclick="showPage('order')">Mis pedidos</button>`
      }
      <button class="btn btn-outline btn-sm" onclick="doLogout()">Salir</button>
    `;
  } else {
    actions.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="openAuthModal('login')">Ingresar</button>
      <button class="btn btn-sm" onclick="openAuthModal('register')">Registrarse</button>
    `;
  }
}

function handleOrderFAB() {
  if (!currentUser) { openAuthModal('login'); return; }
  if (currentUser.rol === 'admin')     { showPage('admin'); return; }
  if (currentUser.rol === 'vendedor')  { showPage('vendedor'); return; }
  showPage('order');
}

// ============================================================
// PATRON: Prototype
//
// Problema que resuelve: renderPublicMenu() y renderOrderProducts()
// antes construian cada tarjeta/fila desde cero con template
// strings repetidos. Si el diseno de una tarjeta cambia, hay
// que buscarlo en varios sitios. Con Prototype, definimos UN
// objeto plantilla por tipo de elemento y clonamos ese objeto
// para cada producto, sobreescribiendo solo los datos que cambian.
//
// Como funciona:
//   1. MenuCardPrototype y OrderItemPrototype son los "prototipos":
//      objetos con la estructura base y un metodo clone() que
//      recibe los datos del producto y devuelve un nodo DOM listo.
//   2. Object.assign({}, this) copia todas las propiedades del
//      prototipo al nuevo objeto (clonacion superficial).
//   3. render() construye el elemento DOM con los datos clonados.
//   Cambiar el diseno de una tarjeta = cambiar solo el prototipo.
// ============================================================

const MenuCardPrototype = {
  // Datos que se sobreescriben en cada clon
  id: null, nombre: '', descripcion: '', precio: 0, label: '',

  // Crea un clon del prototipo con los datos del producto
  clone(producto, label) {
    const clon = Object.assign({}, this); // copia superficial del prototipo
    clon.id          = producto.id;
    clon.nombre      = producto.nombre;
    clon.descripcion = producto.descripcion;
    clon.precio      = producto.precio;
    clon.label       = label || producto.nombre.substring(0, 3).toUpperCase();
    return clon;
  },

  // Construye y devuelve el nodo DOM listo para insertar
  render() {
    const div = document.createElement('div');
    div.className = 'menu-card';
    div.innerHTML = `
      <div class="menu-card-icon">${this.label}</div>
      <p class="menu-name">${this.nombre}</p>
      <p class="menu-desc">${this.descripcion}</p>
      <p class="menu-price">$${Number(this.precio).toLocaleString('es-CO')}</p>
    `;
    return div;
  }
};

const OrderItemPrototype = {
  id: null, nombre: '', precio: 0, qty: 0,

  clone(producto, qty) {
    const clon = Object.assign({}, this);
    clon.id     = producto.id;
    clon.nombre = producto.nombre;
    clon.precio = producto.precio;
    clon.qty    = qty || 0;
    return clon;
  },

  render() {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.innerHTML = `
      <div class="product-item-left">
        <span class="product-item-name">${this.nombre}</span>
        <span class="product-item-price">$${Number(this.precio).toLocaleString('es-CO')} COP</span>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="updateCart(${this.id},-1)">-</button>
        <span class="qty-display" id="qty-${this.id}">${this.qty}</span>
        <button class="qty-btn" onclick="updateCart(${this.id},1)">+</button>
      </div>
    `;
    return div;
  }
};

// ============================================================
// MENU PUBLICO — usa MenuCardPrototype para generar cada tarjeta
// ============================================================
function renderPublicMenu() {
  const grid   = document.getElementById('menu-grid-public');
  const labels = ['ESP','LAT','CB','CAP','MAT','FRA'];
  grid.innerHTML = '';
  // Por cada producto: clonar el prototipo con sus datos y renderizar
  PRODUCTS.forEach((p, i) => {
    const tarjeta = MenuCardPrototype.clone(p, labels[i]);
    grid.appendChild(tarjeta.render());
  });
}

// ============================================================
// MODULO DE ORDEN — usa OrderItemPrototype para generar cada fila
// ============================================================
function renderOrderProducts() {
  const list = document.getElementById('product-list-order');
  list.innerHTML = '';
  // Por cada producto: clonar el prototipo con la cantidad actual del carrito
  PRODUCTS.forEach(p => {
    const item = OrderItemPrototype.clone(p, cart[p.id] || 0);
    list.appendChild(item.render());
  });
  updateTotal();
}

function updateCart(productId, delta) {
  cart[productId] = Math.max(0, (cart[productId] || 0) + delta);
  const el = document.getElementById('qty-' + productId);
  if (el) el.textContent = cart[productId];
  updateTotal();
}

function updateTotal() {
  let total = 0;
  PRODUCTS.forEach(p => { total += (cart[p.id] || 0) * p.precio; });
  document.getElementById('order-total').textContent = '$' + total.toLocaleString('es-CO');
}

async function confirmOrder() {
  const time  = document.getElementById('order-time').value;
  const items = PRODUCTS
    .filter(p => (cart[p.id] || 0) > 0)
    .map(p => ({ id: p.id, nombre: p.nombre, precio: p.precio, qty: cart[p.id] }));

  if (items.length === 0) { alert('Selecciona al menos un producto.'); return; }
  if (!time)              { alert('Selecciona tu tiempo estimado de llegada.'); return; }

  const btn = document.getElementById('btn-confirm-order');
  btn.disabled = true;
  btn.textContent = 'Procesando...';

  try {
    const order = await API.createOrder(items, parseInt(time));
    document.getElementById('qr-result').classList.remove('hidden');
    btn.classList.add('hidden');
    document.getElementById('qr-code-value').textContent  = order.codigo;
    document.getElementById('qr-time-display').textContent = time + ' minutos';

    const container = document.getElementById('qr-code-container');
    container.innerHTML = '';
    new QRCode(container, {
      text: order.codigo, width: 180, height: 180,
      colorDark: '#0e0e0e', colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H,
    });
  } catch (e) {
    alert('Error al crear el pedido: ' + e.message);
    btn.disabled = false;
    btn.textContent = 'Confirmar y obtener QR';
  }
}

function resetOrder() {
  cart = {};
  document.getElementById('qr-result').classList.add('hidden');
  const btn = document.getElementById('btn-confirm-order');
  btn.classList.remove('hidden');
  btn.disabled = false;
  btn.textContent = 'Confirmar y obtener QR';
  document.getElementById('order-time').value = '';
  document.getElementById('qr-code-container').innerHTML = '';
  renderOrderProducts();
}

// ============================================================
// PANEL ADMIN
// ============================================================
function showAdminPanel(panel) {
  ['dashboard','pendientes','realizados','contabilidad','ubicacion','productos'].forEach(p => {
    document.getElementById('admin-' + p).classList.add('hidden');
  });
  document.getElementById('admin-' + panel).classList.remove('hidden');

  document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
  const idx = ['dashboard','pendientes','realizados','contabilidad','ubicacion','productos'].indexOf(panel);
  document.querySelectorAll('.admin-nav-item')[idx]?.classList.add('active');

  const renders = {
    dashboard:    renderDashboard,
    pendientes:   renderPendientes,
    realizados:   renderRealizados,
    contabilidad: renderContabilidad,
    ubicacion:    () => setTimeout(() => Maps.initAdminPreview(vehicleLocation, true), 100),
    productos:    renderAdminProductos,
  };
  renders[panel]?.();
}

async function renderDashboard() {
  try {
    const stats = await API.getDashboard();
    document.getElementById('stat-total').textContent   = stats.total;
    document.getElementById('stat-pending').textContent = stats.pendientes;
    document.getElementById('stat-income').textContent  = '$' + stats.ingresos.toLocaleString('es-CO');
  } catch { /* ok */ }

  try {
    const orders = await API.getOrders();
    const recent = orders.slice(0, 8);
    const tbody  = document.getElementById('dash-recent-tbody');
    if (!recent.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray-dk);padding:32px;font-family:var(--ff-mono);font-size:0.8rem;">Sin pedidos aun</td></tr>';
      return;
    }
    tbody.innerHTML = recent.map(o => `
      <tr>
        <td><span class="mono" style="font-size:0.78rem;">${o.codigo}</span></td>
        <td>${o.cliente_nombre}</td>
        <td><span style="font-family:var(--ff-mono);font-size:0.75rem;">${o.tiempo_minutos} min</span></td>
        <td><span class="badge ${o.estado === 'pendiente' ? 'badge-pending' : 'badge-done'}">${o.estado}</span></td>
        <td>${o.estado === 'pendiente'
          ? `<button class="btn btn-success btn-sm" onclick="markDone(${o.id})">Marcar listo</button>`
          : '<span style="font-family:var(--ff-mono);font-size:0.7rem;color:var(--gray-dk);">Completado</span>'
        }</td>
      </tr>
    `).join('');
  } catch { /* ok */ }
}

async function renderPendientes() {
  const tbody = document.getElementById('tbody-pendientes');
  try {
    const orders = await API.getOrders({ estado: 'pendiente' });
    const sorted = orders.sort((a, b) => a.tiempo_minutos - b.tiempo_minutos);
    if (!sorted.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-dk);padding:32px;font-family:var(--ff-mono);font-size:0.8rem;">Sin pedidos pendientes</td></tr>';
      return;
    }
    tbody.innerHTML = sorted.map(o => {
      const lista = _ordenesListas.has(o.id);
      return `
      <tr id="row-orden-${o.id}">
        <td><span class="mono" style="font-size:0.78rem;">${o.codigo}</span></td>
        <td>${o.cliente_nombre}</td>
        <td style="font-size:0.82rem;">${o.detalle}</td>
        <td><strong>${o.tiempo_minutos} min</strong></td>
        <td style="font-family:var(--ff-mono);font-size:0.72rem;">${new Date(o.created_at).toLocaleTimeString('es-CO')}</td>
        <td style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          ${lista
            ? `<span class="badge badge-done" style="padding:4px 10px;font-size:0.7rem;">Lista</span>`
            : `<button class="btn btn-success btn-sm" onclick="markLista(${o.id}, '${o.codigo}')">Marcar listo</button>`
          }
          <button
            class="btn btn-sm"
            style="background:${lista ? 'var(--gold)' : 'var(--gray)'};color:${lista ? 'var(--black)' : 'var(--gray-dk)'};border:1px solid var(--border);cursor:${lista ? 'pointer' : 'not-allowed'};opacity:${lista ? '1' : '0.45'};"
            ${lista ? `onclick="openQrScanner(${o.id}, '${o.codigo}')"` : 'disabled'}
          >Entregar orden</button>
        </td>
      </tr>`;
    }).join('');
  } catch { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;">Error cargando pedidos</td></tr>'; }
}

// IDs de ordenes marcadas como "lista" (solo en memoria, se limpia al recargar)
const _ordenesListas = new Set();

// Marca visualmente como "lista" sin moverla de módulo
async function markLista(orderId, codigo) {
  _ordenesListas.add(orderId);
  await renderPendientes();
}

async function renderRealizados() {
  const tbody = document.getElementById('tbody-realizados');
  try {
    const orders = await API.getOrders({ estado: 'realizado' });
    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray-dk);padding:32px;font-family:var(--ff-mono);font-size:0.8rem;">Sin pedidos completados</td></tr>';
      return;
    }
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><span class="mono" style="font-size:0.78rem;">${o.codigo}</span></td>
        <td>${o.cliente_nombre}</td>
        <td style="font-size:0.82rem;">${o.detalle}</td>
        <td><strong>$${Number(o.total).toLocaleString('es-CO')}</strong></td>
        <td style="font-family:var(--ff-mono);font-size:0.72rem;">${new Date(o.created_at).toLocaleString('es-CO')}</td>
      </tr>
    `).join('');
  } catch { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;">Error cargando pedidos</td></tr>'; }
}

async function renderContabilidad() {
  const mes   = document.getElementById('filter-mes').value;
  const anio  = document.getElementById('filter-anio').value;
  const tbody = document.getElementById('tbody-contabilidad');
  try {
    const orders  = await API.getOrders({ mes, anio });
    const total   = orders.length;
    const ingresos = orders.reduce((s, o) => s + parseInt(o.total), 0);
    const avg     = total ? Math.round(ingresos / total) : 0;

    document.getElementById('cont-total-pedidos').textContent = total;
    document.getElementById('cont-ingresos').textContent      = '$' + ingresos.toLocaleString('es-CO');
    document.getElementById('cont-promedio').textContent      = '$' + avg.toLocaleString('es-CO');

    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray-dk);padding:32px;font-family:var(--ff-mono);font-size:0.8rem;">Sin datos para este periodo</td></tr>';
      return;
    }
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><span class="mono" style="font-size:0.78rem;">${o.codigo}</span></td>
        <td>${o.cliente_nombre}</td>
        <td style="font-size:0.82rem;">${o.detalle}</td>
        <td><strong>$${Number(o.total).toLocaleString('es-CO')}</strong></td>
        <td style="font-family:var(--ff-mono);font-size:0.72rem;">${new Date(o.created_at).toLocaleString('es-CO')}</td>
      </tr>
    `).join('');
  } catch { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;">Error cargando datos</td></tr>'; }
}

// markDone: llamado desde el flujo QR — mueve la orden a realizado
async function markDone(orderId) {
  try {
    await API.markDone(orderId);
    _ordenesListas.delete(orderId);
    await renderPendientes();
  } catch (e) { alert('Error: ' + e.message); }
}

// ============================================================
// QR SCANNER
// ============================================================
let _qrStream        = null;
let _qrRafId         = null;
let _qrTargetId      = null;
let _qrTargetCodigo  = null;

function openQrScanner(orderId, codigo) {
  _qrTargetId     = orderId;
  _qrTargetCodigo = codigo;
  document.getElementById('qr-scan-status').textContent = 'Escaneando...';
  document.getElementById('qr-scanner-modal').classList.remove('hidden');
  startQrCamera();
}

function closeQrScanner() {
  stopQrCamera();
  document.getElementById('qr-scanner-modal').classList.add('hidden');
}

async function startQrCamera() {
  const video  = document.getElementById('qr-video');
  const status = document.getElementById('qr-scan-status');
  try {
    _qrStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = _qrStream;
    video.play();
    video.addEventListener('loadeddata', () => { scanQrFrame(); }, { once: true });
  } catch (e) {
    status.textContent = 'No se pudo acceder a la camara';
  }
}

function stopQrCamera() {
  if (_qrRafId) { cancelAnimationFrame(_qrRafId); _qrRafId = null; }
  if (_qrStream) { _qrStream.getTracks().forEach(t => t.stop()); _qrStream = null; }
}

function scanQrFrame() {
  const video  = document.getElementById('qr-video');
  const canvas = document.getElementById('qr-canvas');
  if (!video || !_qrStream) return;

  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

  if (code) {
    const scanned = code.data.trim();
    stopQrCamera();
    closeQrScanner();
    // Verificar que el QR coincide con la orden activa
    if (scanned === _qrTargetCodigo) {
      openQrConfirm(_qrTargetId, _qrTargetCodigo);
    } else {
      alert(`QR no coincide.\nEsperado: ${_qrTargetCodigo}\nLeido: ${scanned}`);
    }
    return;
  }
  _qrRafId = requestAnimationFrame(scanQrFrame);
}

// ---- Modal de confirmacion de entrega ----
function openQrConfirm(orderId, codigo) {
  _qrTargetId     = orderId;
  _qrTargetCodigo = codigo;
  document.getElementById('qr-confirm-codigo').textContent = codigo;
  document.getElementById('qr-confirm-modal').classList.remove('hidden');
}

function closeQrConfirm() {
  document.getElementById('qr-confirm-modal').classList.add('hidden');
}

async function confirmQrDelivery() {
  closeQrConfirm();
  await markDone(_qrTargetId);
}

// ============================================================
// UBICACION ADMIN — click en mapa para mover marcador
// ============================================================
function setLocation(lat, lng, desc) {
  document.getElementById('admin-lat').value  = lat;
  document.getElementById('admin-lng').value  = lng;
  document.getElementById('admin-desc').value = desc;
  // Mover el marcador de preview sin guardar aun
  Maps.moveAdminMarker(lat, lng);
}

async function updateVehicleLocation() {
  const lat  = parseFloat(document.getElementById('admin-lat').value);
  const lng  = parseFloat(document.getElementById('admin-lng').value);
  const desc = document.getElementById('admin-desc').value.trim() || 'Bogota, Colombia';

  if (isNaN(lat) || isNaN(lng)) { alert('Ingresa coordenadas validas.'); return; }

  try {
    const loc = await API.updateLocation({ lat, lng, descripcion: desc });
    vehicleLocation = loc;
    Maps.updateAll(vehicleLocation);
    alert('Ubicacion actualizada correctamente.');
  } catch (e) { alert('Error: ' + e.message); }
}

// Callback que llama maps.js cuando el usuario hace clic en el mapa admin
function onAdminMapClick(lat, lng) {
  document.getElementById('admin-lat').value = lat.toFixed(7);
  document.getElementById('admin-lng').value = lng.toFixed(7);
  // Mostrar aviso visual de que hay cambios pendientes
  const btn = document.getElementById('btn-update-location');
  if (btn) {
    btn.textContent = 'Guardar ubicacion seleccionada';
    btn.style.background = 'var(--gold)';
  }
}

// ============================================================
// PRODUCTOS ADMIN — con edicion
// ============================================================
async function renderAdminProductos() {
  const tbody = document.getElementById('tbody-productos');
  try {
    PRODUCTS = await API.getProducts();
    if (!PRODUCTS.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-dk);padding:32px;font-family:var(--ff-mono);font-size:0.8rem;">Sin productos</td></tr>';
      return;
    }
    tbody.innerHTML = PRODUCTS.map(p => `
      <tr id="prod-row-${p.id}">
        <td style="font-family:var(--ff-mono);font-size:0.78rem;">${p.id}</td>
        <td><strong>${p.nombre}</strong></td>
        <td style="font-family:var(--ff-mono);">$${Number(p.precio).toLocaleString('es-CO')}</td>
        <td style="font-size:0.82rem;color:var(--gray-dk);">${p.descripcion}</td>
        <td style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-sm" onclick="startEditProduct(${p.id})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Eliminar</button>
        </td>
      </tr>
    `).join('');
  } catch { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;">Error cargando productos</td></tr>'; }
}

function startEditProduct(id) {
  const p = PRODUCTS.find(p => p.id == id);
  if (!p) return;

  editingProductId = id;

  // Cargar datos en el formulario
  document.getElementById('prod-nombre').value = p.nombre;
  document.getElementById('prod-precio').value = p.precio;
  document.getElementById('prod-desc').value   = p.descripcion;

  // Cambiar botones del formulario
  document.getElementById('btn-add-product').classList.add('hidden');
  document.getElementById('btn-update-product').classList.remove('hidden');
  document.getElementById('btn-cancel-edit').classList.remove('hidden');

  // Etiqueta de contexto
  document.getElementById('prod-form-title').textContent = `Editando: ${p.nombre}`;

  // Scroll al formulario
  document.getElementById('prod-form-title').scrollIntoView({ behavior: 'smooth' });
}

function cancelEditProduct() {
  editingProductId = null;
  document.getElementById('prod-nombre').value = '';
  document.getElementById('prod-precio').value = '';
  document.getElementById('prod-desc').value   = '';
  document.getElementById('btn-add-product').classList.remove('hidden');
  document.getElementById('btn-update-product').classList.add('hidden');
  document.getElementById('btn-cancel-edit').classList.add('hidden');
  document.getElementById('prod-form-title').textContent = 'Agregar producto';
}

async function addProduct() {
  const nombre = document.getElementById('prod-nombre').value.trim();
  const precio = parseFloat(document.getElementById('prod-precio').value);
  const desc   = document.getElementById('prod-desc').value.trim();

  if (!nombre || isNaN(precio) || precio <= 0) { alert('Nombre y precio validos son requeridos.'); return; }

  try {
    await API.createProduct({ nombre, precio, descripcion: desc });
    cancelEditProduct();
    await renderAdminProductos();
    renderPublicMenu();
  } catch (e) { alert('Error: ' + e.message); }
}

async function saveEditProduct() {
  if (!editingProductId) return;

  const nombre = document.getElementById('prod-nombre').value.trim();
  const precio = parseFloat(document.getElementById('prod-precio').value);
  const desc   = document.getElementById('prod-desc').value.trim();

  if (!nombre || isNaN(precio) || precio <= 0) { alert('Nombre y precio validos son requeridos.'); return; }

  try {
    await API.updateProduct(editingProductId, { nombre, precio, descripcion: desc });
    cancelEditProduct();
    await renderAdminProductos();
    renderPublicMenu();
  } catch (e) { alert('Error: ' + e.message); }
}

async function deleteProduct(id) {
  if (!confirm('Eliminar este producto del menu?')) return;
  try {
    await API.deleteProduct(id);
    if (editingProductId === id) cancelEditProduct();
    await renderAdminProductos();
    renderPublicMenu();
  } catch (e) { alert('Error: ' + e.message); }
}

// ============================================================
// KEYBOARD & MODAL CLOSE
// ============================================================
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAuthModal();
});
document.getElementById('auth-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeAuthModal();
});
