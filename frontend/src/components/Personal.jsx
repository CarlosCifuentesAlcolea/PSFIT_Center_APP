import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Modal from './Modal.jsx';

const EMOJIS = ['🙂', '😎', '💪', '🏋️', '🤸', '🥊', '🏃', '🧘', '⭐', '🔥', '🦸', '🐯'];
const VACIO = { nombre: '', telefono: '', password: '', rol: 'empleado', emoji: EMOJIS[0] };

export default function Personal() {
  const [personal, setPersonal] = useState([]);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [nuevo, setNuevo] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [credenciales, setCredenciales] = useState(null);

  function cargar() {
    api.getUsuarios().then(setPersonal).catch((e) => setError(e.message));
  }

  useEffect(cargar, []);

  function abrirModalCrear() {
    setEditandoId(null);
    setNuevo(VACIO);
    setError('');
    setModalAbierto(true);
  }

  function abrirModalEditar(p) {
    setEditandoId(p.id);
    setNuevo({ nombre: p.nombre, telefono: p.telefono || '', password: '', rol: p.rol, emoji: p.emoji || EMOJIS[0] });
    setError('');
    setModalAbierto(true);
  }

  async function guardarUsuario(e) {
    e.preventDefault();
    if (!nuevo.nombre || !nuevo.telefono || guardando) return;
    setGuardando(true);
    setError('');
    try {
      if (editandoId) {
        await api.actualizarUsuario(editandoId, nuevo);
        setModalAbierto(false);
      } else {
        const creado = await api.crearUsuario(nuevo);
        setModalAbierto(false);
        setCredenciales({ nombre: creado.nombre, password: creado.password_temporal });
      }
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    await api.eliminarUsuario(id);
    cargar();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={abrirModalCrear}
          className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg"
        >
          + Añadir empleado
        </button>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-neutral-400 border-b border-neutral-200">
            <th className="py-2 font-normal"></th>
            <th className="py-2 font-normal">Nombre</th>
            <th className="py-2 font-normal">Teléfono</th>
            <th className="py-2 font-normal">Rol</th>
            <th className="py-2 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          {personal.map((p) => (
            <tr key={p.id} className="border-b border-neutral-100">
              <td className="py-2.5 text-lg">{p.emoji || '🙂'}</td>
              <td className="py-2.5">{p.nombre}</td>
              <td className="py-2.5 text-neutral-500">{p.telefono || '—'}</td>
              <td className="py-2.5 text-neutral-500 capitalize">{p.rol}</td>
              <td className="py-2.5 text-right whitespace-nowrap">
                <button onClick={() => abrirModalEditar(p)} className="text-neutral-400 hover:text-brand-dark text-xs mr-2">
                  Editar
                </button>
                <button onClick={() => eliminar(p.id)} className="text-neutral-400 hover:text-red-600 text-xs">
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalAbierto && (
        <Modal onClose={() => setModalAbierto(false)}>
          <form
            onSubmit={guardarUsuario}
            className="bg-white rounded-xl p-5 w-full max-w-sm flex flex-col gap-3 shadow-lg"
          >
            <p className="text-sm font-medium mb-1">{editandoId ? 'Editar empleado' : 'Añadir empleado'}</p>

            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNuevo({ ...nuevo, emoji })}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border ${
                    nuevo.emoji === emoji
                      ? 'border-brand-dark bg-brand/20'
                      : 'border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Nombre"
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            />
            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Teléfono"
              value={nuevo.telefono}
              onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })}
            />
            {editandoId && (
              <input
                className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
                placeholder="Nueva contraseña (opcional, deja en blanco para no cambiarla)"
                type="password"
                value={nuevo.password}
                onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })}
              />
            )}
            {!editandoId && (
              <p className="text-xs text-neutral-400">
                La contraseña se genera automáticamente y se te mostrará al crear la cuenta. El empleado deberá cambiarla en su primer inicio de sesión.
              </p>
            )}
            <select
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              value={nuevo.rol}
              onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}
            >
              <option value="empleado">Empleado</option>
              <option value="admin">Admin</option>
            </select>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-neutral-500 text-sm px-4 py-1.5 rounded-lg hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50"
                type="submit"
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Añadir'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {credenciales && (
        <Modal onClose={() => setCredenciales(null)}>
          <div className="bg-white rounded-xl p-5 w-full max-w-sm flex flex-col gap-3 shadow-lg">
            <p className="text-sm font-medium">Cuenta creada</p>
            <p className="text-sm text-neutral-600">
              Comparte estos datos con <strong>{credenciales.nombre}</strong> para su primer inicio de sesión (se le pedirá cambiar la contraseña):
            </p>
            <div className="bg-neutral-50 rounded-lg p-3 text-sm font-mono">
              <p>Nombre: {credenciales.nombre}</p>
              <p>Contraseña: {credenciales.password}</p>
            </div>
            <p className="text-xs text-neutral-400">Esta contraseña no se volverá a mostrar. Anótala ahora si la necesitas.</p>
            <div className="flex justify-end mt-1">
              <button
                onClick={() => setCredenciales(null)}
                className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg"
              >
                Entendido
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
