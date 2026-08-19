import { useEffect, useState } from 'react';
import { api } from './api/client.js';
import Sidebar from './components/Sidebar.jsx';
import Login from './components/Login.jsx';
import Panel from './components/Panel.jsx';
import Usuarios from './components/Usuarios.jsx';
import Productos from './components/Productos.jsx';
import Rutinas from './components/Rutinas.jsx';
import Dietas from './components/Dietas.jsx';
import Contabilidad from './components/Contabilidad.jsx';
import Personal from './components/Personal.jsx';
import Avisos from './components/Avisos.jsx';
import CambiarPassword from './components/CambiarPassword.jsx';
import ResetPassword from './components/ResetPassword.jsx';

const TITLES = {
  panel: 'Panel',
  usuarios: 'Usuarios',
  productos: 'Productos',
  rutinas: 'Rutinas',
  dietas: 'Dietas',
  avisos: 'Avisos',
  contabilidad: 'Contabilidad',
  personal: 'Personal'
};

const TABS_SOLO_ADMIN = ['contabilidad', 'personal'];

export default function App() {
  const [tab, setTab] = useState('panel');
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    api.me().then(setUsuario).catch(() => {}).finally(() => setVerificando(false));
  }, []);

  function cerrarSesion() {
    api.logout();
    setUsuario(null);
    setTab('panel');
  }

  if (window.location.pathname === '/reset-password') {
    const token = new URLSearchParams(window.location.search).get('token');
    return <ResetPassword token={token} />;
  }

  if (verificando) return null;
  if (!usuario) return <Login onLogin={setUsuario} />;
  if (usuario.debe_cambiar_password) {
    return <CambiarPassword usuario={usuario} onCambiada={() => setUsuario({ ...usuario, debe_cambiar_password: false })} />;
  }

  const esAdmin = usuario.rol === 'admin';
  const tabActiva = TABS_SOLO_ADMIN.includes(tab) && !esAdmin ? 'panel' : tab;

  return (
    <div className="h-screen flex bg-white text-neutral-800">
      <Sidebar active={tabActiva} onChange={setTab} usuario={usuario} onLogout={cerrarSesion} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-neutral-200 px-6 py-4">
          <p className="text-base font-medium">{TITLES[tabActiva]}</p>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {tabActiva === 'panel' && <Panel />}
          {tabActiva === 'usuarios' && <Usuarios usuario={usuario} />}
          {tabActiva === 'productos' && <Productos usuario={usuario} />}
          {tabActiva === 'rutinas' && <Rutinas usuario={usuario} />}
          {tabActiva === 'dietas' && <Dietas />}
          {tabActiva === 'avisos' && <Avisos />}
          {tabActiva === 'contabilidad' && esAdmin && <Contabilidad />}
          {tabActiva === 'personal' && esAdmin && <Personal />}
        </main>
      </div>
    </div>
  );
}
