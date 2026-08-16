import { useState } from 'react';
import { OPCIONES_SERIES, OPCIONES_REPETICIONES } from '../lib/rutinaOpciones.js';

export default function BloqueCard({ bloque, tiposEjercicio, onEliminarBloque, onAgregarEjercicio, onEliminarEjercicio }) {
  const [tipo, setTipo] = useState('');
  const [series, setSeries] = useState('');
  const [repeticiones, setRepeticiones] = useState('');

  const listo = tipo && series && repeticiones;

  function aceptar() {
    onAgregarEjercicio(bloque.id, { tipo, series, repeticiones });
    setTipo('');
    setSeries('');
    setRepeticiones('');
  }

  return (
    <div className="border border-neutral-200 rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{bloque.nombre}</p>
        <button type="button" onClick={() => onEliminarBloque(bloque.id)} className="text-neutral-400 hover:text-red-600 text-xs">
          Quitar
        </button>
      </div>

      {bloque.ejercicios.length > 0 && (
        <div className="flex flex-col gap-1">
          {bloque.ejercicios.map((ej, i) => (
            <div key={i} className="flex items-center justify-between text-sm text-neutral-600 bg-neutral-50 rounded-lg px-2 py-1">
              <span>{ej.tipo} — {ej.series}x{ej.repeticiones}</span>
              <button
                type="button"
                onClick={() => onEliminarEjercicio(bloque.id, i)}
                className="text-neutral-400 hover:text-red-600 text-xs px-1"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-center flex-wrap">
        <select className="border border-neutral-200 rounded-lg px-2 py-1 text-xs" value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Tipo de ejercicio...</option>
          {tiposEjercicio.map((t) => (
            <option key={t.id} value={t.nombre}>{t.nombre}</option>
          ))}
        </select>
        <select className="border border-neutral-200 rounded-lg px-2 py-1 text-xs" value={series} onChange={(e) => setSeries(e.target.value)}>
          <option value="">Nº series...</option>
          {OPCIONES_SERIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          className="border border-neutral-200 rounded-lg px-2 py-1 text-xs"
          value={repeticiones}
          onChange={(e) => setRepeticiones(e.target.value)}
        >
          <option value="">Nº repeticiones...</option>
          {OPCIONES_REPETICIONES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        {listo && (
          <button type="button" onClick={aceptar} className="bg-brand-dark text-white text-xs px-3 py-1 rounded-lg">
            Aceptar
          </button>
        )}
      </div>
    </div>
  );
}
