-- ============================================================
-- CAFE MOVIL - Administracion de Base de Datos
-- 1. Procesamiento transaccional
-- 2. Creacion de usuarios y permisos
-- 3. Acceso remoto (usuario para conexion remota)
-- 4. Migracion de motor de almacenamiento (MyISAM -> InnoDB)
--
-- Ejecutar en Workbench, con la base cafe_movil seleccionada.
-- Los backups se explican aparte, con mysqldump (no son SQL).
-- ============================================================

USE cafe_movil;

-- ============================================================
-- 1. PROCESAMIENTO TRANSACCIONAL
-- ------------------------------------------------------------
-- Una transaccion agrupa varias operaciones para que se
-- ejecuten como una sola unidad: o se guardan TODAS, o si algo
-- falla, no se guarda NINGUNA (propiedad "atomicidad").
--
-- sp_comprar_inventario ya usa START TRANSACTION / COMMIT /
-- ROLLBACK por dentro. Aqui se muestra el mismo concepto de
-- forma explicita, paso a paso, para explicarlo en la sustentacion.
-- ============================================================

-- 1.1 Demo: transaccion que SI se confirma (COMMIT)
START TRANSACTION;

    UPDATE inventario SET cantidad = cantidad - 20 WHERE id = 1;  -- cafe
    UPDATE inventario SET cantidad = cantidad - 30 WHERE id = 2;  -- agua

COMMIT;  -- ambos cambios quedan guardados juntos

-- 1.2 Demo: transaccion que SE DESHACE (ROLLBACK)
-- Simula un error a la mitad del proceso: el primer UPDATE se
-- deshace porque nunca se llega al COMMIT.
START TRANSACTION;

    UPDATE inventario SET cantidad = cantidad - 9999 WHERE id = 1;
    -- SELECT para comprobar que SI cambio (todavia no es definitivo)
    SELECT id, nombre, cantidad FROM inventario WHERE id = 1;

ROLLBACK;  -- deshace el UPDATE de arriba

SELECT id, nombre, cantidad FROM inventario WHERE id = 1;  -- vuelve al valor original

-- 1.3 Demo: SAVEPOINT (deshacer solo una parte)
START TRANSACTION;

    UPDATE inventario SET cantidad = cantidad - 10 WHERE id = 1;
    SAVEPOINT antes_de_leche;
    UPDATE inventario SET cantidad = cantidad - 99999 WHERE id = 3; -- esto se deshace

    ROLLBACK TO antes_de_leche;  -- deshace SOLO el UPDATE de la leche

COMMIT;  -- confirma el descuento de cafe, descarta el de leche

-- ============================================================
-- 2. CREACION DE USUARIOS Y PERMISOS
-- ------------------------------------------------------------
-- Se crean 3 usuarios de MySQL/MariaDB (distintos a los usuarios
-- de la tabla `usuarios`, que son los clientes/admin de la app).
-- Cada uno con el minimo permiso que necesita (principio de
-- menor privilegio).
-- ============================================================

-- 2.1 Administrador de base de datos: control total
DROP USER IF EXISTS 'cafe_admin'@'localhost';
CREATE USER 'cafe_admin'@'localhost' IDENTIFIED BY 'AdminCafe#2026';
GRANT ALL PRIVILEGES ON cafe_movil.* TO 'cafe_admin'@'localhost';

-- 2.2 Usuario de la aplicacion (el que usaria db.php): puede
-- leer y escribir datos, pero no puede borrar tablas ni usuarios
DROP USER IF EXISTS 'cafe_app'@'localhost';
CREATE USER 'cafe_app'@'localhost' IDENTIFIED BY 'AppCafe#2026';
GRANT SELECT, INSERT, UPDATE, DELETE ON cafe_movil.* TO 'cafe_app'@'localhost';
GRANT EXECUTE ON cafe_movil.* TO 'cafe_app'@'localhost'; -- para llamar los SP

-- 2.3 Usuario de solo lectura, para reportes/contabilidad
DROP USER IF EXISTS 'cafe_reportes'@'localhost';
CREATE USER 'cafe_reportes'@'localhost' IDENTIFIED BY 'ReportesCafe#2026';
GRANT SELECT ON cafe_movil.* TO 'cafe_reportes'@'localhost';

FLUSH PRIVILEGES;

-- Para comprobar los permisos de un usuario:
-- SHOW GRANTS FOR 'cafe_app'@'localhost';

-- ============================================================
-- 3. ACCESO / LOGEO REMOTO
-- ------------------------------------------------------------
-- Un usuario normal ('localhost') solo puede conectarse desde
-- la misma maquina. Para entrar desde otro equipo (otro PC,
-- un companero, un servidor), se crea el mismo usuario pero con
-- host '%' (cualquier IP) o una IP especifica.
-- ============================================================

DROP USER IF EXISTS 'cafe_admin'@'%';
CREATE USER 'cafe_admin'@'%' IDENTIFIED BY 'AdminCafe#2026';
GRANT ALL PRIVILEGES ON cafe_movil.* TO 'cafe_admin'@'%';
FLUSH PRIVILEGES;

-- Esto NO basta por si solo: ademas hay que configurar el
-- servidor para que escuche conexiones externas (ver explicacion
-- del chat, son cambios en my.ini + firewall, no son SQL).

-- ============================================================
-- 4. MIGRACION DE MOTOR DE ALMACENAMIENTO (MyISAM -> InnoDB)
-- ------------------------------------------------------------
-- Tus tablas ya quedaron en InnoDB al importarlas (lo normal
-- en MySQL/MariaDB moderno). Este bloque sirve para DEMOSTRAR
-- la migracion: primero se pasa una tabla a MyISAM a proposito,
-- y luego se migra de vuelta a InnoDB, mostrando el antes/despues.
-- ============================================================

-- 4.1 Ver el motor actual de cada tabla
SELECT table_name, engine
FROM information_schema.tables
WHERE table_schema = 'cafe_movil';

-- 4.2 Forzar una tabla a MyISAM (motor viejo, sin transacciones
--     ni llaves foraneas) solo para la demo.
-- Se usa inventario_historial porque no tiene llaves foraneas:
-- una tabla CON foreign keys (como egresos o pedidos) no se
-- puede pasar a MyISAM sin antes quitarle esas llaves, porque
-- MyISAM no las soporta.
ALTER TABLE inventario_historial ENGINE = MyISAM;

SELECT table_name, engine
FROM information_schema.tables
WHERE table_schema = 'cafe_movil' AND table_name = 'inventario_historial';

-- 4.3 Migrar de vuelta a InnoDB (el motor recomendado: soporta
--     transacciones, llaves foraneas e integridad referencial,
--     justo lo que usan tus triggers y procedimientos)
ALTER TABLE inventario_historial ENGINE = InnoDB;

SELECT table_name, engine
FROM information_schema.tables
WHERE table_schema = 'cafe_movil' AND table_name = 'inventario_historial';
