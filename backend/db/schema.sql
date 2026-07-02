-- Esquema inicial de la base de datos del gimnasio

CREATE TABLE IF NOT EXISTS socios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  telefono VARCHAR(30),
  plan VARCHAR(50) NOT NULL DEFAULT 'mensual',
  estado VARCHAR(20) NOT NULL DEFAULT 'al_dia',
  fecha_alta DATE DEFAULT CURRENT_DATE,
  proximo_pago DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  categoria VARCHAR(80),
  precio NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movimientos (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('ingreso', 'gasto')),
  concepto VARCHAR(200) NOT NULL,
  importe NUMERIC(10,2) NOT NULL,
  fecha DATE DEFAULT CURRENT_DATE,
  socio_id INTEGER REFERENCES socios(id) ON DELETE SET NULL,
  producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(200) NOT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'recepcion' CHECK (rol IN ('admin', 'recepcion')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos(fecha);
CREATE INDEX IF NOT EXISTS idx_socios_estado ON socios(estado);
