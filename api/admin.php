<?php
// ============================================================
// api/admin.php
// ============================================================

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';

jsonHeaders();

$action = $_GET['action'] ?? '';

if      ($action === 'dashboard')     getDashboard();
elseif  ($action === 'stock_alerts')  getStockAlerts();
else    fail('Accion no valida', 404);

// ----------------------------
function getDashboard() {
    global $conexion;
    requireAdmin();

    $rHoy = $conexion->query("
        SELECT COUNT(*) AS total, SUM(estado='pendiente') AS pendientes,
               SUM(CASE WHEN estado='realizado' THEN total ELSE 0 END) AS ingresos
        FROM pedidos WHERE DATE(created_at) = CURDATE()
    ");
    $hoy = $rHoy->fetch_assoc();

    $rMes = $conexion->query("
        SELECT SUM(CASE WHEN estado='realizado' THEN total ELSE 0 END) AS ingresos_mes
        FROM pedidos
        WHERE MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())
    ");
    $mes = $rMes->fetch_assoc();

    $rEgrHoy = $conexion->query("
        SELECT SUM(monto) AS egresos FROM egresos WHERE DATE(created_at)=CURDATE()
    ");
    $egrHoy = $rEgrHoy->fetch_assoc();

    $rEgrMes = $conexion->query("
        SELECT SUM(monto) AS egresos_mes FROM egresos
        WHERE MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())
    ");
    $egrMes = $rEgrMes->fetch_assoc();

    // Stock bajo
    $alertas = getStockBajo();

    $ingresosHoy = (int)($hoy['ingresos']      ?? 0);
    $ingresosMes = (int)($mes['ingresos_mes']   ?? 0);
    $egresosHoy  = (int)($egrHoy['egresos']     ?? 0);
    $egresosMes  = (int)($egrMes['egresos_mes'] ?? 0);

    ok([
        'total'          => (int)($hoy['total']      ?? 0),
        'pendientes'     => (int)($hoy['pendientes'] ?? 0),
        'ingresos_hoy'   => $ingresosHoy,
        'egresos_hoy'    => $egresosHoy,
        'balance_hoy'    => $ingresosHoy - $egresosHoy,
        'ingresos_mes'   => $ingresosMes,
        'egresos_mes'    => $egresosMes,
        'balance_mes'    => $ingresosMes - $egresosMes,
        'stock_alertas'  => $alertas,
    ]);
}

// ----------------------------
function getStockAlerts() {
    global $conexion;
    requireStaff();   // admin o vendedor
    ok(getStockBajo());
}

// ----------------------------
// Devuelve insumos cuya cantidad <= stock_minimo
// ----------------------------
function getStockBajo() {
    global $conexion;
    $result = $conexion->query("
        SELECT id, nombre, cantidad, stock_minimo, unidad
        FROM inventario
        WHERE stock_minimo > 0 AND cantidad <= stock_minimo
        ORDER BY (cantidad / stock_minimo) ASC
    ");
    if (!$result) return [];
    $rows = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    return $rows;
}
