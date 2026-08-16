import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { api } from '../api/client.js';

export default function GestionEjercicios({ onClose }) {
  const [ejercicios, setEjercicios] = useState([]);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    api.getTiposEjercicio().then(setEjercicios).catch((e) => setError(e.message));
  }

  useEffect(cargar, []);

  async function agregar(e) {
    e.preventDefault();
    if (!nuevo.trim() || guardando) return;
    setGuardando(true);
    setError('');
    try {
      await api.crearTipoEjercicio(nuevo.trim());
      setNuevo('');
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  function abrirEditar(ej) {
    setEditandoId(ej.id);
    setNombreEditado(ej.nombre);
    setError('');
  }

  async function guardarEdicion(e) {
    e.preventDefault();
    if (!nombreEditado.trim() || guardando) return;
    setGuardando(true);
    setError('');
    try {
      await api.actualizarTipoEjercicio(editandoId, nombreEditado.trim());
      setEditandoId(null);
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    await api.eliminarTipoEjercicio(id);
    cargar();
  }

  return (
    <Modal onClose={onClose}>
      <div className="bg-white rounded-xl p-5 w-full max-w-md flex flex-col gap-3 shadow-lg max-h-[85vh]">
        <p className="text-sm font-medium">Ejercicios</p>
        <p className="text-xs text-neutral-400 -mt-2">
          Esta lista alimenta el desplegable de "Tipo de ejercicio" al construir una rutina.
        </p>

        <form onSubmit={agregar} className="flex gap-2">
          <input
            className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm flex-1"
            placeholder="Nombre del ejercicio nuevo"
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
          />
          <button
            className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50"
            type="submit"
            disabled={guardando}
          >
            Añadir
          </button>
        </form>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex flex-col gap-1 overflow-y-auto">
          {ejercicios.map((ej) => (
            <div key={ej.id} className="flex items-center justify-between text-sm border-b border-neutral-100 py-1.5">
              {editandoId === ej.id ? (
                <form onSubmit={guardarEdicion} className="flex gap-2 flex-1">
                  <input
                    className="border border-neutral-200 rounded-lg px-2 py-1 text-sm flex-1"
                    value={nombreEditado}
                    onChange={(e) => setNombreEditado(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="text-brand-dark text-xs hover:underline" disabled={guardando}>
                    Guardar
                  </button>
                  <button type="button" onClick={() => setEditandoId(null)} className="text-neutral-400 text-xs hover:underline">
                    Cancelar
                  </button>
                </form>
              ) : (
                <>
                  <span>{ej.nombre}</span>
                  <div className="flex gap-2 whitespace-nowrap">
                    <button onClick={() => abrirEditar(ej)} className="text-neutral-400 hover:text-brand-dark text-xs">
                      Editar
                    </button>
                    <button onClick={() => eliminar(ej.id)} className="text-neutral-400 hover:text-red-600 text-xs">
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {ejercicios.length === 0 && <p className="text-sm text-neutral-400 py-2">Sin ejercicios todavía.</p>}
        </div>

        <div className="flex justify-end mt-1">
          <button onClick={onClose} className="text-neutral-500 text-sm px-4 py-1.5 rounded-lg hover:bg-neutral-100">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
