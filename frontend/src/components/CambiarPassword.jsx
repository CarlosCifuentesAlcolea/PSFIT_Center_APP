import { useState } from 'react';
import { api } from '../api/client.js';
import CampoPassword from './CampoPassword.jsx';

export default function CambiarPassword({ usuario, onCambiada }) {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    if (passwordNueva !== confirmar) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    setGuardando(true);
    try {
      await api.cambiarPassword(passwordActual, passwordNueva);
      onCambiada();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <form onSubmit={guardar} className="w-full max-w-xs flex flex-col gap-3">
        <img src="/logo.png" alt="PS FIT Center" className="w-24 h-24 mx-auto mb-1 object-contain" />
        <p className="text-lg font-medium text-center mb-1">Cambia tu contraseña</p>
        <p className="text-sm text-neutral-500 text-center mb-2">
          Hola {usuario.nombre}, por seguridad tienes que elegir una contraseña nueva antes de continuar.
        </p>

        <CampoPassword
          placeholder="Contraseña temporal actual"
          value={passwordActual}
          onChange={setPasswordActual}
        />
        <CampoPassword
          placeholder="Contraseña nueva"
          value={passwordNueva}
          onChange={setPasswordNueva}
          mostrarFuerza
        />
        <CampoPassword
          placeholder="Repite la contraseña nueva"
          value={confirmar}
          onChange={setConfirmar}
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50"
          type="submit"
          disabled={guardando}
        >
          {guardando ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  );
}
