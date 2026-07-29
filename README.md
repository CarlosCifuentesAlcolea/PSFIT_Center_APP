![Logo de PSFIT](./assets/logo_4.png)

# PSFIT CENTER - Sistema de gestion de gimnasio

Gestion de socios, control de productos/stock, contabilidad (con extractos en PDF), personal con roles, y avisos automaticos. Pensado para un gimnasio pequeno, con backend y base de datos en la nube (gratis) y la app de escritorio corriendo en cada puesto.

## Desplegado en

- **App (frontend web)**: https://psfitcenter-web.onrender.com
- **API (backend)**: https://psfitcenter-api.onrender.com
- **Base de datos**: MySQL en Aiven

El plan Free de Render "duerme" el backend tras 15 min sin uso — la primera peticion tras eso tarda 30-60s en responder mientras despierta.

## Stack

- **Frontend**: React + Vite + Tailwind CSS, empaquetado como app de escritorio con Electron (y tambien desplegado como web normal, mismo codigo)
- **Backend**: Node.js + Express (API REST)
- **Base de datos**: MySQL / MariaDB (en local vale con XAMPP; en produccion cualquier proveedor compatible con MySQL, ej. Aiven, PlanetScale o Railway)
- **Email transaccional**: [Resend](https://resend.com) (recuperacion de contrasena)

## Estructura del proyecto

```
PSFITCenter/
├── backend/
│   ├── db/
│   │   ├── schema.sql       Estructura de las tablas
│   │   ├── init.js          Script para crear tablas y datos de ejemplo
│   │   └── pool.js          Conexion a MySQL/MariaDB (con soporte de transacciones)
│   ├── lib/
│   │   └── fechas.js        Calculo de fechas de renovacion (proximo pago a primeros de mes)
│   ├── middleware/
│   │   └── auth.js          requireAuth / requireAdmin (JWT)
│   ├── services/
│   │   └── email.js         Envio de emails (Resend)
│   ├── routes/               auth, socios, productos, movimientos, usuarios (personal), dashboard
│   └── server.js            Punto de entrada de la API
└── frontend/
    ├── electron/main.js     Proceso principal de Electron
    └── src/
        ├── api/client.js    Cliente HTTP hacia la API
        └── components/      Panel, Usuarios, Productos, Contabilidad, Personal, Avisos, Rutinas, Dietas...
```

## Puesta en marcha (local)

### 1. Base de datos

Instala [XAMPP](https://www.apachefriends.org/) y arranca el modulo MySQL, o usa una base MySQL en la nube (Aiven, PlanetScale, Railway...). Crea una base de datos vacia (por ejemplo `psfitcenter`).

### 2. Backend

```bash
cd backend
npm install
copy .env.example .env
```

Edita `.env` con tus valores (ver [Variables de entorno](#variables-de-entorno) abajo). Despues crea las tablas y los datos de ejemplo:

```bash
npm run init-db
```

Arranca la API:

```bash
npm run dev
```

Queda corriendo en `http://localhost:4000` (prueba `http://localhost:4000/api/health`).

### 3. Frontend (app de escritorio)

En otra terminal:

```bash
cd frontend
npm install
npm run electron:dev
```

> Por defecto `frontend/src/api/client.js` apunta a la API desplegada en Render. Para probar contra tu backend local, cambia `API_URL` a `http://localhost:4000/api` temporalmente.

## Variables de entorno (`backend/.env`)

| Variable | Para que sirve |
|---|---|
| `DATABASE_URL` | Cadena de conexion MySQL, formato `mysql://usuario:password@host:puerto/basedatos` |
| `PORT` | Puerto de la API (4000 en local; Render lo asigna solo en produccion) |
| `JWT_SECRET` | Clave para firmar los tokens de sesion — usa una cadena larga y aleatoria |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciales del admin que crea `npm run init-db` la primera vez (obligatorias, sin valor por defecto) |
| `FRONTEND_URL` | URL de tu frontend desplegado — se usa para restringir CORS y para construir el enlace del email de recuperacion de contrasena |
| `RESEND_API_KEY` | API key de [resend.com](https://resend.com), para el email de "olvide mi contrasena". Sin dominio propio verificado, se envia desde `onboarding@resend.dev` (dominio de pruebas de Resend) |

## Funcionalidades implementadas

- **Login con roles** (`admin` / `empleado`), JWT, limite de intentos de login (fuerza bruta)
- **Recuperacion de contrasena por email**: "¿Olvidaste tu contraseña?" en el login → enlace por email (Resend) valido 30 minutos → elegir contrasena nueva
- **Personal**: alta de empleados con contrasena temporal generada por el sistema (obligatorio cambiarla en el primer login), edicion, emoji personalizado
- **Socios**: alta/edicion/baja, DNI y observaciones (visibles solo en el detalle "Ver"), planes mensual/trimestral/anual con **renovacion automatica a primeros de mes**, boton "Marcar como pagado", visitantes de un dia ("Diario") que solo registran el ingreso sin crear una cuota
- **Productos**: marca, categoria (desplegable), stock/stock minimo (nunca negativos), **Vender** (descuenta stock y genera el ingreso en Contabilidad automaticamente) y **Reponer stock** (suma stock y genera el gasto), todo en una transaccion
- **Contabilidad**: vista por mes y por año, extracto en **PDF** descargable, eliminar un movimiento revierte el efecto que tuvo sobre el stock si venia de una venta/reposicion
- **Avisos**: productos proximos a agotarse, socios con el pago vencido
- **Buscador y filtros** en las tablas de Usuarios, Personal y Productos
- **Rutinas y Dietas**: menu preparado, pendiente de definir como se crearan y asignaran

## Pendiente

1. **WhatsApp automatico** (bienvenida a socios y empleados nuevos, aviso de vencimiento proximo): decidido usar Twilio: falta completar la integracion con las credenciales reales
2. **Baja automatica**: dar de baja temporal a un socio 5 dias despues de su proximo pago sin renovar — necesita un disparador diario (GitHub Actions programado pegandole a un endpoint de la API), pendiente de implementar junto con lo de WhatsApp
3. **Rutinas y dietas**: definir el modelo de datos y como se crean/asignan a cada socio
4. **Empaquetado**: usar `electron-builder` para generar el instalador (.exe / .dmg)

## Seguridad

- CORS restringido al `FRONTEND_URL` configurado (mas Electron en desarrollo)
- Contrasenas siempre con bcrypt, nunca en texto plano
- Limite de intentos en login y en solicitudes de recuperacion de contrasena
- El email de "olvide mi contrasena" nunca revela si una cuenta existe o no
- El token de recuperacion se guarda con hash (SHA-256), no en texto plano, y caduca a los 30 minutos

## Notas

- Si usas XAMPP en local, la base de datos solo es accesible desde tu propia maquina; para que varios puestos compartan los mismos datos hay que usar una base MySQL en la nube.
- El frontend es el mismo codigo tanto para la app de escritorio (Electron) como para la version web desplegada — no hay que mantener dos versiones.
