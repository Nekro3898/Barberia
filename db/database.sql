-- Referencia del esquema ORIGINAL y plantilla para pruebas en una base vacía.
-- No ejecutar sobre barbershop: la aplicación usa sus tablas existentes.
-- usuarios guarda clientes; turnos los relaciona mediante id_usuario.
-- horarios representa la semana; configuracion contiene la duración común.
CREATE TABLE `usuarios` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `nombre_y_apellido` VARCHAR(50) NOT NULL,
  `telefono` VARCHAR(20)
);

CREATE TABLE `turnos` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `id_usuario` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `hora` TIME NOT NULL
);

CREATE TABLE `horarios` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `dia_semana` TINYINT UNIQUE NOT NULL COMMENT '0 = domingo, 6 = sábado',
  `trabaja` BOOLEAN NOT NULL DEFAULT false,
  `hora_apertura` TIME,
  `hora_cierre` TIME,
  `pausa_inicio` TIME,
  `pausa_fin` TIME
);

CREATE TABLE `configuracion` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `nombre_negocio` VARCHAR(100) NOT NULL,
  `duracion_turno_min` INT NOT NULL DEFAULT 30
);

CREATE UNIQUE INDEX `turnos_index_0` ON `turnos` (`fecha`, `hora`);

ALTER TABLE `turnos` ADD FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`);
