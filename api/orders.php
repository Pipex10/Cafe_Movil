<?php
// ============================================================
// api/orders.php
// ============================================================

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/OrderBuilder.php';

jsonHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if      ($method === 'POST') createOrder();
elseif  ($method === 'GET')  listOrders();
elseif  ($method === 'PUT')  markDone();
else    fail('Metodo no permitido', 405);

// ----------------------------
function createOrder() {
    global $conexion;
    $user   = requireAuth();
    $body   = bodyJson();
    $items  = $body['items']  ?? [];
    $tiempo = (int)($body['tiempo'] ?? 0);

    if (empty($items)) fail('Selecciona al menos un producto');

    try {
        $pedido = (new OrderBuilder($conexion))
            ->setUsuario($user['id'])
            ->setItems($items)
            ->setTiempo($tiempo)
            ->recalcularPrecios()
            ->generarCodigo()
            ->build();
    } catch (Exception $e) {
        fail($e->getMessage());
    }

    // El pedido se guarda y el inventario se descuenta en una sola
    // transaccion: si falta un solo ingrediente, nada se guarda y
    // el cliente no puede completar el pedido.
    $conexion->begin_transaction();
    try {
        $stmt = $conexion->prepare("CALL sp_descontar_producto(?, ?)");
        foreach ($pedido['items'] as $item) {
            $productoId = (int)$item['id'];
            $qty        = (int)$item['qty'];
            $stmt->bind_param("ii", $productoId, $qty);
            $stmt->execute();
            while ($conexion->more_results() && $conexion->next_result()) { /* noop */ }
        }

        $ins = $conexion->prepare(
            "INSERT INTO pedidos (codigo, usuario_id, detalle, items_json, total, tiempo_minutos)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $ins->bind_param("sissii",
            $pedido['codigo'], $pedido['usuario_id'], $pedido['detalle'],
            $pedido['items_json'], $pedido['total'], $pedido['tiempo']
        );
        $ins->execute();
        $insertId = $conexion->insert_id;

        $conexion->commit();
    } catch (\mysqli_sql_exception $e) {
        $conexion->rollback();
        // Mensaje del SIGNAL en sp_descontar_producto, ej:
        // "Inventario insuficiente para preparar el producto"
        fail($e->getMessage());
    }

    ok([
        'id'     => $insertId,
        'codigo' => $pedido['codigo'],
        'total'  => $pedido['total'],
        'tiempo' => $pedido['tiempo'],
        'items'  => $pedido['items'],
    ], 201);
}

// ----------------------------
function listOrders() {
    global $conexion;
    requireAdmin();

    $where  = ["1=1"];
    $params = [];
    $types  = "";

    if (isset($_GET['estado']) && in_array($_GET['estado'], ['pendiente','realizado'])) {
        $where[]  = "p.estado = ?";
        $params[] = $_GET['estado'];
        $types   .= "s";
    }

    if (isset($_GET['mes'], $_GET['anio'])) {
        $where[]  = "MONTH(p.created_at) = ?";
        $where[]  = "YEAR(p.created_at) = ?";
        $params[] = (int)$_GET['mes'];
        $params[] = (int)$_GET['anio'];
        $types   .= "ii";
        if (!isset($_GET['estado'])) {
            $where[] = "p.estado = 'realizado'";
        }
    }

    $sql = "SELECT p.id, p.codigo, p.detalle, p.total, p.tiempo_minutos,
                   p.estado, p.origen, p.created_at,
                   u.nombre AS cliente_nombre, u.email AS cliente_email
            FROM pedidos p
            JOIN usuarios u ON u.id = p.usuario_id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY p.created_at DESC";

    if (!empty($params)) {
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $conexion->query($sql);
    }

    $rows = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    ok($rows);
}

// ----------------------------
// markDone: marca el pedido como realizado (el inventario ya se
// descuenta al crear el pedido, ver createOrder)
// ----------------------------
function markDone() {
    global $conexion;
    requireAdmin();

    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) fail('ID invalido');

    // Obtener el pedido y verificar que no este ya realizado
    $check = $conexion->prepare("SELECT estado, items_json FROM pedidos WHERE id=?");
    $check->bind_param("i", $id);
    $check->execute();
    $pedido = $check->get_result()->fetch_assoc();

    if (!$pedido) fail('Pedido no encontrado', 404);
    if ($pedido['estado'] === 'realizado') fail('El pedido ya fue marcado como realizado');

    // El inventario ya se descuenta al CREAR el pedido (ver createOrder),
    // asi que aqui solo se actualiza el estado. No se vuelve a tocar
    // el inventario para no descontarlo dos veces.
    $upd = $conexion->prepare("UPDATE pedidos SET estado='realizado' WHERE id=?");
    $upd->bind_param("i", $id);
    $upd->execute();

    ok(['updated' => $id]);
}

// ----------------------------
// Descuenta del inventario los ingredientes usados en cada item del pedido
// ----------------------------
// descontarInventario() se elimino: el descuento y la validacion de
// stock ahora ocurren en createOrder(), con sp_descontar_producto().
