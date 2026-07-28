import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Modal from './Modal.jsx';

const ESTADO_STYLES = {
  al_dia: 'bg-green-100 text-green-700',
  pendiente: 'bg-amber-100 text-amber-700',
  baja: 'bg-red-100 text-red-700'
};

const VACIO = { nombre: '', email: '', telefono: '', plan: 'mensual', diario: false, importe: '' };

export default function Usuarios({ usuario }) {
  const [socios, setSocios] = useState([]);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevo, setNuevo] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    api.getSocios().then(setSocios).catch((e) => setError(e.message));
  }

  useEffect(cargar, []);

  function abrirModalCrear() {
    setEditandoId(null);
    setNuevo(VACIO);
    setError('');
    setModalAbierto(true);
  }

  function abrirModalEditar(s) {
    setEditandoId(s.id);
    setNuevo({ nombre: s.nombre, email: s.email || '', telefono: s.telefono || '', plan: s.plan, diario: false, importe: '' });
    setError('');
    setModalAbierto(true);
  }

  async function guardarSocio(e) {
    e.preventDefault();
    if (!nuevo.nombre || guardando) return;
    if (nuevo.diario && !nuevo.importe) return;
    setGuardando(true);
    setError('');
    try {
      if (editandoId) {
        await api.actualizarSocio(editandoId, nuevo);
      } else {
        await api.crearSocio(nuevo);
      }
      setModalAbierto(false);
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function marcarPagado(id) {
    try {
      await api.pagarSocio(id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  async function eliminar(id) {
    await api.eliminarSocio(id);
    cargar();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={abrirModalCrear}
          className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg"
        >
          + Añadir socio
        </button>
      </div>

      {error && !modalAbierto && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-neutral-400 border-b border-neutral-200">
            <th className="py-2 font-normal">Nombre</th>
            <th className="py-2 font-normal">Plan</th>
            <th className="py-2 font-normal">Estado</th>
            <th className="py-2 font-normal">Próximo pago</th>
            <th className="py-2 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          {socios.map((s) => (
            <tr key={s.id} className={`border-b border-neutral-100 ${s.diario ? 'text-neutral-400' : ''}`}>
              <td className="py-2.5">{s.nombre}{s.diario && <span className="ml-1 text-xs">(diario)</span>}</td>
              <td className={`py-2.5 capitalize ${s.diario ? '' : 'text-neutral-500'}`}>{s.plan}</td>
              <td className="py-2.5">
                <span className={`px-2.5 py-0.5 rounded-md text-xs ${s.diario ? 'bg-neutral-100 text-neutral-400' : ESTADO_STYLES[s.estado] || ''}`}>
                  {s.estado.replace('_', ' ')}
                </span>
              </td>
              <td className={`py-2.5 ${s.diario ? '' : 'text-neutral-500'}`}>
                {s.proximo_pago ? new Date(s.proximo_pago).toLocaleDateString('es-ES') : '—'}
              </td>
              <td className="py-2.5 text-right whitespace-nowrap">
                {!s.diario && s.estado !== 'al_dia' && (
                  <button onClick={() => marcarPagado(s.id)} className="text-neutral-400 hover:text-green-600 text-xs mr-2">
                    Marcar como pagado
                  </button>
                )}
                <button onClick={() => abrirModalEditar(s)} className="text-neutral-400 hover:text-brand-dark text-xs mr-2">
                  Editar
                </button>
                {usuario.rol === 'admin' && (
                  <button onClick={() => eliminar(s.id)} className="text-neutral-400 hover:text-red-600 text-xs">
                    Eliminar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modalAbierto && (
        <Modal onClose={() => setModalAbierto(false)}>
          <form
            onSubmit={guardarSocio}
            className="bg-white rounded-xl p-5 w-full max-w-sm flex flex-col gap-3 shadow-lg"
          >
            <p className="text-sm font-medium mb-1">{editandoId ? 'Editar socio' : 'Añadir socio'}</p>

            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Nombre del socio"
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            />

            {!editandoId && (
              <label className="flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={nuevo.diario}
                  onChange={(e) => setNuevo({ ...nuevo, diario: e.target.checked })}
                />
                Visitante diario (solo un día)
              </label>
            )}

            {!nuevo.diario && (
              <>
                <input
                  className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
                  placeholder="Email"
                  value={nuevo.email}
                  onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
                />
                <input
                  className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
                  placeholder="Teléfono"
                  value={nuevo.telefono}
                  onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })}
                />
                <select
                  className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
                  value={nuevo.plan}
                  onChange={(e) => setNuevo({ ...nuevo, plan: e.target.value })}
                >
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="anual">Anual</option>
                </select>
              </>
            )}

            {nuevo.diario && (
              <input
                className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
                placeholder="Importe cobrado (€)"
                type="number"
                step="0.01"
                min="0"
                value={nuevo.importe}
                onChange={(e) => setNuevo({ ...nuevo, importe: e.target.value })}
              />
            )}

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
    </div>
  );
}
