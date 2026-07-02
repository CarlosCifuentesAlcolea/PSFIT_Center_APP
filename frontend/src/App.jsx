import { useEffect, useState } from 'react';
import { api } from './api/client.js';
import Sidebar from './components/Sidebar.jsx';
import Login from './components/Login.jsx';
import Panel from './components/Panel.jsx';
import Usuarios from './components/Usuarios.jsx';
import Productos from './components/Productos.jsx';
import Contabilidad from './components/Contabilidad.jsx';

const TITLES = {
  panel: 'Panel',
  usuarios: 'Usuarios',
  productos: 'Productos',
  contabilidad: 'Contabilidad'
};

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

  if (verificando) return null;
  if (!usuario) return <Login onLogin={setUsuario} />;

  const esAdmin = usuario.rol === 'admin';
  const tabActiva = tab === 'contabilidad' && !esAdmin ? 'panel' : tab;

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
          {tabActiva === 'contabilidad' && esAdmin && <Contabilidad />}
        </main>
      </div>
    </div>
  );
}
