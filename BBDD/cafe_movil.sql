-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 22-05-2026 a las 23:29:10
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `cafe_movil`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `egresos`
--

CREATE TABLE `egresos` (
  `id` int(10) UNSIGNED NOT NULL,
  `concepto` varchar(200) NOT NULL,
  `monto` int(10) UNSIGNED NOT NULL,
  `tipo` enum('manual','inventario') NOT NULL DEFAULT 'manual',
  `inventario_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `egresos`
--

INSERT INTO `egresos` (`id`, `concepto`, `monto`, `tipo`, `inventario_id`, `created_at`) VALUES
(1, 'vasos', 15000, 'manual', NULL, '2026-05-08 22:18:17'),
(2, 'Compra inventario: Agua x1000g', 200000, 'inventario', 2, '2026-05-13 23:47:59'),
(3, 'Compra inventario: Cafe x1000g', 515000000, 'inventario', 1, '2026-05-13 23:54:17');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventario`
--

CREATE TABLE `inventario` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `cantidad` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock_minimo` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unidad` enum('g','ml') NOT NULL DEFAULT 'g',
  `precio_unitario` int(10) UNSIGNED NOT NULL,
  `proveedor_id` int(10) UNSIGNED DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `inventario`
--

INSERT INTO `inventario` (`id`, `nombre`, `cantidad`, `stock_minimo`, `unidad`, `precio_unitario`, `proveedor_id`, `updated_at`, `created_at`) VALUES
(1, 'Cafe', 5870.00, 4940.00, 'g', 515000, 2, '2026-05-22 21:21:01', '2026-05-13 19:29:40'),
(2, 'Agua', 5590.00, 4940.00, 'ml', 200, 1, '2026-05-22 21:21:01', '2026-05-13 19:29:40'),
(3, 'Leche', 4800.00, 500.00, 'ml', 8000, NULL, '2026-05-22 21:21:01', '2026-05-13 19:29:40'),
(4, 'Jarabe Vainilla', 985.00, 100.00, 'ml', 25000, NULL, '2026-05-22 21:21:01', '2026-05-13 19:29:40'),
(5, 'Caramelo', 500.00, 50.00, 'ml', 15000, NULL, '2026-05-13 19:29:40', '2026-05-13 19:29:40'),
(6, 'Matcha', 1000.00, 100.00, 'g', 60000, NULL, '2026-05-13 19:29:40', '2026-05-13 19:29:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id` int(10) UNSIGNED NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL,
  `detalle` text NOT NULL,
  `items_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`items_json`)),
  `total` int(10) UNSIGNED NOT NULL,
  `tiempo_minutos` tinyint(3) UNSIGNED NOT NULL,
  `estado` enum('pendiente','realizado') NOT NULL DEFAULT 'pendiente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `pedidos`
--

INSERT INTO `pedidos` (`id`, `codigo`, `usuario_id`, `detalle`, `items_json`, `total`, `tiempo_minutos`, `estado`, `created_at`) VALUES
(1, 'CF-C216E287', 2, '1x Espresso Clasico', '[{\"id\":1,\"nombre\":\"Espresso Clasico\",\"precio\":4500,\"qty\":1}]', 4500, 60, 'realizado', '2026-04-18 23:36:41'),
(2, 'CF-93674838', 3, '1x Espresso Clasico', '[{\"id\":1,\"nombre\":\"Espresso Clasico\",\"precio\":4500,\"qty\":1}]', 4500, 30, 'realizado', '2026-04-19 00:52:01'),
(3, 'CF-FE56A957', 3, '1x Espresso Clasico', '[{\"id\":1,\"nombre\":\"Espresso Clasico\",\"precio\":4200,\"qty\":1}]', 4200, 30, 'realizado', '2026-04-19 20:09:57'),
(4, 'CF-5F3A3A4E', 4, '1x Espresso Clasico', '[{\"id\":1,\"nombre\":\"Espresso Clasico\",\"precio\":4200,\"qty\":1}]', 4200, 60, 'realizado', '2026-05-07 21:28:57'),
(5, 'CF-BE4568E2', 5, '1x Espresso Clasico', '[{\"id\":1,\"nombre\":\"Espresso Clasico\",\"precio\":4200,\"qty\":1}]', 4200, 60, 'realizado', '2026-05-08 00:18:40'),
(6, 'CF-EC801569', 3, '1x Espresso Clasico', '[{\"id\":1,\"nombre\":\"Espresso Clasico\",\"precio\":4200,\"qty\":1}]', 4200, 60, 'realizado', '2026-05-13 19:58:48'),
(7, 'CF-44D393A9', 3, '1x Espresso Clasico', '[{\"id\":1,\"nombre\":\"Espresso Clasico\",\"precio\":4200,\"qty\":1}]', 4200, 60, 'realizado', '2026-05-13 23:40:25'),
(8, 'CF-613AECB2', 3, '1x Espresso Clasico', '[{\"id\":1,\"nombre\":\"Espresso Clasico\",\"precio\":4200,\"qty\":1}]', 4200, 30, 'realizado', '2026-05-13 23:42:09'),
(9, 'CF-5561745D', 3, '1x Espresso Clasico', '[{\"id\":1,\"nombre\":\"Espresso Clasico\",\"precio\":4200,\"qty\":1}]', 4200, 60, 'realizado', '2026-05-22 21:15:05'),
(10, 'CF-BA62AB6C', 3, '1x Latte de Vainilla, 1x Cold Brew', '[{\"id\":2,\"nombre\":\"Latte de Vainilla\",\"precio\":7500,\"qty\":1},{\"id\":3,\"nombre\":\"Cold Brew\",\"precio\":8000,\"qty\":1}]', 15500, 60, 'realizado', '2026-05-22 21:16:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `precio` int(10) UNSIGNED NOT NULL,
  `descripcion` varchar(300) DEFAULT '',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `nombre`, `precio`, `descripcion`, `activo`, `created_at`) VALUES
(1, 'Espresso Clasico', 4200, 'Concentrado intenso, 30ml de pura esencia', 1, '2026-04-18 16:14:11'),
(2, 'Latte de Vainilla', 7500, 'Espresso suave con leche vaporizada y vainilla', 1, '2026-04-18 16:14:11'),
(3, 'Cold Brew', 8000, 'Infusion en frio 12 horas, suave y potente', 1, '2026-04-18 16:14:11'),
(4, 'Cappuccino', 6500, 'Espresso con espuma de leche artesanal', 1, '2026-04-18 16:14:11'),
(5, 'Matcha Latte', 8500, 'Matcha japones ceremonial con leche de avena', 1, '2026-04-18 16:14:11'),
(6, 'Frappe Caramelo', 9000, 'Cafe helado con sirope de caramelo y crema', 1, '2026-04-18 16:14:11');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto_ingredientes`
--

CREATE TABLE `producto_ingredientes` (
  `id` int(10) UNSIGNED NOT NULL,
  `producto_id` int(10) UNSIGNED NOT NULL,
  `inventario_id` int(10) UNSIGNED NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `unidad` enum('g','ml') NOT NULL DEFAULT 'g'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `producto_ingredientes`
--

INSERT INTO `producto_ingredientes` (`id`, `producto_id`, `inventario_id`, `cantidad`, `unidad`) VALUES
(1, 1, 1, 20.00, 'g'),
(2, 1, 2, 40.00, 'ml'),
(3, 2, 1, 20.00, 'g'),
(4, 2, 3, 200.00, 'ml'),
(5, 2, 4, 15.00, 'ml'),
(6, 3, 1, 30.00, 'g'),
(7, 3, 2, 250.00, 'ml'),
(8, 4, 1, 20.00, 'g'),
(9, 4, 3, 120.00, 'ml'),
(10, 5, 3, 130.00, 'ml'),
(11, 5, 2, 120.00, 'ml'),
(12, 5, 6, 2.00, 'g'),
(13, 6, 1, 20.00, 'g'),
(14, 6, 3, 150.00, 'ml'),
(15, 6, 5, 30.00, 'ml');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedores`
--

CREATE TABLE `proveedores` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `contacto` varchar(120) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `proveedores`
--

INSERT INTO `proveedores` (`id`, `nombre`, `contacto`, `created_at`) VALUES
(1, 'Hernán', '3244872395', '2026-05-08 22:07:04'),
(2, 'Yulian', '3338409756', '2026-05-13 23:50:16');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ubicacion`
--

CREATE TABLE `ubicacion` (
  `id` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `lat` decimal(10,7) NOT NULL DEFAULT 4.7110000,
  `lng` decimal(10,7) NOT NULL DEFAULT -74.0721000,
  `descripcion` varchar(200) NOT NULL DEFAULT 'Parque de la 93 - Chapinero',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `ubicacion`
--

INSERT INTO `ubicacion` (`id`, `lat`, `lng`, `descripcion`, `updated_at`) VALUES
(1, 4.6291753, -74.1563814, 'Parque de la 93 - Chapinero', '2026-05-08 00:22:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `email` varchar(180) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('cliente','admin') NOT NULL DEFAULT 'cliente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `rol`, `created_at`) VALUES
(1, 'Administrador', 'admin@cafe.com', '$2y$10$npbNPzbMcb3UZoTyW0gN/uEunU69sQDeuWydqLnD7373RoS/2rVsO', 'admin', '2026-04-18 16:14:11'),
(2, 'david', 'david@hotmail.com', 'Yolo.2004', 'cliente', '2026-04-18 23:32:43'),
(3, 'david', 'davidi@hotmail.com', '$2y$10$ZpoJqw6946TP6UsIU2b8cO8XLiqHBFgAYJ9fneCWf.NGXmbI5GnA2', 'cliente', '2026-04-18 23:44:52'),
(4, 'manuel', 'manuel@hotmail.com', '$2y$10$KYWNdMgFOwvAEG8nyyTbiuxC5W7uwX/XQkEA1L0vhkULTeqjE2DNe', 'cliente', '2026-05-07 21:28:36'),
(5, 'profe celio', 'profecelio@gmail.com', '$2y$10$lDKpQbOOKzn.1Tl4Dz0DkO6Et/Y31pesxVjHyu5gU3bk.fM5rgXiW', 'cliente', '2026-05-08 00:17:50');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `egresos`
--
ALTER TABLE `egresos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_egreso_inventario` (`inventario_id`);

--
-- Indices de la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_inv_proveedor` (`proveedor_id`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `fk_pedido_usuario` (`usuario_id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `producto_ingredientes`
--
ALTER TABLE `producto_ingredientes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pi_producto` (`producto_id`),
  ADD KEY `fk_pi_inventario` (`inventario_id`);

--
-- Indices de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `ubicacion`
--
ALTER TABLE `ubicacion`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `egresos`
--
ALTER TABLE `egresos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `inventario`
--
ALTER TABLE `inventario`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `producto_ingredientes`
--
ALTER TABLE `producto_ingredientes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `egresos`
--
ALTER TABLE `egresos`
  ADD CONSTRAINT `fk_egreso_inventario` FOREIGN KEY (`inventario_id`) REFERENCES `inventario` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD CONSTRAINT `fk_inv_proveedor` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `fk_pedido_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `producto_ingredientes`
--
ALTER TABLE `producto_ingredientes`
  ADD CONSTRAINT `fk_pi_inventario` FOREIGN KEY (`inventario_id`) REFERENCES `inventario` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pi_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE;
COMMIT;

 
-- ------------------------------------------------------------
-- 0. TABLAS NUEVAS (las usan los triggers)
-- ------------------------------------------------------------
 
-- Guarda cada cambio de cantidad en el inventario
CREATE TABLE IF NOT EXISTS inventario_historial (
  id                INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  inventario_id     INT UNSIGNED  NOT NULL,
  cantidad_anterior DECIMAL(10,2) NOT NULL,
  cantidad_nueva    DECIMAL(10,2) NOT NULL,
  diferencia        DECIMAL(10,2) NOT NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_hist_inventario (inventario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- Avisos cuando un insumo baja del stock minimo
CREATE TABLE IF NOT EXISTS alertas_stock (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  inventario_id INT UNSIGNED  NOT NULL,
  nombre        VARCHAR(120)  NOT NULL,
  cantidad      DECIMAL(10,2) NOT NULL,
  stock_minimo  DECIMAL(10,2) NOT NULL,
  atendida      TINYINT(1)    NOT NULL DEFAULT 0,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_alerta_inventario (inventario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
 
-- ------------------------------------------------------------
-- Limpieza para poder re-ejecutar el script
-- ------------------------------------------------------------
DROP TRIGGER   IF EXISTS trg_inventario_before_update;
DROP TRIGGER   IF EXISTS trg_inventario_after_update;
DROP TRIGGER   IF EXISTS trg_pedidos_before_update;
DROP PROCEDURE IF EXISTS sp_descontar_producto;
DROP PROCEDURE IF EXISTS sp_comprar_inventario;
DROP FUNCTION  IF EXISTS fn_es_stock_bajo;
DROP FUNCTION  IF EXISTS fn_puede_preparar;
DROP FUNCTION  IF EXISTS fn_ingresos_mes;
 
DELIMITER $$
 
-- ============================================================
-- 1. FUNCIONES
-- ============================================================
 
-- 1.1 Devuelve 1 si la cantidad esta en el minimo o por debajo.
--     Es una funcion "pura": no lee tablas, solo compara dos numeros.
CREATE FUNCTION fn_es_stock_bajo(p_cantidad DECIMAL(10,2), p_minimo DECIMAL(10,2))
RETURNS TINYINT(1)
DETERMINISTIC
BEGIN
    RETURN IF(p_cantidad <= p_minimo, 1, 0);
END$$
 
-- 1.2 Devuelve 1 si hay inventario suficiente para preparar
--     p_qty unidades de un producto (revisa todos sus ingredientes).
CREATE FUNCTION fn_puede_preparar(p_producto_id INT UNSIGNED, p_qty INT)
RETURNS TINYINT(1)
READS SQL DATA
BEGIN
    DECLARE v_faltantes INT DEFAULT 0;
 
    SELECT COUNT(*) INTO v_faltantes
    FROM producto_ingredientes ing
    JOIN inventario i ON i.id = ing.inventario_id
    WHERE ing.producto_id = p_producto_id
      AND i.cantidad < ing.cantidad * p_qty;
 
    RETURN IF(v_faltantes = 0, 1, 0);
END$$
 
-- 1.3 Total vendido (pedidos realizados) en un mes y anio.
CREATE FUNCTION fn_ingresos_mes(p_mes INT, p_anio INT)
RETURNS BIGINT
READS SQL DATA
BEGIN
    DECLARE v_total BIGINT DEFAULT 0;
 
    SELECT COALESCE(SUM(total), 0) INTO v_total
    FROM pedidos
    WHERE estado = 'realizado'
      AND MONTH(created_at) = p_mes
      AND YEAR(created_at)  = p_anio;
 
    RETURN v_total;
END$$
 
-- ============================================================
-- 2. PROCEDIMIENTOS ALMACENADOS
-- ============================================================
 
-- 2.1 Descuenta del inventario los ingredientes de un producto.
--     Usa fn_puede_preparar() para validar antes de descontar.
--     Al actualizar inventario se disparan los triggers de abajo.
CREATE PROCEDURE sp_descontar_producto(IN p_producto_id INT UNSIGNED, IN p_qty INT)
BEGIN
    IF p_qty IS NULL OR p_qty <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'La cantidad debe ser mayor a 0';
    END IF;
 
    IF fn_puede_preparar(p_producto_id, p_qty) = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Inventario insuficiente para preparar el producto';
    END IF;
 
    UPDATE inventario i
    JOIN producto_ingredientes ing ON ing.inventario_id = i.id
    SET i.cantidad = i.cantidad - (ing.cantidad * p_qty)
    WHERE ing.producto_id = p_producto_id;
END$$
 
-- 2.2 Registra la compra de un insumo: suma al inventario (o lo crea)
--     y genera el egreso. Todo en una transaccion: si algo falla,
--     se deshace completo.
CREATE PROCEDURE sp_comprar_inventario(
    IN p_nombre       VARCHAR(120),
    IN p_cantidad     DECIMAL(10,2),
    IN p_precio       INT UNSIGNED,
    IN p_unidad       VARCHAR(2),
    IN p_proveedor_id INT UNSIGNED
)
BEGIN
    DECLARE v_id       INT UNSIGNED DEFAULT NULL;
    DECLARE v_monto    INT UNSIGNED DEFAULT 0;
    DECLARE v_egreso   INT UNSIGNED DEFAULT 0;
    DECLARE v_concepto VARCHAR(200);
 
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
 
    IF p_nombre IS NULL OR TRIM(p_nombre) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre es requerido';
    END IF;
    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La cantidad debe ser mayor a 0';
    END IF;
    IF p_precio IS NULL OR p_precio <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El precio unitario debe ser mayor a 0';
    END IF;
    IF p_unidad NOT IN ('g','ml') THEN
        SET p_unidad = 'g';
    END IF;
 
    SET v_monto = ROUND(p_cantidad * p_precio);
 
    START TRANSACTION;
 
    -- COLLATE evita el error "Illegal mix of collations" segun la
    -- collation por defecto de la base de datos
    SELECT id INTO v_id FROM inventario
    WHERE nombre = p_nombre COLLATE utf8mb4_unicode_ci LIMIT 1;
 
    IF v_id IS NULL THEN
        INSERT INTO inventario (nombre, cantidad, unidad, precio_unitario, proveedor_id)
        VALUES (p_nombre, p_cantidad, p_unidad, p_precio, p_proveedor_id);
        SET v_id = LAST_INSERT_ID();
    ELSE
        UPDATE inventario
        SET cantidad        = cantidad + p_cantidad,
            precio_unitario = p_precio,
            proveedor_id    = p_proveedor_id
        WHERE id = v_id;
    END IF;
 
    SET v_concepto = CONCAT('Compra inventario: ', p_nombre, ' x', p_cantidad, p_unidad);
 
    INSERT INTO egresos (concepto, monto, tipo, inventario_id)
    VALUES (v_concepto, v_monto, 'inventario', v_id);
    SET v_egreso = LAST_INSERT_ID();
 
    COMMIT;
 
    SELECT v_id AS item_id, v_egreso AS egreso_id, v_monto AS monto;
END$$
 
-- ============================================================
-- 3. TRIGGERS
-- ============================================================
 
-- 3.1 Antes de actualizar inventario: el stock nunca queda negativo.
CREATE TRIGGER trg_inventario_before_update
BEFORE UPDATE ON inventario
FOR EACH ROW
BEGIN
    IF NEW.cantidad < 0 THEN
        SET NEW.cantidad = 0;
    END IF;
END$$
 
-- 3.2 Despues de actualizar inventario:
--     a) guarda el cambio en inventario_historial
--     b) si cruzo el stock minimo, crea una alerta (usa fn_es_stock_bajo)
CREATE TRIGGER trg_inventario_after_update
AFTER UPDATE ON inventario
FOR EACH ROW
BEGIN
    IF NOT (OLD.cantidad <=> NEW.cantidad) THEN
        INSERT INTO inventario_historial
            (inventario_id, cantidad_anterior, cantidad_nueva, diferencia)
        VALUES
            (NEW.id, OLD.cantidad, NEW.cantidad, NEW.cantidad - OLD.cantidad);
    END IF;
 
    IF fn_es_stock_bajo(NEW.cantidad, NEW.stock_minimo) = 1
       AND fn_es_stock_bajo(OLD.cantidad, OLD.stock_minimo) = 0 THEN
        INSERT INTO alertas_stock (inventario_id, nombre, cantidad, stock_minimo)
        VALUES (NEW.id, NEW.nombre, NEW.cantidad, NEW.stock_minimo);
    END IF;
END$$
 
-- 3.3 Antes de actualizar pedidos: un pedido realizado no vuelve a pendiente.
CREATE TRIGGER trg_pedidos_before_update
BEFORE UPDATE ON pedidos
FOR EACH ROW
BEGIN
    IF OLD.estado = 'realizado' AND NEW.estado = 'pendiente' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Un pedido realizado no puede volver a pendiente';
    END IF;
END$$
 
DELIMITER ;
 
-- ============================================================
-- PRUEBAS 
-- ============================================================
-- SHOW TRIGGERS;
-- SHOW PROCEDURE STATUS WHERE Db = 'cafe_movil';
-- SHOW FUNCTION STATUS WHERE Db = 'cafe_movil';
use cafe_movil;
SELECT fn_puede_preparar(1, 3);     -- ¿alcanza para 3 unidades del producto 1?
SELECT fn_puede_preparar(1, 9999);  -- un numero exagerado, para forzar que falte

SELECT p.nombre AS producto, i.nombre AS ingrediente,
       ing.cantidad AS necesario_por_unidad, i.cantidad AS disponible
FROM producto_ingredientes ing
JOIN productos p ON p.id = ing.producto_id
JOIN inventario i ON i.id = ing.inventario_id
WHERE ing.producto_id = 1;

-- UPDATE pedidos SET estado = 'pendiente' WHERE id = 1;




-- SELECT fn_es_stock_bajo(100, 500);          -- 1
-- SELECT fn_puede_preparar(2, 3);             -- 1 si alcanza para 3 Latte de Vainilla
-- SELECT fn_ingresos_mes(5, 2026);            -- total vendido en mayo 2026
--
-- CALL sp_descontar_producto(1, 2);           -- descuenta 2 Espresso
-- SELECT * FROM inventario_historial;         -- el trigger registro el cambio
-- SELECT * FROM alertas_stock;                -- aparece si cruzo el minimo
--
-- CALL sp_comprar_inventario('Leche', 1000, 8, 'ml', NULL);
-- SELECT * FROM egresos ORDER BY id DESC LIMIT 1;
--
-- UPDATE pedidos SET estado='pendiente' WHERE id=1;   -- debe dar error (trigger 3.3)
 
 -- ultimoooo
 
-- ============================================================
-- CAFE MOVIL - Cancelacion automatica de pedidos no recogidos
--
-- Si un pedido queda en estado 'pendiente' por mas de 24 horas,
-- se elimina solo. Antes de borrarlo, un trigger guarda una
-- copia en pedidos_cancelados, para no perder el registro.
-- ============================================================

USE cafe_movil;

-- ------------------------------------------------------------
-- 1. Tabla donde queda el historial de lo eliminado
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos_cancelados (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pedido_id       INT UNSIGNED  NOT NULL,
  codigo          VARCHAR(20)   NOT NULL,
  usuario_id      INT UNSIGNED  NOT NULL,
  detalle         TEXT          NOT NULL,
  total           INT UNSIGNED  NOT NULL,
  creado_original TIMESTAMP     NOT NULL,
  cancelado_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  motivo          VARCHAR(100)  NOT NULL DEFAULT 'No recogido en 24 horas'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. Trigger: antes de borrar un pedido, guardar copia
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_pedidos_before_delete;

DELIMITER $$
CREATE TRIGGER trg_pedidos_before_delete
BEFORE DELETE ON pedidos
FOR EACH ROW
BEGIN
    INSERT INTO pedidos_cancelados
        (pedido_id, codigo, usuario_id, detalle, total, creado_original)
    VALUES
        (OLD.id, OLD.codigo, OLD.usuario_id, OLD.detalle, OLD.total, OLD.created_at);
END$$
DELIMITER ;

-- ------------------------------------------------------------
-- 3. Event: revisa cada hora y borra los pedidos vencidos
--    (esto dispara el trigger de arriba por cada fila borrada)
-- ------------------------------------------------------------

-- El Event Scheduler debe estar activo para que esto funcione.
-- SET GLOBAL solo dura hasta que se reinicia MySQL; el paso
-- permanente va en my.ini (se explica en el chat).
SET GLOBAL event_scheduler = ON;

DROP EVENT IF EXISTS ev_cancelar_pedidos_vencidos;

CREATE EVENT ev_cancelar_pedidos_vencidos
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
    DELETE FROM pedidos
    WHERE estado = 'pendiente'
      AND created_at < NOW() - INTERVAL 24 HOUR;

-- Para comprobar que el event quedo activo:
-- SHOW EVENTS;
-- SELECT @@event_scheduler;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;