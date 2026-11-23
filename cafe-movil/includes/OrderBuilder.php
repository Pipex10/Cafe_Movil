<?php
// ============================================================
// patron Builder
// crear un pedido implica varios pasos
// encadenados: validar items, recalcular precios desde la BD,
// calcular el total, armar el detalle en texto, generar el
// codigo QR unico, e insertar en la BD. Si todo esto vive
// junto en una funcion, es dificil de leer, testear y modificar.
//
// funcionamiento:
//   El Builder separa la construccion del pedido en metodos
//   individuales que se llaman en cadena (fluent interface).
//   Cada metodo hace una sola cosa y devuelve $this para
//   permitir el encadenamiento. Al final, build() valida
//   que todo este completo y devuelve el array listo para
//   insertar en la BD.
//
// Uso en orders.php:
//   $pedido = (new OrderBuilder($conexion))
//       ->setUsuario($user['id'])
//       ->setItems($items)
//       ->setTiempo($tiempo)
//       ->recalcularPrecios()   // consulta BD
//       ->generarCodigo()
//       ->build();
// ============================================================

class OrderBuilder {

    private mysqli $db;

    // Propiedades del pedido que se van llenando paso a paso
    private int    $usuarioId   = 0;
    private array  $itemsInput  = [];   // items tal como llegan del cliente
    private array  $itemsValidos = [];  // items verificados contra la BD
    private int    $tiempo      = 0;
    private int    $total       = 0;
    private string $detalle     = '';
    private string $codigo      = '';

    // Recibe la conexion activa (ya gestionada por el Singleton)
    public function __construct(mysqli $db) {
        $this->db = $db;
    }

    // Paso 1: asignar el usuario que hace el pedido
    public function setUsuario(int $usuarioId): static {
        $this->usuarioId = $usuarioId;
        return $this; // devuelve $this para permitir encadenamiento
    }

    // Paso 2: recibir los items enviados por el navegador
    // En este punto NO se confian los precios del cliente, solo
    // se guardan los ids y cantidades para verificar en el paso siguiente
    public function setItems(array $items): static {
        $this->itemsInput = $items;
        return $this;
    }

    // Paso 3: definir el tiempo de llegada (30, 60 o 90 minutos)
    public function setTiempo(int $tiempo): static {
        if (!in_array($tiempo, [30, 60, 90])) {
            throw new InvalidArgumentException('Tiempo de llegada invalido');
        }
        $this->tiempo = $tiempo;
        return $this;
    }

    // Paso 4: consultar la BD para obtener precios reales.
    // Calcula el total, arma el detalle en texto y filtra
    // productos inexistentes o inactivos.
    // Este es el paso mas importante de seguridad: el precio
    // nunca viene del frontend.
    public function recalcularPrecios(): static {
        if (empty($this->itemsInput)) {
            throw new RuntimeException('No hay items para procesar');
        }

        $ids          = array_map('intval', array_column($this->itemsInput, 'id'));
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $types        = str_repeat('i', count($ids));

        $stmt = $this->db->prepare(
            "SELECT id, nombre, precio FROM productos WHERE id IN ($placeholders) AND activo = 1"
        );
        $stmt->bind_param($types, ...$ids);
        $stmt->execute();
        $result = $stmt->get_result();

        // Indexar por id para busqueda rapida
        $prods = [];
        while ($row = $result->fetch_assoc()) {
            $prods[$row['id']] = $row;
        }

        $total    = 0;
        $detalles = [];
        $itemsOut = [];

        foreach ($this->itemsInput as $item) {
            $pid = (int)$item['id'];
            $qty = max(1, (int)($item['qty'] ?? 1));

            // Si el producto no existe en BD o esta inactivo, se ignora
            if (!isset($prods[$pid])) continue;

            $p      = $prods[$pid];
            $total += $p['precio'] * $qty;

            $detalles[] = "{$qty}x {$p['nombre']}";
            $itemsOut[] = [
                'id'     => $pid,
                'nombre' => $p['nombre'],
                'precio' => (int)$p['precio'],
                'qty'    => $qty,
            ];
        }

        if ($total === 0) {
            throw new RuntimeException('No se encontraron productos validos');
        }

        // Guardar resultados calculados en el builder
        $this->total       = $total;
        $this->detalle     = implode(', ', $detalles);
        $this->itemsValidos = $itemsOut;

        return $this;
    }

    // Paso 5: generar el codigo unico del pedido (ej: CF-3A7F2B1C)
    // Se genera aqui y no antes para asegurarse de que los items
    // ya fueron validados
    public function generarCodigo(): static {
        $this->codigo = 'CF-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
        return $this;
    }

    // Paso final: verificar que todos los campos obligatorios esten
    // completos y devolver el array listo para insertar en la BD.
    // Lanza una excepcion si algún paso previo fue omitido.
    public function build(): array {
        if (!$this->usuarioId)         throw new RuntimeException('Falta setUsuario()');
        if (!$this->tiempo)            throw new RuntimeException('Falta setTiempo()');
        if (empty($this->itemsValidos)) throw new RuntimeException('Falta recalcularPrecios()');
        if (!$this->codigo)            throw new RuntimeException('Falta generarCodigo()');

        return [
            'codigo'      => $this->codigo,
            'usuario_id'  => $this->usuarioId,
            'detalle'     => $this->detalle,
            'items_json'  => json_encode($this->itemsValidos),
            'total'       => $this->total,
            'tiempo'      => $this->tiempo,
            'items'       => $this->itemsValidos,
        ];
    }
}

