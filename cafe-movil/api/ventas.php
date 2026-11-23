<?php
// ============================================================
// api/ventas.php
// Ventas de mostrador, registradas por el rol 'vendedor'.
//
// Se reutiliza TODO lo que ya existe:
//   - OrderBuilder para validar productos y calcular el total
//   - sp_descontar_producto para validar y descontar inventario
//     (si falta un ingrediente, rechaza la venta igual que un
//     pedido online)
//   - la tabla pedidos, con origen='vendedor' y estado='realizado'
//     de una vez (una venta de mostrador se entrega al momento)
//
// Por guardarse en 'pedidos', la venta cuenta sola para:
//   - los ingresos del dashboard (ya suman pedidos.total realizado)
//   - el historial que ve el admin en "Realizados"
//   - las alertas de stock bajo (via el trigger de inventario)
// ============================================================

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';
require_once __DIR__ . '/../includes/OrderBuilder.php';

jsonHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if      ($method === 'POST') registrarVenta();
elseif  ($method === 'GET')  listarVentasHoy();
else    fail('Metodo no permitido', 405);

// ----------------------------
function registrarVenta() {
    global $conexion;
    $user  = requireVendedor();
    $body  = bodyJson();
    $items = $body['items'] ?? [];

    if (empty($items)) fail('Selecciona al menos un producto');

    try {
        // tiempo fijo: una venta de mostrador se entrega de inmediato,
        // el campo "tiempo" no aplica, pero OrderBuilder lo exige.
        $venta = (new OrderBuilder($conexion))
            ->setUsuario($user['id'])
            ->setItems($items)
            ->setTiempo(30)
            ->recalcularPrecios()
            ->generarCodigo()
            ->build();
    } catch (Exception $e) {
        fail($e->getMessage());
    }

    // Misma logica transaccional que createOrder(): valida y
    // descuenta inventario, y si falta algo, no se guarda nada.
    $conexion->begin_transaction();
    try {
        $stmt = $conexion->prepare("CALL sp_descontar_producto(?, ?)");
        foreach ($venta['items'] as $item) {
            $productoId = (int)$item['id'];
            $qty        = (int)$item['qty'];
            $stmt->bind_param("ii", $productoId, $qty);
            $stmt->execute();
            while ($conexion->more_results() && $conexion->next_result()) { /* noop */ }
        }

        $ins = $conexion->prepare(
            "INSERT INTO pedidos (codigo, usuario_id, origen, detalle, items_json, total, tiempo_minutos, estado)
             VALUES (?, ?, 'vendedor', ?, ?, ?, ?, 'realizado')"
        );
        $ins->bind_param("sissii",
            $venta['codigo'], $venta['usuario_id'], $venta['detalle'],
            $venta['items_json'], $venta['total'], $venta['tiempo']
        );
        $ins->execute();
        $insertId = $conexion->insert_id;

        $conexion->commit();
    } catch (\mysqli_sql_exception $e) {
        $conexion->rollback();
        // ej: "Inventario insuficiente para preparar el producto"
        fail($e->getMessage());
    }

    ok([
        'id'     => $insertId,
        'codigo' => $venta['codigo'],
        'total'  => $venta['total'],
        'items'  => $venta['items'],
    ], 201);
}

// ----------------------------
// Ventas que ESTE vendedor registro hoy (para su propio panel)
// ----------------------------
function listarVentasHoy() {
    global $conexion;
    $user = requireVendedor();

    $stmt = $conexion->prepare("
        SELECT codigo, detalle, total, created_at
        FROM pedidos
        WHERE origen = 'vendedor'
          AND usuario_id = ?
          AND DATE(created_at) = CURDATE()
        ORDER BY created_at DESC
    ");
    $stmt->bind_param("i", $user['id']);
    $stmt->execute();
    $result = $stmt->get_result();

    $rows = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    ok($rows);
}
