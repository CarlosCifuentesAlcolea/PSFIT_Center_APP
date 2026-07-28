const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');

// Maximo 10 intentos de login cada 15 minutos por IP, para dificultar la fuerza bruta
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesion. Espera unos minutos y vuelve a intentarlo.' }
});

// Iniciar sesion
router.post('/login', loginLimiter, async (req, res) => {
  const { nombre, password } = req.body;
  if (!nombre || !password) {
    return res.status(400).json({ error: 'nombre y password son obligatorios' });
  }
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE nombre = ?', [nombre]);
    const usuario = rows[0];
    const passwordValida = usuario && (await bcrypt.compare(password, usuario.password_hash));
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Devuelve el usuario del token actual (para validar sesion al abrir la app)
router.get('/me', requireAuth, (req, res) => {
  res.json({ usuario: req.usuario });
});

module.exports = router;
