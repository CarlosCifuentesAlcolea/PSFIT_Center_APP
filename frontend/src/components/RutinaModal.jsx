import { useState } from 'react';
import Modal from './Modal.jsx';
import { api } from '../api/client.js';

const RUTINA_VACIA = {
  nombre_rutina: '', edad: '', peso: '', altura: '', fecha_inicio: '', fecha_fin: '',
  patologias: '', dias_entrenamiento: '', objetivo: '', contenido: ''
};

// Formulario de crear/editar una rutina, reutilizado desde la ficha del socio
// y desde el apartado global de Rutinas. La cabecera (nombre/apellidos) viene
// siempre del socio y no es editable aqui.
export default function RutinaModal({ socio, rutina, onClose, onGuardado }) {
  const [form, setForm] = useState(
    rutina
      ? {
          nombre_rutina: rutina.nombre_rutina || '',
          edad: rutina.edad || '',
          peso: rutina.peso || '',
          altura: rutina.altura || '',
          fecha_inicio: rutina.fecha_inicio || '',
          fecha_fin: rutina.fecha_fin || '',
          patologias: rutina.patologias || '',
          dias_entrenamiento: rutina.dias_entrenamiento || '',
          objetivo: rutina.objetivo || '',
          contenido: rutina.contenido || ''
        }
      : RUTINA_VACIA
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function guardar(e) {
    e.preventDefault();
    if (!form.nombre_rutina || guardando) return;
    setGuardando(true);
    setError('');
    try {
      if (rutina) {
        await api.actualizarRutina(rutina.id, form);
      } else {
        await api.crearRutina({ ...form, socio_id: socio.id });
      }
      onGuardado();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <form
        onSubmit={guardar}
        className="bg-white rounded-xl p-5 w-full max-w-lg flex flex-col gap-3 shadow-lg max-h-[85vh] overflow-y-auto"
      >
        <p className="text-sm font-medium mb-1">{rutina ? 'Editar rutina' : 'Nueva rutina'}</p>

        <div className="bg-neutral-50 rounded-lg p-3 text-sm flex flex-col gap-1">
          <div className="flex justify-between"><span className="text-neutral-400">Nombre</span><span>{socio.nombre}</span></div>
          <div className="flex justify-between"><span className="text-neutral-400">Apellidos</span><span>{socio.apellidos || '—'}</span></div>
        </div>

        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
          placeholder="Nombre de la rutina (ej. Circuito Metabólico II)"
          value={form.nombre_rutina}
          onChange={(e) => setForm({ ...form, nombre_rutina: e.target.value })}
        />

        <div className="grid grid-cols-3 gap-2">
          <input
            className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
            placeholder="Edad"
            value={form.edad}
            onChange={(e) => setForm({ ...form, edad: e.target.value })}
          />
          <input
            className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
            placeholder="Peso"
            value={form.peso}
            onChange={(e) => setForm({ ...form, peso: e.target.value })}
          />
          <input
            className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
            placeholder="Altura"
            value={form.altura}
            onChange={(e) => setForm({ ...form, altura: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
            placeholder="Fecha de inicio"
            value={form.fecha_inicio}
            onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
          />
          <input
            className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
            placeholder="Fecha de finalización"
            value={form.fecha_fin}
            onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
          />
        </div>

        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
          placeholder="Patologías"
          value={form.patologias}
          onChange={(e) => setForm({ ...form, patologias: e.target.value })}
        />
        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
          placeholder="Días de entrenamiento"
          value={form.dias_entrenamiento}
          onChange={(e) => setForm({ ...form, dias_entrenamiento: e.target.value })}
        />
        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
          placeholder="Objetivo"
          value={form.objetivo}
          onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
        />
        <textarea
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm font-mono"
          placeholder="Contenido de la rutina (ejercicios, series, circuitos...)"
          rows={10}
          value={form.contenido}
          onChange={(e) => setForm({ ...form, contenido: e.target.value })}
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex justify-end gap-2 mt-1">
          <button type="button" onClick={onClose} className="text-neutral-500 text-sm px-4 py-1.5 rounded-lg hover:bg-neutral-100">
            Cancelar
          </button>
          <button className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50" type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar rutina'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
