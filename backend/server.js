require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const sociosRoutes = require('./routes/socios');
const productosRoutes = require('./routes/productos');
const movimientosRoutes = require('./routes/movimientos');
const dashboardRoutes = require('./routes/dashboard');
const rutinasRoutes = require('./routes/rutinas');
const { requireAuth } = require('./middleware/auth');

const origenesPermitidos = [
  'http://localhost:5173', // Electron en desarrollo (vite dev server)
  process.env.FRONTEND_URL || 'https://psfitcenter-web.onrender.com'
];

const app = express();
// Render corre la API detras de un proxy; sin esto, express-rate-limit y req.ip
// verian siempre la IP interna del proxy en vez de la del visitante real.
app.set('trust proxy', 1);
app.use(cors({
  origin: (origin, callback) => {
    // Sin cabecera Origin (curl, apps nativas, Electron empaquetado con file://) o
    // un origen de la lista: se conceden los headers de CORS. Cualquier otro origen
    // de navegador: se responde sin ellos (callback(null, false), no un error) para
    // no filtrar detalles del servidor via el manejador de errores por defecto de Express.
    const permitido = !origin || origin === 'null' || origenesPermitidos.includes(origin);
    callback(null, permitido);
  }
}));
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok', api: 'PS FIT Center', health: '/api/health' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);

app.use('/api/usuarios', requireAuth, usuariosRoutes);
app.use('/api/socios', requireAuth, sociosRoutes);
app.use('/api/productos', requireAuth, productosRoutes);
app.use('/api/movimientos', requireAuth, movimientosRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/rutinas', requireAuth, rutinasRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API del gimnasio corriendo en http://localhost:${PORT}`);
});
