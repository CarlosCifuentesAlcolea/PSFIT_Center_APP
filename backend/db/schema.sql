-- Esquema inicial de la base de datos del gimnasio (MySQL/MariaDB)

CREATE TABLE IF NOT EXISTS socios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  apellidos VARCHAR(150),
  dni VARCHAR(20),
  email VARCHAR(150),
  telefono VARCHAR(30),
  observaciones VARCHAR(1000),
  plan VARCHAR(50) NOT NULL DEFAULT 'mensual',
  estado VARCHAR(20) NOT NULL DEFAULT 'al_dia',
  diario BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_alta DATE DEFAULT (CURRENT_DATE),
  proximo_pago DATE,
  aviso_vencimiento_enviado BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  marca VARCHAR(100),
  categoria VARCHAR(80),
  precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  concepto VARCHAR(200) NOT NULL,
  importe NUMERIC(10,2) NOT NULL,
  metodo_pago VARCHAR(10) CHECK (metodo_pago IN ('efectivo', 'tarjeta')),
  fecha DATE DEFAULT (CURRENT_DATE),
  socio_id INTEGER,
  producto_id INTEGER,
  cantidad INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (socio_id) REFERENCES socios(id) ON DELETE SET NULL,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL UNIQUE,
  email VARCHAR(150) UNIQUE,
  telefono VARCHAR(30),
  emoji VARCHAR(10) DEFAULT '🙂',
  password_hash VARCHAR(200) NOT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'empleado' CHECK (rol IN ('admin', 'empleado')),
  debe_cambiar_password BOOLEAN NOT NULL DEFAULT FALSE,
  reset_token_hash VARCHAR(64),
  reset_token_expira DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rutinas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  socio_id BIGINT UNSIGNED NOT NULL,
  nombre_rutina VARCHAR(150) NOT NULL DEFAULT 'Rutina de entrenamiento',
  edad VARCHAR(20),
  peso VARCHAR(20),
  altura VARCHAR(20),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  patologias VARCHAR(300),
  dias_entrenamiento VARCHAR(150),
  objetivo VARCHAR(300),
  calentamiento TEXT,
  bloques TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (socio_id) REFERENCES socios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tipos_ejercicio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dietas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  socio_id BIGINT UNSIGNED NOT NULL,
  nombre_dieta VARCHAR(150) NOT NULL DEFAULT 'Dieta',
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  objetivo VARCHAR(300),
  contenido TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (socio_id) REFERENCES socios(id) ON DELETE CASCADE
);

CREATE INDEX idx_movimientos_fecha ON movimientos(fecha);
CREATE INDEX idx_socios_estado ON socios(estado);
CREATE INDEX idx_rutinas_socio ON rutinas(socio_id);
CREATE INDEX idx_dietas_socio ON dietas(socio_id);
