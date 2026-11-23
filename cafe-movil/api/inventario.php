<?php
// ============================================================
// api/inventario.php
// ============================================================

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';

jsonHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if      ($method === 'GET'    && $action === 'minimo') updateMinimo();
elseif  ($method === 'GET')    listInventario();
elseif  ($method === 'POST')   comprarItem();
elseif  ($method === 'PUT')    editarItem();
elseif  ($method === 'DELETE') eliminarItem();
else    fail('Metodo no permitido', 405);

// ----------------------------
function listInventario() {
    global $conexion;
    requireAdmin();
    $result = $conexion->query("
        SELECT i.id, i.nombre, i.cantidad, i.stock_minimo, i.unidad,
               i.precio_unitario, i.updated_at,
               i.proveedor_id,
               p.nombre   AS proveedor_nombre,
               p.contacto AS proveedor_contacto
        FROM inventario i
        LEFT JOIN proveedores p ON p.id = i.proveedor_id
        ORDER BY i.nombre
    ");
    if (!$result) fail('Error SQL: ' . $conexion->error);
    $rows = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    ok($rows);
}

// ----------------------------
function comprarItem() {
    global $conexion;
    requireAdmin();
    $body    = bodyJson();
    $nombre  = trim($body['nombre']  ?? '');
    $cantidad = (float)($body['cantidad'] ?? 0);
    $precio  = (int)($body['precio_unitario'] ?? 0);
    $provId  = !empty($body['proveedor_id']) ? (int)$body['proveedor_id'] : null;
    $unidad  = in_array($body['unidad'] ?? '', ['g','ml']) ? $body['unidad'] : 'g';

    if (!$nombre)       fail('El nombre es requerido');
    if ($cantidad <= 0) fail('La cantidad debe ser mayor a 0');
    if ($precio <= 0)   fail('El precio unitario debe ser mayor a 0');

    $monto = (int)round($cantidad * $precio);

    $check = $conexion->prepare("SELECT id, cantidad FROM inventario WHERE nombre=?");
    $check->bind_param("s", $nombre);
    $check->execute();
    $existing = $check->get_result()->fetch_assoc();

    if ($existing) {
        $nuevaCantidad = $existing['cantidad'] + $cantidad;
        $upd = $conexion->prepare("UPDATE inventario SET cantidad=?, precio_unitario=?, proveedor_id=? WHERE id=?");
        $upd->bind_param("diii", $nuevaCantidad, $precio, $provId, $existing['id']);
        $upd->execute();
        $itemId = $existing['id'];
    } else {
        $ins = $conexion->prepare("INSERT INTO inventario (nombre, cantidad, unidad, precio_unitario, proveedor_id) VALUES (?,?,?,?,?)");
        $ins->bind_param("sdsii", $nombre, $cantidad, $unidad, $precio, $provId);
        $ins->execute();
        $itemId = $conexion->insert_id;
    }

    $concepto = "Compra inventario: {$nombre} x{$cantidad}{$unidad}";
    $egrIns = $conexion->prepare("INSERT INTO egresos (concepto, monto, tipo, inventario_id) VALUES (?,?,'inventario',?)");
    $egrIns->bind_param("sii", $concepto, $monto, $itemId);
    $egrIns->execute();

    ok(['item_id' => $itemId, 'egreso_id' => $conexion->insert_id, 'monto' => $monto], 201);
}

// ----------------------------
function editarItem() {
    global $conexion;
    requireAdmin();
    $id      = (int)($_GET['id'] ?? 0);
    $body    = bodyJson();
    $nombre  = trim($body['nombre']  ?? '');
    $cantidad = (float)($body['cantidad'] ?? 0);
    $precio  = (int)($body['precio_unitario'] ?? 0);
    $minimo  = (float)($body['stock_minimo'] ?? 0);
    $unidad  = in_array($body['unidad'] ?? '', ['g','ml']) ? $body['unidad'] : 'g';
    $provId  = !empty($body['proveedor_id']) ? (int)$body['proveedor_id'] : null;

    if ($id <= 0 || !$nombre || $precio <= 0) fail('Datos invalidos');

    $stmt = $conexion->prepare("UPDATE inventario SET nombre=?, cantidad=?, stock_minimo=?, unidad=?, precio_unitario=?, proveedor_id=? WHERE id=?");
    $stmt->bind_param("sddsiis", $nombre, $cantidad, $minimo, $unidad, $precio, $provId, $id);

    // corregir tipos: s=string d=double i=int
    $stmt = $conexion->prepare("UPDATE inventario SET nombre=?, cantidad=?, stock_minimo=?, unidad=?, precio_unitario=?, proveedor_id=? WHERE id=?");
    $stmt->bind_param("sddisii", $nombre, $cantidad, $minimo, $unidad, $precio, $provId, $id);
    $stmt->execute();

    if ($conexion->affected_rows === 0) fail('Item no encontrado o sin cambios', 404);
    ok(['updated' => $id]);
}

// ----------------------------
function updateMinimo() {
    global $conexion;
    requireAdmin();
    $id     = (int)($_GET['id']     ?? 0);
    $minimo = (float)($_GET['minimo'] ?? 0);
    if ($id <= 0) fail('ID invalido');

    $stmt = $conexion->prepare("UPDATE inventario SET stock_minimo=? WHERE id=?");
    $stmt->bind_param("di", $minimo, $id);
    $stmt->execute();
    ok(['updated' => $id, 'stock_minimo' => $minimo]);
}

// ----------------------------
function eliminarItem() {
    global $conexion;
    requireAdmin();
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) fail('ID invalido');
    $stmt = $conexion->prepare("DELETE FROM inventario WHERE id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    if ($conexion->affected_rows === 0) fail('Item no encontrado', 404);
    ok(['deleted' => $id]);
}
