// ============================================================
// NUEVAS FUNCIONES — pegar al final de js/app.js
// (reemplaza también renderDashboard y showAdminPanel existentes)
// ============================================================

// ============================================================
// DASHBOARD — reemplaza la función renderDashboard existente
// ============================================================
async function renderDashboard() {
  try {
    const stats = await API.getDashboard();

    // Pedidos
    document.getElementById('stat-total').textContent   = stats.total;
    document.getElementById('stat-pending').textContent = stats.pendientes;

    // Resumen financiero del DIA
    document.getElementById('stat-ingresos-hoy').textContent = '$' + stats.ingresos_hoy.toLocaleString('es-CO');
    document.getElementById('stat-egresos-hoy').textContent  = '$' + stats.egresos_hoy.toLocaleString('es-CO');
    const balHoy = document.getElementById('stat-balance-hoy');
    balHoy.textContent = '$' + Math.abs(stats.balance_hoy).toLocaleString('es-CO');
    balHoy.style.color = stats.balance_hoy >= 0 ? 'var(--gold)' : '#e05252';

    // Resumen financiero del MES
    document.getElementById('stat-ingresos-mes').textContent = '$' + stats.ingresos_mes.toLocaleString('es-CO');
    document.getElementById('stat-egresos-mes').textContent  = '$' + stats.egresos_mes.toLocaleString('es-CO');
    const balMes = document.getElementById('stat-balance-mes');
    balMes.textContent = '$' + Math.abs(stats.balance_mes).toLocaleString('es-CO');
    balMes.style.color = stats.balance_mes >= 0 ? 'var(--gold)' : '#e05252';

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

// ============================================================
// RANKING DE VENTAS (panel de ingresos)
// ============================================================
async function renderRankingVentas() {
  // Lee el mismo selector que usa la gráfica
  const sel = document.getElementById('periodo-ingresos');
  const periodoGrafica = sel?.value || '7d';
  // Mapear los valores del selector de gráfica al formato que acepta el backend
  const periodoMap = { '7d': 'semanal', 'mes': 'mensual', '12m': 'mensual' };
  const periodo = periodoMap[periodoGrafica] || 'mensual';
  const container = document.getElementById('ranking-ventas-bars');
  if (!container) return;

  container.innerHTML = '<p style="font-family:var(--ff-mono);font-size:0.75rem;color:var(--gray-dk);padding:16px 0;">Cargando...</p>';

  try {
    const data = await API.getRankingVentas(periodo);

    if (!data || data.length === 0) {
      container.innerHTML = '<p style="font-family:var(--ff-mono);font-size:0.75rem;color:var(--gray-dk);padding:16px 0;">Sin datos para este periodo</p>';
      return;
    }

    const maxVal = Math.max(...data.map(d => parseInt(d.total_vendido)));

    container.innerHTML = data.map((item, i) => {
      const pct = maxVal > 0 ? Math.round((parseInt(item.total_vendido) / maxVal) * 100) : 0;
      return `
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;">
            <span style="font-size:0.82rem;font-weight:600;color:var(--black);black-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%;">${item.nombre_producto}</span>
            <span style="font-family:var(--ff-mono);font-size:0.72rem;color:var(--gold);black-space:nowrap;margin-left:8px;">${parseInt(item.total_vendido)} unidades · $${parseInt(item.total_ingresos).toLocaleString('es-CO')}</span>
          </div>
          <div style="background:var(--gray);border:1px solid var(--border);height:10px;border-radius:2px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--gold) 0%,#f0d060 100%);border-radius:2px;transition:width 0.6s cubic-bezier(.25,.8,.25,1);animation:rankBar 0.7s ${i * 0.08}s both;"></div>
          </div>
          <div style="text-align:right;font-family:var(--ff-mono);font-size:0.65rem;color:var(--gray-dk);margin-top:3px;">${pct}%</div>
        </div>`;
    }).join('');
  } catch (e) {
    container.innerHTML = '<p style="font-family:var(--ff-mono);font-size:0.75rem;color:#e05252;padding:16px 0;">Error al cargar ranking</p>';
  }
}

// ============================================================
// RANKING DE EGRESOS (panel de egresos)
// ============================================================
async function renderRankingEgresos() {
  // Lee el mismo selector que usa la gráfica
  const sel = document.getElementById('periodo-egresos');
  const periodoGrafica = sel?.value || '7d';
  const periodoMap = { '7d': 'semanal', 'mes': 'mensual', '12m': 'mensual' };
  const periodo = periodoMap[periodoGrafica] || 'mensual';
  const container = document.getElementById('ranking-egresos-bars');
  if (!container) return;

  container.innerHTML = '<p style="font-family:var(--ff-mono);font-size:0.75rem;color:var(--gray-dk);padding:16px 0;">Cargando...</p>';

  try {
    const data = await API.getRankingEgresos(periodo);

    if (!data || data.length === 0) {
      container.innerHTML = '<p style="font-family:var(--ff-mono);font-size:0.75rem;color:var(--gray-dk);padding:16px 0;">Sin datos para este periodo</p>';
      return;
    }

    const maxVal = Math.max(...data.map(d => parseInt(d.total_monto)));

    container.innerHTML = data.map((item, i) => {
      const pct = maxVal > 0 ? Math.round((parseInt(item.total_monto) / maxVal) * 100) : 0;
      return `
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;">
            <span style="font-size:0.82rem;font-weight:600;color:var(--black);black-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:60%;">${item.concepto_gasto}</span>
            <span style="font-family:var(--ff-mono);font-size:0.72rem;color:#e05252;black-space:nowrap;margin-left:8px;">${item.cantidad}x · $${parseInt(item.total_monto).toLocaleString('es-CO')}</span>
          </div>
          <div style="background:var(--gray);border:1px solid var(--border);height:10px;border-radius:2px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#e05252 0%,#f07070 100%);border-radius:2px;transition:width 0.6s cubic-bezier(.25,.8,.25,1);animation:rankBar 0.7s ${i * 0.08}s both;"></div>
          </div>
          <div style="text-align:right;font-family:var(--ff-mono);font-size:0.65rem;color:var(--gray-dk);margin-top:3px;">${pct}%</div>
        </div>`;
    }).join('');
  } catch (e) {
    container.innerHTML = '<p style="font-family:var(--ff-mono);font-size:0.75rem;color:#e05252;padding:16px 0;">Error al cargar ranking</p>';
  }
}

// ============================================================
// CONTABILIDAD — INGRESOS
// ============================================================
let chartIngresos = null;

async function renderContabilidadIngresos() {
  const periodo = document.getElementById('periodo-ingresos')?.value || '7d';
  const mes     = document.getElementById('filter-mes-ingresos')?.value  || new Date().getMonth() + 1;
  const anio    = document.getElementById('filter-anio-ingresos')?.value || new Date().getFullYear();
  const tbody   = document.getElementById('tbody-ingresos');

  // Tabla
  try {
    const orders   = await API.getOrders({ mes, anio, estado: 'realizado' });
    const total    = orders.length;
    const ingresos = orders.reduce((s, o) => s + parseInt(o.total), 0);
    const avg      = total ? Math.round(ingresos / total) : 0;

    document.getElementById('cont-total-pedidos').textContent = total;
    document.getElementById('cont-ingresos-total').textContent = '$' + ingresos.toLocaleString('es-CO');
    document.getElementById('cont-promedio').textContent       = '$' + avg.toLocaleString('es-CO');

    tbody.innerHTML = orders.length ? orders.map(o => `
      <tr>
        <td><span class="mono" style="font-size:0.78rem;">${o.codigo}</span></td>
        <td>${o.cliente_nombre}</td>
        <td style="font-size:0.82rem;">${o.detalle}</td>
        <td><strong>$${Number(o.total).toLocaleString('es-CO')}</strong></td>
        <td style="font-family:var(--ff-mono);font-size:0.72rem;">${new Date(o.created_at).toLocaleString('es-CO')}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="5" style="text-align:center;color:var(--gray-dk);padding:32px;font-family:var(--ff-mono);font-size:0.8rem;">Sin ingresos en este periodo</td></tr>';
  } catch { /* ok */ }

  // Grafico
  try {
    const datos = await API.getGrafico('ingresos', periodo);
    renderLineChart('chart-ingresos', datos, 'Ingresos COP', '#d9b945', chartIngresos,
      c => { chartIngresos = c; });
  } catch { /* ok */ }

  // Ranking ventas
  renderRankingVentas();
}

// ============================================================
// CONTABILIDAD — EGRESOS
// ============================================================
let chartEgresos = null;

async function renderContabilidadEgresos() {
  const periodo = document.getElementById('periodo-egresos')?.value || '7d';
  const mes     = document.getElementById('filter-mes-egresos')?.value  || new Date().getMonth() + 1;
  const anio    = document.getElementById('filter-anio-egresos')?.value || new Date().getFullYear();
  const tbody   = document.getElementById('tbody-egresos');

  // Tabla
  try {
    const egresos = await API.getEgresos({ mes, anio });
    const total   = egresos.reduce((s, e) => s + parseInt(e.monto), 0);

    document.getElementById('egr-total').textContent = '$' + total.toLocaleString('es-CO');
    document.getElementById('egr-count').textContent = egresos.length;

    tbody.innerHTML = egresos.length ? egresos.map(e => `
      <tr>
        <td style="font-size:0.82rem;">${e.concepto}</td>
        <td><strong>$${Number(e.monto).toLocaleString('es-CO')}</strong></td>
        <td><span class="badge ${e.tipo === 'inventario' ? 'badge-done' : 'badge-pending'}">${e.tipo}</span></td>
        <td style="font-family:var(--ff-mono);font-size:0.72rem;">${new Date(e.created_at).toLocaleString('es-CO')}</td>
        <td>${e.tipo === 'manual'
          ? `<button class="btn btn-danger btn-sm" onclick="deleteEgresoAdmin(${e.id})">Eliminar</button>`
          : '<span style="font-size:0.7rem;color:var(--gray-dk);">Inventario</span>'
        }</td>
      </tr>
    `).join('')
    : '<tr><td colspan="5" style="text-align:center;color:var(--gray-dk);padding:32px;font-family:var(--ff-mono);font-size:0.8rem;">Sin egresos en este periodo</td></tr>';
  } catch { /* ok */ }

  // Grafico
  try {
    const datos = await API.getGrafico('egresos', periodo);
    renderLineChart('chart-egresos', datos, 'Egresos COP', '#e05252', chartEgresos,
      c => { chartEgresos = c; });
  } catch { /* ok */ }

  // Ranking egresos
  renderRankingEgresos();
}

async function addEgresoManual() {
  const concepto = document.getElementById('egr-concepto').value.trim();
  const monto    = parseInt(document.getElementById('egr-monto').value);
  if (!concepto || isNaN(monto) || monto <= 0) { alert('Concepto y monto validos son requeridos'); return; }
  try {
    await API.createEgreso({ concepto, monto });
    document.getElementById('egr-concepto').value = '';
    document.getElementById('egr-monto').value    = '';
    renderContabilidadEgresos();
  } catch (e) { alert('Error: ' + e.message); }
}

async function deleteEgresoAdmin(id) {
  if (!confirm('Eliminar este egreso?')) return;
  try {
    await API.deleteEgreso(id);
    renderContabilidadEgresos();
  } catch (e) { alert('Error: ' + e.message); }
}

// ============================================================
// HELPER: renderizar grafico de lineas con Chart.js
// ============================================================
function renderLineChart(canvasId, datos, label, color, existingChart, setChart) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  if (existingChart) existingChart.destroy();

  const labels = datos.map(d => d.fecha);
  const values = datos.map(d => parseInt(d.valor));

  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        borderColor: color,
        backgroundColor: color + '22',
        borderWidth: 2,
        pointBackgroundColor: color,
        pointRadius: 4,
        tension: 0.3,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => '$' + ctx.parsed.y.toLocaleString('es-CO') + ' COP'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: v => '$' + v.toLocaleString('es-CO'),
            font: { family: 'IBM Plex Mono', size: 10 },
            color: '#888'
          },
          grid: { color: '#2a2a2a' }
        },
        x: {
          ticks: { font: { family: 'IBM Plex Mono', size: 10 }, color: '#888' },
          grid: { color: '#2a2a2a' }
        }
      }
    }
  });
  setChart(chart);
}

// ============================================================
// INVENTARIO
// ============================================================
let proveedoresCache = [];

async function renderInventario() {
  // Cargar proveedores para el selector
  try {
    proveedoresCache = await API.getProveedores();
    const sel = document.getElementById('inv-proveedor-sel');
    if (sel) {
      sel.innerHTML = '<option value="">Sin proveedor</option>' +
        proveedoresCache.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    }
  } catch { /* ok */ }

  const tbody = document.getElementById('tbody-inventario');
  try {
    const items = await API.getInventario();
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--gray-dk);padding:32px;font-family:var(--ff-mono);font-size:0.8rem;">Sin items en inventario</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(item => `
      <tr>
        <td><strong>${item.nombre}</strong></td>
        <td style="font-family:var(--ff-mono);">${parseFloat(item.cantidad)}</td>
        <td style="font-family:var(--ff-mono);">$${Number(item.precio_unitario).toLocaleString('es-CO')}</td>
        <td>
          ${item.proveedor_nombre
            ? `<button class="btn btn-outline btn-sm" onclick="showProveedorInfo(${item.proveedor_id})">${item.proveedor_nombre}</button>`
            : '<span style="color:var(--gray-dk);font-size:0.8rem;">—</span>'
          }
        </td>
        <td style="font-family:var(--ff-mono);font-size:0.7rem;">${new Date(item.updated_at).toLocaleString('es-CO')}</td>
        <td><button class="btn btn-danger btn-sm" onclick="eliminarItemInventario(${item.id})">Eliminar</button></td>
      </tr>
    `).join('');
  } catch { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;">Error cargando inventario</td></tr>'; }
}

async function registrarCompra() {
  const nombre   = document.getElementById('inv-nombre').value.trim();
  const cantidad = parseFloat(document.getElementById('inv-cantidad').value);
  const precio   = parseInt(document.getElementById('inv-precio').value);
  const provId   = document.getElementById('inv-proveedor-sel').value || null;

  if (!nombre || isNaN(cantidad) || cantidad <= 0 || isNaN(precio) || precio <= 0) {
    alert('Nombre, cantidad y precio son requeridos'); return;
  }

  try {
    const res = await API.comprarItem({ nombre, cantidad, precio_unitario: precio, proveedor_id: provId });
    alert(`Compra registrada. Egreso automatico creado: $${res.monto.toLocaleString('es-CO')} COP`);
    document.getElementById('inv-nombre').value    = '';
    document.getElementById('inv-cantidad').value  = '';
    document.getElementById('inv-precio').value    = '';
    document.getElementById('inv-proveedor-sel').value = '';
    renderInventario();
  } catch (e) { alert('Error: ' + e.message); }
}

async function eliminarItemInventario(id) {
  if (!confirm('Eliminar este item del inventario?')) return;
  try {
    await API.eliminarItem(id);
    renderInventario();
  } catch (e) { alert('Error: ' + e.message); }
}

function showProveedorInfo(provId) {
  const p = proveedoresCache.find(p => p.id == provId);
  if (!p) return;
  document.getElementById('modal-prov-nombre').textContent   = p.nombre;
  document.getElementById('modal-prov-contacto').textContent = p.contacto;
  document.getElementById('proveedor-modal').classList.remove('hidden');
}

function closeProveedorModal() {
  document.getElementById('proveedor-modal').classList.add('hidden');
}

// ============================================================
// PROVEEDORES (gestion dentro del panel inventario)
// ============================================================
async function renderProveedores() {
  const tbody = document.getElementById('tbody-proveedores');
  try {
    const provs = await API.getProveedores();
    proveedoresCache = provs;
    tbody.innerHTML = provs.length ? provs.map(p => `
      <tr>
        <td><strong>${p.nombre}</strong></td>
        <td style="font-family:var(--ff-mono);font-size:0.82rem;">${p.contacto}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteProvAdmin(${p.id})">Eliminar</button></td>
      </tr>
    `).join('')
    : '<tr><td colspan="3" style="text-align:center;color:var(--gray-dk);padding:24px;font-family:var(--ff-mono);font-size:0.8rem;">Sin proveedores registrados</td></tr>';
  } catch { /* ok */ }
}

async function addProveedor() {
  const nombre   = document.getElementById('prov-nombre').value.trim();
  const contacto = document.getElementById('prov-contacto').value.trim();
  if (!nombre || !contacto) { alert('Nombre y contacto son requeridos'); return; }
  try {
    await API.createProveedor({ nombre, contacto });
    document.getElementById('prov-nombre').value   = '';
    document.getElementById('prov-contacto').value = '';
    renderProveedores();
    // Actualizar selector en formulario de inventario
    const sel = document.getElementById('inv-proveedor-sel');
    if (sel) {
      const provs = await API.getProveedores();
      proveedoresCache = provs;
      sel.innerHTML = '<option value="">Sin proveedor</option>' +
        provs.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    }
  } catch (e) { alert('Error: ' + e.message); }
}

async function deleteProvAdmin(id) {
  if (!confirm('Eliminar este proveedor?')) return;
  try {
    await API.deleteProveedor(id);
    renderProveedores();
  } catch (e) { alert('Error: ' + e.message); }
}

// ============================================================
// showAdminPanel — reemplaza la función existente
// ============================================================
function showAdminPanel(panel) {
  const panels = ['dashboard','pendientes','realizados','cont-ingresos','cont-egresos','ubicacion','productos','inventario'];
  panels.forEach(p => {
    const el = document.getElementById('admin-' + p);
    if (el) el.classList.add('hidden');
  });

  const el = document.getElementById('admin-' + panel);
  if (el) el.classList.remove('hidden');

  document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
  const navItems = document.querySelectorAll('.admin-nav-item');
  const navMap = { dashboard: 0, pendientes: 1, realizados: 2, 'cont-ingresos': 3, 'cont-egresos': 4, ubicacion: 5, productos: 6, inventario: 7 };
  const idx = navMap[panel];
  if (idx !== undefined && navItems[idx]) navItems[idx].classList.add('active');

  const renders = {
    dashboard:        renderDashboard,
    pendientes:       renderPendientes,
    realizados:       renderRealizados,
    'cont-ingresos':  renderContabilidadIngresos,
    'cont-egresos':   renderContabilidadEgresos,
    ubicacion:        () => setTimeout(() => Maps.initAdminPreview(vehicleLocation, true), 100),
    productos:        renderAdminProductos,
    inventario:       () => { renderInventario(); renderProveedores(); },
  };
  renders[panel]?.();
}

// ============================================================
// ALERTA DE STOCK BAJO — se ejecuta en cada carga del panel
// ============================================================
let stockAlertInterval = null;

async function checkStockAlerts() {
  try {
    const alertas = await API.getStockAlerts();
    const banner  = document.getElementById('stock-alert-banner');
    const lista   = document.getElementById('stock-alert-lista');
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

// ============================================================
// PANEL PRODUCTOS — con sección de ingredientes
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
        <td style="font-size:0.78rem;">
          ${(p.ingredientes || []).map(i => `${i.cantidad}${i.unidad} ${i.insumo}`).join(', ') || '<span style="color:var(--gray-dk);">—</span>'}
        </td>
        <td style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-outline btn-sm" onclick="startEditProduct(${p.id})">Editar</button>
          <button class="btn btn-outline btn-sm" onclick="openIngredientesModal(${p.id}, '${p.nombre}')">Ingredientes</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Eliminar</button>
        </td>
      </tr>
    `).join('');
  } catch { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;">Error cargando productos</td></tr>'; }
}

// ============================================================
// MODAL DE INGREDIENTES
// ============================================================
let currentProductoId   = null;
let currentProductoNombre = null;

async function openIngredientesModal(productoId, nombre) {
  currentProductoId     = productoId;
  currentProductoNombre = nombre;

  document.getElementById('modal-ing-titulo').textContent = `Ingredientes: ${nombre}`;
  document.getElementById('ingredientes-modal').classList.remove('hidden');

  // Cargar insumos disponibles en el selector
  try {
    const items = await API.getInventario();
    const sel   = document.getElementById('ing-insumo-sel');
    sel.innerHTML = '<option value="">Selecciona insumo...</option>' +
      items.map(i => `<option value="${i.id}" data-unidad="${i.unidad}">${i.nombre} (${i.unidad})</option>`).join('');

    // Al cambiar insumo, preseleccionar unidad
    sel.onchange = () => {
      const opt = sel.options[sel.selectedIndex];
      if (opt.dataset.unidad) {
        document.getElementById('ing-unidad-sel').value = opt.dataset.unidad;
      }
    };
  } catch { /* ok */ }

  renderIngredientesModal(productoId);
}

async function renderIngredientesModal(productoId) {
  const tbody = document.getElementById('tbody-ingredientes-modal');
  try {
    const ings = await API.getIngredientes(productoId);
    tbody.innerHTML = ings.length ? ings.map(i => `
      <tr>
        <td>${i.insumo}</td>
        <td style="font-family:var(--ff-mono);">${i.cantidad}${i.unidad}</td>
        <td><button class="btn btn-danger btn-sm" onclick="removeIngrediente(${i.id})">Quitar</button></td>
      </tr>
    `).join('')
    : '<tr><td colspan="3" style="text-align:center;color:var(--gray-dk);padding:16px;font-size:0.8rem;">Sin ingredientes asignados</td></tr>';
  } catch { /* ok */ }
}

async function addIngredienteModal() {
  const invId   = parseInt(document.getElementById('ing-insumo-sel').value);
  const cantidad = parseFloat(document.getElementById('ing-cantidad').value);
  const unidad  = document.getElementById('ing-unidad-sel').value;

  if (!invId || isNaN(cantidad) || cantidad <= 0) { alert('Selecciona un insumo y una cantidad valida'); return; }

  try {
    await API.addIngrediente({ producto_id: currentProductoId, inventario_id: invId, cantidad, unidad });
    document.getElementById('ing-cantidad').value = '';
    renderIngredientesModal(currentProductoId);
    renderAdminProductos();
  } catch (e) { alert('Error: ' + e.message); }
}

async function removeIngrediente(id) {
  try {
    await API.deleteIngrediente(id);
    renderIngredientesModal(currentProductoId);
    renderAdminProductos();
  } catch (e) { alert('Error: ' + e.message); }
}

function closeIngredientesModal() {
  document.getElementById('ingredientes-modal').classList.add('hidden');
  currentProductoId = null;
}

// ============================================================
// INVENTARIO — con stock minimo editable
// ============================================================
async function renderInventario() {
  try {
    proveedoresCache = await API.getProveedores();
    const sel = document.getElementById('inv-proveedor-sel');
    if (sel) {
      sel.innerHTML = '<option value="">Sin proveedor</option>' +
        proveedoresCache.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    }
  } catch { /* ok */ }

  const tbody = document.getElementById('tbody-inventario');
  try {
    const items = await API.getInventario();
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--gray-dk);padding:32px;font-family:var(--ff-mono);font-size:0.8rem;">Sin items en inventario</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(item => {
      const bajo  = parseFloat(item.stock_minimo) > 0 && parseFloat(item.cantidad) <= parseFloat(item.stock_minimo);
      const color = bajo ? 'color:#e05252;font-weight:700;' : '';
      return `
      <tr>
        <td><strong>${item.nombre}</strong></td>
        <td style="font-family:var(--ff-mono);${color}">${parseFloat(item.cantidad)} ${item.unidad}</td>
        <td>
          <input type="number" value="${parseFloat(item.stock_minimo)}" min="0" step="1"
            style="width:80px;font-family:var(--ff-mono);font-size:0.8rem;padding:4px 6px;background:var(--gray);border:1px solid var(--border);color:var(--black
            );"
            onchange="saveMinimo(${item.id}, this.value)" />
          <span style="font-family:var(--ff-mono);font-size:0.72rem;color:var(--gray-dk);"> ${item.unidad}</span>
        </td>
        <td style="font-family:var(--ff-mono);">$${Number(item.precio_unitario).toLocaleString('es-CO')}</td>
        <td>
          ${item.proveedor_nombre
            ? `<button class="btn btn-outline btn-sm" onclick="showProveedorInfo(${item.proveedor_id})">${item.proveedor_nombre}</button>`
            : '<span style="color:var(--gray-dk);font-size:0.8rem;">—</span>'
          }
        </td>
        <td style="font-family:var(--ff-mono);font-size:0.7rem;">${new Date(item.updated_at).toLocaleString('es-CO')}</td>
        <td><button class="btn btn-danger btn-sm" onclick="eliminarItemInventario(${item.id})">Eliminar</button></td>
      </tr>`;
    }).join('');
  } catch { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;">Error cargando inventario</td></tr>'; }
}

async function saveMinimo(id, valor) {
  try {
    await API.updateMinimo(id, parseFloat(valor));
    checkStockAlerts();
  } catch (e) { alert('Error guardando minimo: ' + e.message); }
}
