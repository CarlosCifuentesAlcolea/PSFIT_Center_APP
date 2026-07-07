import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const ESTADO_STYLES = {
  al_dia: 'bg-green-100 text-green-700',
  pendiente: 'bg-amber-100 text-amber-700',
  baja: 'bg-red-100 text-red-700'
};

const VACIO = { nombre: '', email: '', telefono: '', plan: 'mensual' };

export default function Usuarios({ usuario }) {
  const [socios, setSocios] = useState([]);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);

  function cargar() {
    api.getSocios().then(setSocios).catch((e) => setError(e.message));
  }

  useEffect(cargar, []);

  function editar(s) {
    setEditandoId(s.id);
    setNuevo({ nombre: s.nombre, email: s.email || '', telefono: s.telefono || '', plan: s.plan });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setNuevo(VACIO);
  }

  async function guardarSocio(e) {
    e.preventDefault();
    if (!nuevo.nombre) return;
    try {
      if (editandoId) {
        await api.actualizarSocio(editandoId, nuevo);
      } else {
        await api.crearSocio(nuevo);
      }
      setEditandoId(null);
      setNuevo(VACIO);
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
      <form onSubmit={guardarSocio} className="flex gap-2 mb-4">
        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm flex-1"
          placeholder="Nombre del socio"
          value={nuevo.nombre}
          onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
        />
        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm flex-1"
          placeholder="Email"
          value={nuevo.email}
          onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
        />
        <select
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
          value={nuevo.plan}
          onChange={(e) => setNuevo({ ...nuevo, plan: e.target.value })}
        >
          <option value="mensual">Mensual</option>
          <option value="anual">Anual</option>
          <option value="bono">Bono</option>
        </select>
        <button className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg" type="submit">
          {editandoId ? 'Guardar cambios' : 'Añadir socio'}
        </button>
        {editandoId && (
          <button
            type="button"
            onClick={cancelarEdicion}
            className="text-neutral-500 text-sm px-4 py-1.5 rounded-lg hover:bg-neutral-100"
          >
            Cancelar
          </button>
        )}
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

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
            <tr key={s.id} className="border-b border-neutral-100">
              <td className="py-2.5">{s.nombre}</td>
              <td className="py-2.5 text-neutral-500 capitalize">{s.plan}</td>
              <td className="py-2.5">
                <span className={`px-2.5 py-0.5 rounded-md text-xs ${ESTADO_STYLES[s.estado] || ''}`}>
                  {s.estado.replace('_', ' ')}
                </span>
              </td>
              <td className="py-2.5 text-neutral-500">
                {s.proximo_pago ? new Date(s.proximo_pago).toLocaleDateString('es-ES') : '—'}
              </td>
              <td className="py-2.5 text-right whitespace-nowrap">
                <button onClick={() => editar(s)} className="text-neutral-400 hover:text-brand-dark text-xs mr-2">
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
    </div>
  );
}
