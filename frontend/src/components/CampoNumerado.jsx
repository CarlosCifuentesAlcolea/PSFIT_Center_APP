import { useRef } from 'react';

// Textarea que numera automaticamente cada linea nueva (1.- , 2.- , ...) al pulsar Enter.
export default function CampoNumerado({ value, onChange, placeholder, rows = 4 }) {
  const ref = useRef(null);

  function manejarKeyDown(e) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const textarea = ref.current;
    const inicio = textarea.selectionStart;
    const antes = value.slice(0, inicio);
    const despues = value.slice(inicio);
    const numeroSiguiente = antes.split('\n').length + 1;
    const inserto = `\n${numeroSiguiente}.- `;
    const nuevoValor = antes + inserto + despues;
    onChange(nuevoValor);
    requestAnimationFrame(() => {
      const posicion = antes.length + inserto.length;
      textarea.selectionStart = textarea.selectionEnd = posicion;
    });
  }

  function manejarFocus() {
    if (!value) onChange('1.- ');
  }

  return (
    <textarea
      ref={ref}
      className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm font-mono"
      placeholder={placeholder}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={manejarKeyDown}
      onFocus={manejarFocus}
    />
  );
}
