// ============================================================
// js/vendedor.js — Panel de ventas de mostrador (rol vendedor)
//
// Reutiliza OrderItemPrototype (de app.js) para dibujar cada
// producto, igual que el modulo de cliente, pero con su propio
// carrito (cartVendedor) para no mezclarse con el del cliente.
// ============================================================

let cartVendedor = {};

function renderVentaProducts() {
  const list = document.getElementById('product-list-vendedor');
  if (!list) return;
  list.innerHTML = '';
  PRODUCTS.forEach(p => {
    const item = OrderItemPrototype.clone(p, cartVendedor[p.id] || 0);
    const nodo = item.render();
    // el prototipo llama a updateCart(); lo reemplazamos por la
    // version del vendedor sin tocar app.js
    nodo.querySelectorAll('.qty-btn').forEach((btn, i) => {
      btn.onclick = () => updateCartVendedor(p.id, i === 0 ? -1 : 1);
    });
    list.appendChild(nodo);
  });
  updateTotalVendedor();
}

function updateCartVendedor(productId, delta) {
  cartVendedor[productId] = Math.max(0, (cartVendedor[productId] || 0) + delta);
  const el = document.getElementById('qty-' + productId);
  if (el) el.textContent = cartVendedor[productId];
  updateTotalVendedor();
}

function updateTotalVendedor() {
  let total = 0;
  PRODUCTS.forEach(p => { total += (cartVendedor[p.id] || 0) * p.precio; });
  const el = document.getElementById('venta-total');
  if (el) el.textContent = '$' + total.toLocaleString('es-CO');
}

async function registrarVentaClick() {
  const items = PRODUCTS
    .filter(p => (cartVendedor[p.id] || 0) > 0)
    .map(p => ({ id: p.id, qty: cartVendedor[p.id] }));

  if (items.length === 0) { alert('Selecciona al menos un producto.'); return; }

  const btn = document.getElementById('btn-registrar-venta');
  btn.disabled = true;
  btn.textContent = 'Registrando...';

  try {
    await API.createVenta(items);
    cartVendedor = {};
    renderVentaProducts();
    await renderVentasHoy();
    await checkStockAlertsVendedor();
    alert('Venta registrada correctamente.');
  } catch (e) {
    // Aqui llega, por ejemplo, "Inventario insuficiente para preparar el producto"
    alert('Error: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Registrar venta';
  }
}

async function renderVentasHoy() {
  const tbody = document.getElementById('tbody-ventas-hoy');
  if (!tbody) return;
  try {
    const rows = await API.getVentasHoy();
    tbody.innerHTML = rows.length ? rows.map(r => `
      <tr>
        <td><span class="mono" style="font-size:0.75rem;">${r.codigo}</span></td>
        <td style="font-size:0.8rem;">${r.detalle}</td>
        <td><strong>$${Number(r.total).toLocaleString('es-CO')}</strong></td>
        <td style="font-family:var(--ff-mono);font-size:0.7rem;">${new Date(r.created_at).toLocaleTimeString('es-CO')}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="4" style="text-align:center;color:var(--gray-dk);padding:20px;font-family:var(--ff-mono);font-size:0.78rem;">Sin ventas registradas hoy</td></tr>';
  } catch { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;">Error cargando ventas</td></tr>'; }
}

// Misma logica que checkStockAlerts() del admin, pero apuntando
// al banner de la pagina del vendedor.
async function checkStockAlertsVendedor() {
  try {
    const alertas = await API.getStockAlerts();
    const banner  = document.getElementById('stock-alert-banner-v');
    const lista   = document.getElementById('stock-alert-lista-v');
    if (!banner || !lista) return;

    if (alertas.length === 0) {
      banner.classList.add('hidden');
      return;
    }
    lista.innerHTML = alertas.map(a =>
      `<strong>${a.nombre}</strong>: ${parseFloat(a.cantidad)}${a.unidad} (mín: ${parseFloat(a.stock_minimo)}${a.unidad})`
    ).join(' &nbsp;|&nbsp; ');
    banner.classList.remove('hidden');
  } catch { /* ok */ }
}
