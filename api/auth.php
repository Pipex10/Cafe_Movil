<?php
// ============================================================
// api/auth.php — Login, Register, Logout, Me
// ============================================================

session_start();
require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/helpers.php';

jsonHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'POST' && $action === 'login')    doLogin();
elseif ($method === 'POST' && $action === 'register') doRegister();
elseif ($method === 'POST' && $action === 'logout')   doLogout();
elseif ($method === 'GET'  && $action === 'me')        doMe();
else fail('Accion no valida', 404);

// ----------------------------
function doLogin() {
    global $conexion;
    $body  = bodyJson();
    $email = trim(strtolower($body['email'] ?? ''));
    $pass  = $body['password'] ?? '';

    if (!$email || !$pass) fail('Completa todos los campos');

    $stmt = $conexion->prepare("SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows !== 1) fail('Correo o contrasena incorrectos', 401);

    $user = $result->fetch_assoc();

    if (!password_verify($pass, $user['password'])) fail('Correo o contrasena incorrectos', 401);

    unset($user['password']);
    $_SESSION['user'] = $user;
    ok($user);
}

// ----------------------------
function doRegister() {
    global $conexion;
    $body   = bodyJson();
    $nombre = trim($body['nombre'] ?? '');
    $email  = trim(strtolower($body['email'] ?? ''));
    $pass   = $body['password'] ?? '';

    if (!$nombre || !$email || !$pass) fail('Completa todos los campos');
    if (strlen($pass) < 6) fail('La contrasena debe tener minimo 6 caracteres');

    // Verificar duplicado
    $check = $conexion->prepare("SELECT id FROM usuarios WHERE email = ?");
    $check->bind_param("s", $email);
    $check->execute();
    if ($check->get_result()->num_rows > 0) fail('Este correo ya esta registrado');

    $hash = password_hash($pass, PASSWORD_BCRYPT);
    $ins  = $conexion->prepare("INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, 'cliente')");
    $ins->bind_param("sss", $nombre, $email, $hash);
    $ins->execute();

    $user = [
        'id'     => $conexion->insert_id,
        'nombre' => $nombre,
        'email'  => $email,
        'rol'    => 'cliente',
    ];
    $_SESSION['user'] = $user;
    ok($user, 201);
}

// ----------------------------
function doLogout() {
    session_unset();
    session_destroy();
    ok(['message' => 'Sesion cerrada']);
}

// ----------------------------
function doMe() {
    $user = currentUser();
    if (!$user) fail('No autenticado', 401);
    ok($user);
}
