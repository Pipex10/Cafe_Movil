<?php
// ============================================================
// includes/db.php
// PATRON: Singleton
//
// Problema que resuelve: sin este patron, cada archivo PHP que
// haga require de db.php crearia una nueva conexion a MySQL,
// desperdiciando recursos y pudiendo causar errores de limite
// de conexiones en produccion.
//
// Como funciona:
//   1. La primera vez que se llama Database::getInstance(),
//      el constructor privado abre la conexion y la guarda
//      en self::$instance.
//   2. Todas las llamadas siguientes devuelven esa misma
//      instancia ya creada, sin abrir una nueva conexion.
//   3. __clone() y __wakeup() privados evitan que alguien
//      duplique la instancia por accidente.
// ============================================================

class Database {

    // Guarda la unica instancia de esta clase
    private static ?Database $instance = null;

    // La conexion mysqli real
    private mysqli $conexion;

    // Constructor privado: solo puede llamarse desde getInstance()
    // Esto impide hacer "new Database()" desde fuera de la clase
    private function __construct() {
        $host = "localhost";
        $user = "root";
        $pass = "";
        $db   = "cafe_movil";
        $port = 3306;

        $this->conexion = new mysqli($host, $user, $pass, $db, $port);

        if ($this->conexion->connect_error) {
            header('Content-Type: application/json');
            echo json_encode(["ok" => false, "error" => "Error de conexion: " . $this->conexion->connect_error]);
            exit;
        }

        $this->conexion->set_charset("utf8");
    }

    // Bloquea la clonacion: "clone Database::getInstance()" lanzaria error
    private function __clone() {}

    // Bloquea la deserializacion: evita recrear la instancia desde un string serializado
    public function __wakeup() {}

    // Punto de acceso global a la instancia unica.
    // Si no existe aun, la crea. Si ya existe, la devuelve.
    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    // Devuelve la conexion mysqli para hacer queries
    public function getConexion(): mysqli {
        return $this->conexion;
    }
}

// Linea de compatibilidad: expone $conexion como variable global
// para que el resto de archivos (auth.php, orders.php, etc.)
// sigan funcionando sin cambios.
$conexion = Database::getInstance()->getConexion();

