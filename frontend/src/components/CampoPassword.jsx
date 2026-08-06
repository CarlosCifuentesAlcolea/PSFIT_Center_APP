import { useState } from 'react';

function calcularFuerza(password) {
  if (!password) return null;
  let puntos = 0;
  if (password.length >= 8) puntos++;
  if (password.length >= 12) puntos++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) puntos++;
  if (/\d/.test(password)) puntos++;
  if (/[^A-Za-z0-9]/.test(password)) puntos++;
  if (puntos <= 2) return 'debil';
  if (puntos <= 3) return 'media';
  return 'fuerte';
}

const ESTILOS = {
  debil: { barra: 'bg-red-500 w-1/3', texto: 'text-red-600', etiqueta: 'Débil' },
  media: { barra: 'bg-yellow-500 w-2/3', texto: 'text-yellow-600', etiqueta: 'Media' },
  fuerte: { barra: 'bg-green-500 w-full', texto: 'text-green-600', etiqueta: 'Fuerte' }
};

export default function CampoPassword({ value, onChange, placeholder, mostrarFuerza = false }) {
  const [capsLock, setCapsLock] = useState(false);

  function detectarCapsLock(e) {
    if (typeof e.getModifierState === 'function') {
      setCapsLock(e.getModifierState('CapsLock'));
    }
  }

  const fuerza = mostrarFuerza ? calcularFuerza(value) : null;
  const estilo = fuerza && ESTILOS[fuerza];

  return (
    <div className="flex flex-col gap-1">
      <input
        className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
        placeholder={placeholder}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyUp={detectarCapsLock}
        onKeyDown={detectarCapsLock}
      />
      {capsLock && <p className="text-xs text-amber-600">⚠ Bloq Mayús está activado</p>}
      {estilo && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${estilo.barra}`} />
          </div>
          <span className={`text-xs ${estilo.texto}`}>{estilo.etiqueta}</span>
        </div>
      )}
    </div>
  );
}
