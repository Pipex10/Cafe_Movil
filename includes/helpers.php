<?php
// ============================================================
// includes/helpers.php — Utilidades compartidas
// ============================================================

function jsonHeaders() {
    header('Content-Type: application/json; charset=utf-8');
}

function ok($data = null, $code = 200) {
    http_response_code($code);
    echo json_encode(['ok' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

function fail($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function bodyJson() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function startSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

function currentUser() {
    startSession();
    return $_SESSION['user'] ?? null;
}

function requireAuth() {
    $user = currentUser();
    if (!$user) fail('No autorizado', 401);
    return $user;
}

function requireAdmin() {
    $user = requireAuth();
    if ($user['rol'] !== 'admin') fail('Acceso denegado', 403);
    return $user;
}

function requireVendedor() {
    $user = requireAuth();
    if ($user['rol'] !== 'vendedor') fail('Acceso denegado', 403);
    return $user;
}

// admin o vendedor: usado en endpoints que ambos necesitan,
// como las alertas de stock bajo
function requireStaff() {
    $user = requireAuth();
    if (!in_array($user['rol'], ['admin', 'vendedor'])) fail('Acceso denegado', 403);
    return $user;
}
