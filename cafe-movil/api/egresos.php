<?php
// ============================================================
// api/egresos.php
// ============================================================

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';

jsonHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if      ($method === 'GET' && $action === 'grafico')         getGrafico();
elseif  ($method === 'GET' && $action === 'ranking_egresos') getRankingEgresos();
elseif  ($method === 'GET' && $action === 'ranking_ventas')  getRankingVentas();
elseif ($method === 'GET')    listEgresos();
elseif ($method === 'POST')   createEgreso();
elseif ($method === 'DELETE') deleteEgreso();
else fail('Metodo no permitido', 405);

// ----------------------------
function listEgresos() {
    global $conexion;
    requireAdmin();

    $conditions = [];
    $params     = [];
    $types      = "";

    if (isset($_GET['mes']) && isset($_GET['anio'])) {
        $conditions[] = "MONTH(e.created_at) = ?";
        $conditions[] = "YEAR(e.created_at) = ?";
        $params[]     = (int)$_GET['mes'];
        $params[]     = (int)$_GET['anio'];
        $types       .= "ii";
    }

    $periodo = $_GET['periodo'] ?? null;
    if ($periodo === '7d') {
        $conditions[] = "e.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } elseif ($periodo === 'mes') {
        $conditions[] = "MONTH(e.created_at) = MONTH(NOW()) AND YEAR(e.created_at) = YEAR(NOW())";
    } elseif ($periodo === '12m') {
        $conditions[] = "e.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)";
    }

    $where = count($conditions) ? implode(' AND ', $conditions) : '1=1';

    $sql = "SELECT e.id, e.concepto, e.monto, e.tipo, e.created_at,
                   i.nombre AS item_nombre
            FROM egresos e
            LEFT JOIN inventario i ON i.id = e.inventario_id
            WHERE $where
            ORDER BY e.created_at DESC";

    if (!empty($params)) {
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $conexion->query($sql);
    }

    if (!$result) fail('Error SQL: ' . $conexion->error);

    $rows = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    ok($rows);
}

// ----------------------------
function getGrafico() {
    global $conexion;
    requireAdmin();

    $periodo = $_GET['periodo'] ?? '7d';
    $tipo    = $_GET['tipo']    ?? 'egresos';

    if ($tipo === 'ingresos') {
        if ($periodo === '7d') {
            $sql = "SELECT DATE(created_at) AS fecha, SUM(total) AS valor
                    FROM pedidos WHERE estado='realizado'
                    AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    GROUP BY DATE(created_at) ORDER BY fecha";
        } elseif ($periodo === 'mes') {
            $sql = "SELECT DATE(created_at) AS fecha, SUM(total) AS valor
                    FROM pedidos WHERE estado='realizado'
                    AND MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())
                    GROUP BY DATE(created_at) ORDER BY fecha";
        } else {
            $sql = "SELECT DATE_FORMAT(created_at,'%Y-%m') AS fecha, SUM(total) AS valor
                    FROM pedidos WHERE estado='realizado'
                    AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                    GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY fecha";
        }
    } else {
        if ($periodo === '7d') {
            $sql = "SELECT DATE(created_at) AS fecha, SUM(monto) AS valor
                    FROM egresos
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    GROUP BY DATE(created_at) ORDER BY fecha";
        } elseif ($periodo === 'mes') {
            $sql = "SELECT DATE(created_at) AS fecha, SUM(monto) AS valor
                    FROM egresos
                    WHERE MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())
                    GROUP BY DATE(created_at) ORDER BY fecha";
        } else {
            $sql = "SELECT DATE_FORMAT(created_at,'%Y-%m') AS fecha, SUM(monto) AS valor
                    FROM egresos
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                    GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY fecha";
        }
    }

    $result = $conexion->query($sql);
    if (!$result) fail('Error SQL: ' . $conexion->error);

    $rows = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    ok($rows);
}

// ----------------------------
// getRankingEgresos: agrupa por concepto_gasto y suma montos
// ----------------------------
function getRankingEgresos() {
    global $conexion;
    requireAdmin();

    $periodo = $_GET['periodo'] ?? 'mensual';

    if ($periodo === 'diario') {
        $where = "DATE(created_at) = CURDATE()";
    } elseif ($periodo === 'semanal') {
        $where = "created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } else {
        $where = "MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())";
    }

    $sql = "SELECT concepto AS concepto_gasto,
                   SUM(monto) AS total_monto,
                   COUNT(*) AS cantidad
            FROM egresos
            WHERE $where
            GROUP BY concepto
            ORDER BY total_monto DESC
            LIMIT 10";

    $result = $conexion->query($sql);
    if (!$result) fail('Error SQL: ' . $conexion->error);

    $rows = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    ok($rows);
}

// ----------------------------
// getRankingVentas: agrupa por nombre_producto y suma cantidades
// ----------------------------
function getRankingVentas() {
    global $conexion;
    requireAdmin();

    $periodo = $_GET['periodo'] ?? 'mensual';

    if ($periodo === 'diario') {
        $where = "DATE(p.created_at) = CURDATE()";
    } elseif ($periodo === 'semanal') {
        $where = "p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
    } else {
        $where = "MONTH(p.created_at) = MONTH(NOW()) AND YEAR(p.created_at) = YEAR(NOW())";
    }

   $sql = "SELECT items_json FROM pedidos p WHERE p.estado = 'realizado' AND $where";
    $result = $conexion->query($sql);
    if (!$result) fail('Error SQL: ' . $conexion->error);

    $totales = [];
    while ($row = $result->fetch_assoc()) {
        $items = json_decode($row['items_json'], true) ?? [];
        foreach ($items as $item) {
            $nombre  = $item['nombre'] ?? 'Desconocido';
            $qty     = (int)($item['qty']    ?? 1);
            $precio  = (int)($item['precio'] ?? 0);
            if (!isset($totales[$nombre])) {
                $totales[$nombre] = ['nombre_producto' => $nombre, 'total_vendido' => 0, 'total_ingresos' => 0];
            }
            $totales[$nombre]['total_vendido']  += $qty;
            $totales[$nombre]['total_ingresos'] += $precio * $qty;
        }
    }

    usort($totales, fn($a, $b) => $b['total_vendido'] - $a['total_vendido']);
    ok(array_slice(array_values($totales), 0, 10));
}

// ----------------------------
function createEgreso() {
    global $conexion;
    requireAdmin();

    $body     = bodyJson();
    $concepto = trim($body['concepto'] ?? '');
    $monto    = (int)($body['monto'] ?? 0);

    if (!$concepto) fail('El concepto es requerido');
    if ($monto <= 0) fail('El monto debe ser mayor a 0');

    $stmt = $conexion->prepare("INSERT INTO egresos (concepto, monto, tipo) VALUES (?, ?, 'manual')");
    $stmt->bind_param("si", $concepto, $monto);
    $stmt->execute();

    ok(['id' => $conexion->insert_id, 'concepto' => $concepto, 'monto' => $monto], 201);
}

// ----------------------------
function deleteEgreso() {
    global $conexion;
    requireAdmin();

    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) fail('ID invalido');

    $check = $conexion->prepare("SELECT tipo FROM egresos WHERE id = ?");
    $check->bind_param("i", $id);
    $check->execute();
    $row = $check->get_result()->fetch_assoc();
    if (!$row) fail('Egreso no encontrado', 404);
    if ($row['tipo'] === 'inventario') fail('Los egresos de inventario no se pueden eliminar directamente');

    $stmt = $conexion->prepare("DELETE FROM egresos WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    ok(['deleted' => $id]);
}
