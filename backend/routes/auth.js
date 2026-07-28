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
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        debe_cambiar_password: !!usuario.debe_cambiar_password
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Devuelve el usuario del token actual (para validar sesion al abrir la app)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, email, rol, debe_cambiar_password FROM usuarios WHERE id = ?',
      [req.usuario.id]
    );
    if (!rows[0]) return res.status(401).json({ error: 'Usuario no encontrado' });
    res.json({ usuario: { ...rows[0], debe_cambiar_password: !!rows[0].debe_cambiar_password } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cambiar la propia contrasena (obligatorio tras recibir una temporal)
router.post('/cambiar-password', requireAuth, async (req, res) => {
  const { passwordActual, passwordNueva } = req.body;
  if (!passwordActual || !passwordNueva) {
    return res.status(400).json({ error: 'passwordActual y passwordNueva son obligatorias' });
  }
  if (passwordNueva.length < 6) {
    return res.status(400).json({ error: 'La contrasena nueva debe tener al menos 6 caracteres' });
  }
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = ?', [req.usuario.id]);
    const usuario = rows[0];
    const valida = usuario && (await bcrypt.compare(passwordActual, usuario.password_hash));
    if (!valida) return res.status(401).json({ error: 'La contrasena actual no es correcta' });

    const passwordHash = await bcrypt.hash(passwordNueva, 10);
    await pool.query(
      'UPDATE usuarios SET password_hash = ?, debe_cambiar_password = FALSE WHERE id = ?',
      [passwordHash, req.usuario.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
