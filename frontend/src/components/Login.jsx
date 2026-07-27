import { useState } from 'react';
import { api } from '../api/client.js';

export default function Login({ onLogin }) {
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const usuario = await api.login(nombre, password);
      onLogin(usuario);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <form onSubmit={entrar} className="w-full max-w-xs flex flex-col gap-3">
        <img src="/logo.png" alt="PS FIT Center" className="w-24 h-24 mx-auto mb-1 object-contain" />
        <p className="text-lg font-medium text-center mb-2">PS FIT CENTER</p>

        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
          placeholder="Nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50"
          type="submit"
          disabled={cargando}
        >
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
