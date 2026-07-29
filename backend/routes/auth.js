const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { enviarEmailRecuperacion } = require('../services/email');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://psfitcenter-web.onrender.com';

// Maximo 10 intentos de login cada 15 minutos por IP, para dificultar la fuerza bruta
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesion. Espera unos minutos y vuelve a intentarlo.' }
});

// Maximo 5 solicitudes de recuperacion cada 15 minutos por IP, para no poder usarlo
// como forma de bombardear una bandeja de entrada ajena a base de peticiones
const olvidePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Espera unos minutos y vuelve a intentarlo.' }
});

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

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

// Solicitar un enlace de recuperacion de contrasena.
// Responde siempre igual, exista o no ese email, para no revelar que cuentas existen.
router.post('/olvide-password', olvidePasswordLimiter, async (req, res) => {
  const { email } = req.body;
  const MENSAJE_GENERICO = { mensaje: 'Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer la contraseña.' };

  if (!email) return res.status(400).json({ error: 'El email es obligatorio' });

  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    const usuario = rows[0];

    if (usuario) {
      const token = crypto.randomBytes(32).toString('hex');
      const expira = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

      await pool.query(
        'UPDATE usuarios SET reset_token_hash = ?, reset_token_expira = ? WHERE id = ?',
        [hashToken(token), expira, usuario.id]
      );

      const enlace = `${FRONTEND_URL}/reset-password?token=${token}`;
      try {
        await enviarEmailRecuperacion(usuario.email, usuario.nombre, enlace);
      } catch (errEmail) {
        console.error('Error enviando email de recuperacion:', errEmail.message);
        // No se revela al cliente si el envio de email fallo, para no filtrar si el usuario existe
      }
    }

    res.json(MENSAJE_GENERICO);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Completar la recuperacion: cambia la contrasena si el token es valido y no ha caducado
router.post('/reset-password', async (req, res) => {
  const { token, passwordNueva } = req.body;
  if (!token || !passwordNueva) {
    return res.status(400).json({ error: 'token y passwordNueva son obligatorios' });
  }
  if (passwordNueva.length < 6) {
    return res.status(400).json({ error: 'La contrasena nueva debe tener al menos 6 caracteres' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE reset_token_hash = ?',
      [hashToken(token)]
    );
    const usuario = rows[0];
    if (!usuario || !usuario.reset_token_expira || new Date(usuario.reset_token_expira) < new Date()) {
      return res.status(400).json({ error: 'El enlace no es valido o ha caducado. Solicita uno nuevo.' });
    }

    const passwordHash = await bcrypt.hash(passwordNueva, 10);
    await pool.query(
      `UPDATE usuarios SET password_hash = ?, debe_cambiar_password = FALSE,
       reset_token_hash = NULL, reset_token_expira = NULL WHERE id = ?`,
      [passwordHash, usuario.id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
