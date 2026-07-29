import { useState } from 'react';
import { api } from '../api/client.js';

export default function OlvidePassword({ onVolver }) {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const { mensaje } = await api.olvidePassword(email);
      setMensaje(mensaje);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-xs flex flex-col gap-3">
        <img src="/logo.png" alt="PS FIT Center" className="w-24 h-24 mx-auto mb-1 object-contain" />
        <p className="text-lg font-medium text-center mb-1">Recuperar contraseña</p>

        {mensaje ? (
          <p className="text-sm text-neutral-600 text-center">{mensaje}</p>
        ) : (
          <form onSubmit={enviar} className="flex flex-col gap-3">
            <p className="text-sm text-neutral-500 text-center mb-1">
              Escribe el email asociado a tu cuenta y te mandaremos un enlace para elegir una contraseña nueva.
            </p>
            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50"
              type="submit"
              disabled={cargando}
            >
              {cargando ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}

        <button onClick={onVolver} className="text-neutral-500 text-sm hover:text-brand-dark">
          ← Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}
