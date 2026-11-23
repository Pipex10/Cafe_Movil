<?php
// ============================================================
// api/productos_ingredientes.php
// GET  ?producto_id=X  → listar ingredientes de un producto
// POST               → agregar ingrediente a un producto (admin)
// DELETE ?id=X        → eliminar ingrediente (admin)
// ============================================================

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';

jsonHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if      ($method === 'GET')    listIngredientes();
elseif  ($method === 'POST')   addIngrediente();
elseif  ($method === 'DELETE') deleteIngrediente();
else    fail('Metodo no permitido', 405);

// ----------------------------
function listIngredientes() {
    global $conexion;
    $producto_id = (int)($_GET['producto_id'] ?? 0);
    if ($producto_id <= 0) fail('producto_id requerido');

    $stmt = $conexion->prepare("
        SELECT pi.id, pi.cantidad, pi.unidad,
               i.id AS inventario_id, i.nombre AS insumo
        FROM producto_ingredientes pi
        JOIN inventario i ON i.id = pi.inventario_id
        WHERE pi.producto_id = ?
        ORDER BY i.nombre
    ");
    $stmt->bind_param("i", $producto_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $rows = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    ok($rows);
}

// ----------------------------
function addIngrediente() {
    global $conexion;
    requireAdmin();
    $body         = bodyJson();
    $producto_id  = (int)($body['producto_id']   ?? 0);
    $inventario_id= (int)($body['inventario_id'] ?? 0);
    $cantidad     = (float)($body['cantidad']    ?? 0);
    $unidad       = $body['unidad'] ?? 'g';

    if (!$producto_id || !$inventario_id || $cantidad <= 0) fail('Datos invalidos');
    if (!in_array($unidad, ['g', 'ml'])) fail('Unidad invalida');

    // Verificar si ya existe esa combinacion
    $check = $conexion->prepare("SELECT id FROM producto_ingredientes WHERE producto_id=? AND inventario_id=?");
    $check->bind_param("ii", $producto_id, $inventario_id);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        // Actualizar cantidad en lugar de duplicar
        $upd = $conexion->prepare("UPDATE producto_ingredientes SET cantidad=?, unidad=? WHERE producto_id=? AND inventario_id=?");
        $upd->bind_param("dsii", $cantidad, $unidad, $producto_id, $inventario_id);
        $upd->execute();
        ok(['updated' => true]);
    }

    $stmt = $conexion->prepare("INSERT INTO producto_ingredientes (producto_id, inventario_id, cantidad, unidad) VALUES (?,?,?,?)");
    $stmt->bind_param("iids", $producto_id, $inventario_id, $cantidad, $unidad);
    $stmt->execute();
    ok(['id' => $conexion->insert_id], 201);
}

// ----------------------------
function deleteIngrediente() {
    global $conexion;
    requireAdmin();
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) fail('ID invalido');
    $stmt = $conexion->prepare("DELETE FROM producto_ingredientes WHERE id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    if ($conexion->affected_rows === 0) fail('Ingrediente no encontrado', 404);
    ok(['deleted' => $id]);
}
