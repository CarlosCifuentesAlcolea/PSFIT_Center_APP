const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

const ALFABETO_PASSWORD = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function generarPasswordTemporal(longitud = 10) {
  const bytes = crypto.randomBytes(longitud);
  let pass = '';
  for (let i = 0; i < longitud; i++) pass += ALFABETO_PASSWORD[bytes[i] % ALFABETO_PASSWORD.length];
  return pass;
}

// Listar personal (sin exponer password_hash)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, email, telefono, emoji, rol, created_at FROM usuarios ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear una cuenta de personal. La contrasena la genera el sistema (temporal);
// el nuevo empleado tiene que cambiarla en su primer inicio de sesion.
router.post('/', async (req, res) => {
  const { nombre, telefono, email, rol, emoji } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'nombre es obligatorio' });
  }
  if (rol && !['admin', 'empleado'].includes(rol)) {
    return res.status(400).json({ error: "rol debe ser 'admin' o 'empleado'" });
  }
  try {
    const passwordTemporal = generarPasswordTemporal();
    const passwordHash = await bcrypt.hash(passwordTemporal, 10);
    const { insertId } = await pool.query(
      `INSERT INTO usuarios (nombre, telefono, email, password_hash, rol, emoji, debe_cambiar_password)
       VALUES (?, ?, ?, ?, COALESCE(?, 'empleado'), COALESCE(?, '🙂'), TRUE)`,
      [nombre, telefono, email, passwordHash, rol, emoji]
    );
    const { rows } = await pool.query(
      'SELECT id, nombre, email, telefono, emoji, rol, created_at FROM usuarios WHERE id = ?',
      [insertId]
    );
    // password_temporal solo va en esta respuesta, nunca se guarda en texto plano ni se vuelve a mostrar
    res.status(201).json({ ...rows[0], password_temporal: passwordTemporal });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe una cuenta con ese nombre o email' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Actualizar una cuenta de personal (password opcional: si el admin pone una nueva,
// tambien queda marcada para cambiarla en el proximo login)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, email, password, rol, emoji } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  if (rol && !['admin', 'empleado'].includes(rol)) {
    return res.status(400).json({ error: "rol debe ser 'admin' o 'empleado'" });
  }
  try {
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      const { affectedRows } = await pool.query(
        `UPDATE usuarios SET nombre = ?, telefono = ?, email = COALESCE(?, email),
         rol = COALESCE(?, rol), emoji = COALESCE(?, emoji), password_hash = ?, debe_cambiar_password = TRUE
         WHERE id = ?`,
        [nombre, telefono, email, rol, emoji, passwordHash, id]
      );
      if (affectedRows === 0) return res.status(404).json({ error: 'Cuenta no encontrada' });
    } else {
      const { affectedRows } = await pool.query(
        `UPDATE usuarios SET nombre = ?, telefono = ?, email = COALESCE(?, email),
         rol = COALESCE(?, rol), emoji = COALESCE(?, emoji)
         WHERE id = ?`,
        [nombre, telefono, email, rol, emoji, id]
      );
      if (affectedRows === 0) return res.status(404).json({ error: 'Cuenta no encontrada' });
    }
    const { rows } = await pool.query(
      'SELECT id, nombre, email, telefono, emoji, rol, created_at FROM usuarios WHERE id = ?',
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe una cuenta con ese nombre o email' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Eliminar una cuenta de personal
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
