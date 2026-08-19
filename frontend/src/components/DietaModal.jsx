import { useState } from 'react';
import Modal from './Modal.jsx';
import AvisoPopup from './AvisoPopup.jsx';
import { api } from '../api/client.js';

const DIETA_VACIA = { nombre_dieta: '', fecha_inicio: '', fecha_fin: '', objetivo: '', contenido: '' };

// Formulario de crear/editar una dieta, reutilizado desde la ficha del socio
// y desde el apartado global de Dietas. La cabecera (nombre/apellidos) viene
// siempre del socio y no es editable aqui.
export default function DietaModal({ socio, dieta, onClose, onGuardado }) {
  const [form, setForm] = useState(
    dieta
      ? {
          nombre_dieta: dieta.nombre_dieta || '',
          fecha_inicio: dieta.fecha_inicio || '',
          fecha_fin: dieta.fecha_fin || '',
          objetivo: dieta.objetivo || '',
          contenido: dieta.contenido || ''
        }
      : DIETA_VACIA
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  async function guardar(e) {
    e.preventDefault();
    if (!form.nombre_dieta || !form.fecha_inicio || guardando) return;
    if (!form.fecha_fin) {
      setAviso('El campo "Fecha de finalización" está vacío. Complétalo antes de guardar la dieta.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      if (dieta) {
        await api.actualizarDieta(dieta.id, form);
      } else {
        await api.crearDieta({ ...form, socio_id: socio.id });
      }
      onGuardado();
    } catch (e) {
      if (e.message.includes('finalización')) {
        setAviso('El campo "Fecha de finalización" está vacío. Complétalo antes de guardar la dieta.');
      } else {
        setError(e.message);
      }
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
        <p className="text-sm font-medium mb-1">{dieta ? 'Editar dieta' : 'Nueva dieta'}</p>

        <div className="bg-neutral-50 rounded-lg p-3 text-sm flex flex-col gap-1">
          <div className="flex justify-between"><span className="text-neutral-400">Nombre</span><span>{socio.nombre}</span></div>
          <div className="flex justify-between"><span className="text-neutral-400">Apellidos</span><span>{socio.apellidos || '—'}</span></div>
        </div>

        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
          placeholder="Nombre de la dieta (ej. Dieta de definición)"
          value={form.nombre_dieta}
          onChange={(e) => setForm({ ...form, nombre_dieta: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400">Fecha de inicio *</label>
            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              type="date"
              required
              value={form.fecha_inicio}
              onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400">Fecha de finalización</label>
            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              type="date"
              value={form.fecha_fin}
              onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
            />
          </div>
        </div>

        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
          placeholder="Objetivo"
          value={form.objetivo}
          onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
        />

        <textarea
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm font-mono"
          placeholder="Contenido de la dieta (comidas, cantidades, horarios...)"
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
            {guardando ? 'Guardando...' : 'Guardar dieta'}
          </button>
        </div>
      </form>

      {aviso && <AvisoPopup mensaje={aviso} onClose={() => setAviso('')} />}
    </Modal>
  );
}
