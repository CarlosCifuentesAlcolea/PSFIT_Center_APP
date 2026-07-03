![Logo de PSFIT](./assets/logo.jpg)

# PSFIT CENTER - Sistema de gestion de gimnasio

Base del proyecto: gestion de socios, control de productos/stock y contabilidad basica (ingresos y gastos).

## Stack

- **Frontend**: Electron + React + Vite + Tailwind CSS (facil de migrar a web en el futuro, ya que es una app web empaquetada)
- **Backend**: Node.js + Express (API REST)
- **Base de datos**: PostgreSQL en la nube (recomendado: Neon, Supabase o Railway, todos con plan gratuito)

## Estructura del proyecto

```
gimnasio-app/
├── backend/          API REST y conexion a base de datos
│   ├── db/
│   │   ├── schema.sql    Estructura de las tablas
│   │   ├── init.js       Script para crear tablas y datos de ejemplo
│   │   └── pool.js       Conexion a PostgreSQL
│   ├── routes/           Endpoints: socios, productos, movimientos, dashboard
│   └── server.js         Punto de entrada de la API
└── frontend/         Aplicacion de escritorio (Electron + React)
    ├── electron/main.js  Proceso principal de Electron
    └── src/              Interfaz (panel, usuarios, productos, contabilidad)
```

## Puesta en marcha

### 1. Base de datos

Crea una base de datos PostgreSQL gratuita en [neon.tech](https://neon.tech), [supabase.com](https://supabase.com) o [railway.app](https://railway.app). Copia la cadena de conexion que te den (algo como `postgresql://usuario:password@host/basedatos`).

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
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

Este es el esqueleto funcional: ya puedes dar de alta socios, productos y movimientos, y ver el panel con metricas en tiempo real. Los siguientes pasos logicos son:

1. **Autenticacion**: login para el personal (roles: admin, recepcion)
2. **Pagos y renovaciones**: marcar cuotas como pagadas, recordatorios automaticos
3. **Ventas de productos vinculadas a stock**: que al vender un producto se descuente del inventario automaticamente y se genere el movimiento contable
4. **Empaquetado**: usar `electron-builder` para generar el instalador (.exe / .dmg) cuando este lista para entregar

## Notas

- Los datos son compartidos en la nube, asi que 2-3 puestos pueden trabajar a la vez sin pisarse (el backend centraliza el acceso a la base de datos)
- Cuando quieras la version web, el `frontend/src` se reutiliza casi entero, solo cambia el empaquetado (Electron -> despliegue web normal)
