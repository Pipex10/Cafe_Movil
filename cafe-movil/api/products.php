<?php
// ============================================================
// api/products.php
// ============================================================

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';

jsonHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if      ($method === 'GET')    listProducts();
elseif  ($method === 'POST')   createProduct();
elseif  ($method === 'PUT')    updateProduct();
elseif  ($method === 'DELETE') deleteProduct();
else    fail('Metodo no permitido', 405);

// ----------------------------
function listProducts() {
    global $conexion;
    $result = $conexion->query("SELECT id, nombre, precio, descripcion FROM productos WHERE activo=1 ORDER BY id");
    $rows = [];
    while ($row = $result->fetch_assoc()) {
        // Incluir ingredientes de cada producto
        $pid   = (int)$row['id'];
        $stmtI = $conexion->prepare("
            SELECT pi.id, pi.cantidad, pi.unidad, i.id AS inventario_id, i.nombre AS insumo
            FROM producto_ingredientes pi
            JOIN inventario i ON i.id = pi.inventario_id
            WHERE pi.producto_id = ?
        ");
        $stmtI->bind_param("i", $pid);
        $stmtI->execute();
        $ri = $stmtI->get_result();
        $ingredientes = [];
        while ($ing = $ri->fetch_assoc()) $ingredientes[] = $ing;
        $row['ingredientes'] = $ingredientes;
        $rows[] = $row;
    }
    ok($rows);
}

// ----------------------------
function createProduct() {
    global $conexion;
    requireAdmin();
    $body   = bodyJson();
    $nombre = trim($body['nombre'] ?? '');
    $precio = (int)($body['precio'] ?? 0);
    $desc   = trim($body['descripcion'] ?? '');

    if (!$nombre || $precio <= 0) fail('Nombre y precio validos son requeridos');

    $stmt = $conexion->prepare("INSERT INTO productos (nombre, precio, descripcion) VALUES (?,?,?)");
    $stmt->bind_param("sis", $nombre, $precio, $desc);
    $stmt->execute();
    $newId = $conexion->insert_id;

    // Guardar ingredientes si vienen en el body
    if (!empty($body['ingredientes'])) {
        saveIngredientes($newId, $body['ingredientes']);
    }

    ok(['id' => $newId, 'nombre' => $nombre, 'precio' => $precio, 'descripcion' => $desc, 'ingredientes' => []], 201);
}

// ----------------------------
function updateProduct() {
    global $conexion;
    requireAdmin();
    $id     = (int)($_GET['id'] ?? 0);
    $body   = bodyJson();
    $nombre = trim($body['nombre'] ?? '');
    $precio = (int)($body['precio'] ?? 0);
    $desc   = trim($body['descripcion'] ?? '');

    if ($id <= 0 || !$nombre || $precio <= 0) fail('Datos invalidos');

    $stmt = $conexion->prepare("UPDATE productos SET nombre=?, precio=?, descripcion=? WHERE id=? AND activo=1");
    $stmt->bind_param("sisi", $nombre, $precio, $desc, $id);
    $stmt->execute();

    // Actualizar ingredientes si vienen
    if (isset($body['ingredientes'])) {
        // Borrar los actuales y reinsertar
        $del = $conexion->prepare("DELETE FROM producto_ingredientes WHERE producto_id=?");
        $del->bind_param("i", $id);
        $del->execute();
        saveIngredientes($id, $body['ingredientes']);
    }

    ok(['id' => $id, 'nombre' => $nombre, 'precio' => $precio, 'descripcion' => $desc]);
}

// ----------------------------
function saveIngredientes(int $productoId, array $ingredientes) {
    global $conexion;
    foreach ($ingredientes as $ing) {
        $invId    = (int)($ing['inventario_id'] ?? 0);
        $cantidad = (float)($ing['cantidad'] ?? 0);
        $unidad   = in_array($ing['unidad'] ?? '', ['g','ml']) ? $ing['unidad'] : 'g';
        if (!$invId || $cantidad <= 0) continue;
        $stmt = $conexion->prepare("INSERT INTO producto_ingredientes (producto_id, inventario_id, cantidad, unidad) VALUES (?,?,?,?)");
        $stmt->bind_param("iids", $productoId, $invId, $cantidad, $unidad);
        $stmt->execute();
    }
}

// ----------------------------
function deleteProduct() {
    global $conexion;
    requireAdmin();
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) fail('ID invalido');
    $stmt = $conexion->prepare("UPDATE productos SET activo=0 WHERE id=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    if ($conexion->affected_rows === 0) fail('Producto no encontrado', 404);
    ok(['deleted' => $id]);
}
