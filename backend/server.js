require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const usuariosRoutes = require('./routes/usuarios');
const sociosRoutes = require('./routes/socios');
const productosRoutes = require('./routes/productos');
const movimientosRoutes = require('./routes/movimientos');
const dashboardRoutes = require('./routes/dashboard');
const { requireAuth } = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);

app.use('/api/usuarios', requireAuth, usuariosRoutes);
app.use('/api/socios', requireAuth, sociosRoutes);
app.use('/api/productos', requireAuth, productosRoutes);
app.use('/api/movimientos', requireAuth, movimientosRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API del gimnasio corriendo en http://localhost:${PORT}`);
});
