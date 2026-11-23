<?php
// ============================================================
// api/location.php — Ubicacion del vehiculo
// ============================================================

session_start();
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';

jsonHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if      ($method === 'GET')  getLocation();
elseif  ($method === 'POST') updateLocation();
else    fail('Metodo no permitido', 405);

// ----------------------------
function getLocation() {
    global $conexion;
    $result = $conexion->query("SELECT lat, lng, descripcion, updated_at FROM ubicacion WHERE id = 1");
    if ($result->num_rows === 0) fail('Sin ubicacion registrada', 404);
    $row = $result->fetch_assoc();
    ok(['lat' => (float)$row['lat'], 'lng' => (float)$row['lng'], 'descripcion' => $row['descripcion'], 'updated_at' => $row['updated_at']]);
}

// ----------------------------
function updateLocation() {
    global $conexion;
    requireAdmin();
    $body = bodyJson();
    $lat  = (float)($body['lat'] ?? 0);
    $lng  = (float)($body['lng'] ?? 0);
    $desc = trim($body['descripcion'] ?? 'Bogota, Colombia');

    if (!$lat || !$lng) fail('Coordenadas invalidas');

    $stmt = $conexion->prepare("INSERT INTO ubicacion (id, lat, lng, descripcion) VALUES (1, ?, ?, ?) ON DUPLICATE KEY UPDATE lat = VALUES(lat), lng = VALUES(lng), descripcion = VALUES(descripcion)");
    $stmt->bind_param("dds", $lat, $lng, $desc);
    $stmt->execute();

    ok(['lat' => $lat, 'lng' => $lng, 'descripcion' => $desc]);
}
