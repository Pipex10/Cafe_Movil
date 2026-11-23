-- ============================================================
-- CAFE MOVIL - Rol de VENDEDOR (ventas de mostrador)
--
-- Agrega un tercer rol ademas de cliente/admin: vendedor.
-- Las ventas que registra se guardan en la MISMA tabla pedidos
-- (reutilizando todo lo que ya existe: triggers, sp_descontar_producto,
-- alertas de stock, calculo de ingresos del dashboard), solo que
-- quedan marcadas con origen='vendedor' y estado='realizado' de una
-- vez, porque una venta de mostrador ya se entrega en el momento.
-- ============================================================

USE cafe_movil;

-- 1. Agregar 'vendedor' a los roles posibles de usuarios
ALTER TABLE usuarios
  MODIFY COLUMN rol ENUM('cliente','vendedor','admin') NOT NULL DEFAULT 'cliente';

-- 2. Saber si un pedido vino de la app (cliente) o de mostrador (vendedor)
ALTER TABLE pedidos
  ADD COLUMN origen ENUM('cliente','vendedor') NOT NULL DEFAULT 'cliente' AFTER usuario_id;

-- 3. Index util para filtrar "ventas del vendedor X hoy"
ALTER TABLE pedidos ADD INDEX idx_pedidos_origen (origen);

-- ============================================================
-- Crear un usuario vendedor de prueba
-- ------------------------------------------------------------
-- La contrasena NO se puede escribir en texto plano en la tabla
-- (igual que con el admin). Genera el hash con PHP:
--
--   php -r "echo password_hash('TuClave123', PASSWORD_BCRYPT);"
--
-- Copia lo que imprima y reemplaza PEGA_AQUI_EL_HASH abajo.
-- ============================================================
INSERT INTO usuarios (nombre, email, password, rol)
VALUES ('Vendedor Mostrador', 'vendedor@cafe.com', '$2y$10$8FV6Z0FLKON6M1f.7gFuvOULuFWNoIdRQB2U6SoAHEHwX9azPTNCS', 'vendedor');