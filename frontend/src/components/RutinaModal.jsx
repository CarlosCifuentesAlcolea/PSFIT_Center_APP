import { useState } from 'react';
import Modal from './Modal.jsx';
import BloqueCard from './BloqueCard.jsx';
import CampoNumerado from './CampoNumerado.jsx';
import AvisoPopup from './AvisoPopup.jsx';
import { api } from '../api/client.js';
import { OPCIONES_CABECERA } from '../lib/rutinaOpciones.js';

const RUTINA_VACIA = {
  nombre_rutina: '', edad: '', peso: '', altura: '', fecha_inicio: '', fecha_fin: '',
  patologias: '', dias_entrenamiento: '', objetivo: '', calentamiento: ''
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
          calentamiento: rutina.calentamiento || ''
        }
      : RUTINA_VACIA
  );
  const [bloques, setBloques] = useState(rutina?.bloques || []);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const opcionesDisponibles = OPCIONES_CABECERA.filter(
    (o) => !bloques.some((b) => b.nombre === o)
  );

  function agregarBloque(nombre) {
    if (!nombre) return;
    setBloques([...bloques, { id: nombre, nombre, ejercicios: [] }]);
  }

  function eliminarBloque(id) {
    setBloques(bloques.filter((b) => b.id !== id));
  }

  function agregarEjercicio(bloqueId, ejercicio) {
    setBloques(bloques.map((b) => (b.id === bloqueId ? { ...b, ejercicios: [...b.ejercicios, ejercicio] } : b)));
  }

  function eliminarEjercicio(bloqueId, index) {
    setBloques(
      bloques.map((b) =>
        b.id === bloqueId ? { ...b, ejercicios: b.ejercicios.filter((_, i) => i !== index) } : b
      )
    );
  }

  async function guardar(e) {
    e.preventDefault();
    if (!form.nombre_rutina || !form.fecha_inicio || guardando) return;
    if (!form.fecha_fin) {
      setAviso('El campo "Fecha de finalización" está vacío. Complétalo antes de guardar la rutina.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const datos = { ...form, bloques };
      if (rutina) {
        await api.actualizarRutina(rutina.id, datos);
      } else {
        await api.crearRutina({ ...datos, socio_id: socio.id });
      }
      onGuardado();
    } catch (e) {
      if (e.message.includes('finalización')) {
        setAviso('El campo "Fecha de finalización" está vacío. Complétalo antes de guardar la rutina.');
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

        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-400">Calentamiento</label>
          <CampoNumerado
            value={form.calentamiento}
            onChange={(v) => setForm({ ...form, calentamiento: v })}
            placeholder="Pulsa aquí y escribe; cada línea nueva se numera sola"
            rows={4}
          />
        </div>

        <div className="border-t border-neutral-100 pt-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">RUTINA</p>
            <select
              className="border border-neutral-200 rounded-lg px-2 py-1 text-xs"
              value=""
              onChange={(e) => agregarBloque(e.target.value)}
            >
              <option value="">+ Añadir día o bloque...</option>
              {opcionesDisponibles.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          {bloques.length === 0 ? (
            <p className="text-sm text-neutral-400">Sin días ni bloques añadidos todavía.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {bloques.map((b) => (
                <BloqueCard
                  key={b.id}
                  bloque={b}
                  onEliminarBloque={eliminarBloque}
                  onAgregarEjercicio={agregarEjercicio}
                  onEliminarEjercicio={eliminarEjercicio}
                />
              ))}
            </div>
          )}
        </div>

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

      {aviso && <AvisoPopup mensaje={aviso} onClose={() => setAviso('')} />}
    </Modal>
  );
}
