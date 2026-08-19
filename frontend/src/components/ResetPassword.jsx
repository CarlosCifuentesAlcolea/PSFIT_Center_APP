import { useState } from 'react';
import { api } from '../api/client.js';
import CampoPassword from './CampoPassword.jsx';

export default function ResetPassword({ token }) {
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [hecho, setHecho] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    if (passwordNueva !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setCargando(true);
    try {
      await api.resetPassword(token, passwordNueva);
      setHecho(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-xs flex flex-col gap-3">
        <img src="/logo.png" alt="PS FIT Center" className="w-24 h-24 mx-auto mb-1 object-contain" />
        <p className="text-lg font-medium text-center mb-1">Elige tu nueva contraseña</p>

        {hecho ? (
          <>
            <p className="text-sm text-neutral-600 text-center">
              Tu contraseña se ha cambiado correctamente. Ya puedes cerrar esta ventana e iniciar sesión con ella.
            </p>
            <a href="/" className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg text-center">
              Ir al inicio de sesión
            </a>
          </>
        ) : (
          <form onSubmit={guardar} className="flex flex-col gap-3">
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
              disabled={cargando}
            >
              {cargando ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
