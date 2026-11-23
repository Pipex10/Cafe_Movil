<?php
// ============================================================
// api/proveedores.php
// GET    → listar todos (admin)
// POST   → crear proveedor (admin)
// DELETE ?id=X → eliminar (admin)
// ============================================================

if (session_status() === PHP_SESSION_NONE) session_start();
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';

jsonHeaders();

$method = $_SERVER['REQUEST_METHOD'];

if      ($method === 'GET')    listProveedores();
elseif  ($method === 'POST')   createProveedor();
elseif  ($method === 'DELETE') deleteProveedor();
else    fail('Metodo no permitido', 405);

function listProveedores() {
    global $conexion;
    requireAdmin();
    $result = $conexion->query("SELECT id, nombre, contacto, created_at FROM proveedores ORDER BY nombre");
    $rows = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    ok($rows);
}

function createProveedor() {
    global $conexion;
    requireAdmin();
    $body    = bodyJson();
    $nombre  = trim($body['nombre']  ?? '');
    $contacto = trim($body['contacto'] ?? '');
    if (!$nombre || !$contacto) fail('Nombre y contacto son requeridos');

    $stmt = $conexion->prepare("INSERT INTO proveedores (nombre, contacto) VALUES (?, ?)");
    $stmt->bind_param("ss", $nombre, $contacto);
    $stmt->execute();
    ok(['id' => $conexion->insert_id, 'nombre' => $nombre, 'contacto' => $contacto], 201);
}

function deleteProveedor() {
    global $conexion;
    requireAdmin();
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) fail('ID invalido');
    $stmt = $conexion->prepare("DELETE FROM proveedores WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    if ($conexion->affected_rows === 0) fail('Proveedor no encontrado', 404);
    ok(['deleted' => $id]);
}
