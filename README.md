![Logo de PSFIT](./assets/logo_4.png)

# PSFIT CENTER - Sistema de gestion de gimnasio

Base del proyecto: gestion de socios, control de productos/stock y contabilidad basica (ingresos y gastos).

## Stack

- **Frontend**: Electron + React + Vite + Tailwind CSS (facil de migrar a web en el futuro, ya que es una app web empaquetada)
- **Backend**: Node.js + Express (API REST)
- **Base de datos**: MySQL / MariaDB (en local vale con XAMPP; en produccion cualquier proveedor compatible con MySQL, ej. PlanetScale, Railway o Aiven)

## Estructura del proyecto

```
gimnasio-app/
├── backend/          API REST y conexion a base de datos
│   ├── db/
│   │   ├── schema.sql    Estructura de las tablas
│   │   ├── init.js       Script para crear tablas y datos de ejemplo
│   │   └── pool.js       Conexion a MySQL/MariaDB
│   ├── routes/           Endpoints: socios, productos, movimientos, dashboard
│   └── server.js         Punto de entrada de la API
└── frontend/         Aplicacion de escritorio (Electron + React)
    ├── electron/main.js  Proceso principal de Electron
    └── src/              Interfaz (panel, usuarios, productos, contabilidad)
```

## Puesta en marcha

### 1. Base de datos

**En local (recomendado para desarrollo):** instala [XAMPP](https://www.apachefriends.org/) y arranca el modulo MySQL. Crea una base de datos vacia (por ejemplo `psfitcenter`) desde phpMyAdmin. Anota el puerto que uses (por defecto 3306, o el que hayas configurado si tienes mas de una instancia).

**En la nube (para produccion):** cualquier proveedor compatible con MySQL sirve, por ejemplo [PlanetScale](https://planetscale.com), Railway o Aiven. Copia la cadena de conexion que te den (formato `mysql://usuario:password@host:puerto/basedatos`).

### 2. Backend

```bash
cd backend
npm install
copy .env.example .env
```

Edita `.env` y pega tu `DATABASE_URL`. Despues crea las tablas y los datos de ejemplo:

```bash
npm run init-db
```

Arranca la API:

```bash
npm run dev
```

La API quedara corriendo en `http://localhost:4000`. Puedes probar que funciona entrando a `http://localhost:4000/api/health`.

### 3. Frontend (app de escritorio)

En otra terminal:

```bash
cd frontend
npm install
npm run electron:dev
```

Esto abre la app de escritorio conectada a tu API local.

## Como seguir construyendo

Este es el esqueleto funcional: ya puedes dar de alta socios, productos y movimientos, iniciar sesion con roles (admin/recepcion) y ver el panel con metricas en tiempo real. Los siguientes pasos logicos son:

1. **Pagos y renovaciones**: marcar cuotas como pagadas, recordatorios automaticos
2. **Ventas de productos vinculadas a stock**: que al vender un producto se descuente del inventario automaticamente y se genere el movimiento contable
3. **Empaquetado**: usar `electron-builder` para generar el instalador (.exe / .dmg) cuando este lista para entregar

## Notas

- Si usas XAMPP en local, la base de datos solo es accesible desde tu propia maquina; para que 2-3 puestos compartan los mismos datos hay que usar una base MySQL en la nube (ver seccion "Base de datos") o exponer el MySQL de XAMPP en red.
- Cuando quieras la version web, el `frontend/src` se reutiliza casi entero, solo cambia el empaquetado (Electron -> despliegue web normal)
