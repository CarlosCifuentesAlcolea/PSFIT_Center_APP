import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import Modal from './Modal.jsx';
import { METODOS_PAGO, etiquetaMetodoPago } from '../lib/metodoPago.js';
import { validarDni } from '../lib/dni.js';

const ESTADO_STYLES = {
  al_dia: 'bg-green-100 text-green-700',
  pendiente: 'bg-amber-100 text-amber-700',
  baja: 'bg-red-100 text-red-700'
};

function formatEuros(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

const VACIO = {
  nombre: '', dni: '', email: '', telefono: '', observaciones: '',
  plan: 'mensual', diario: false, importe: '', metodo_pago: 'efectivo'
};

export default function Usuarios({ usuario }) {
  const [socios, setSocios] = useState([]);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevo, setNuevo] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [viendo, setViendo] = useState(null);
  const [historialPagos, setHistorialPagos] = useState([]);
  const [pagando, setPagando] = useState(null);
  const [datosPago, setDatosPago] = useState({ importe: '', metodo_pago: 'efectivo' });

  const [busqueda, setBusqueda] = useState('');
  const [filtroPlan, setFiltroPlan] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  function cargar() {
    api.getSocios().then(setSocios).catch((e) => setError(e.message));
  }

  useEffect(cargar, []);

  useEffect(() => {
    if (!viendo) {
      setHistorialPagos([]);
      return;
    }
    api.getMovimientos({ socio_id: viendo.id }).then(setHistorialPagos).catch(() => setHistorialPagos([]));
  }, [viendo]);

  const sociosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return socios.filter((s) => {
      if (filtroPlan !== 'todos' && s.plan !== filtroPlan) return false;
      if (filtroEstado !== 'todos' && s.estado !== filtroEstado) return false;
      if (!q) return true;
      return [s.nombre, s.dni, s.email, s.telefono].some((campo) => (campo || '').toLowerCase().includes(q));
    });
  }, [socios, busqueda, filtroPlan, filtroEstado]);

  function abrirModalCrear() {
    setEditandoId(null);
    setNuevo(VACIO);
    setError('');
    setModalAbierto(true);
  }

  function abrirModalEditar(s) {
    setEditandoId(s.id);
    setNuevo({
      nombre: s.nombre,
      dni: s.dni || '',
      email: s.email || '',
      telefono: s.telefono || '',
      observaciones: s.observaciones || '',
      plan: s.plan,
      diario: false,
      importe: ''
    });
    setError('');
    setModalAbierto(true);
  }

  async function guardarSocio(e) {
    e.preventDefault();
    if (!nuevo.nombre || guardando) return;
    if (nuevo.diario && !nuevo.importe) return;
    if (nuevo.dni && !validarDni(nuevo.dni)) {
      setError('El DNI no es válido');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      if (editandoId) {
        await api.actualizarSocio(editandoId, nuevo);
      } else {
        await api.crearSocio(nuevo);
      }
      setModalAbierto(false);
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  function abrirModalPago(socio) {
    setPagando(socio);
    setDatosPago({ importe: '', metodo_pago: 'efectivo' });
    setError('');
  }

  async function confirmarPago(e) {
    e.preventDefault();
    if (!datosPago.importe || guardando) return;
    setGuardando(true);
    setError('');
    try {
      await api.pagarSocio(pagando.id, { importe: parseFloat(datosPago.importe), metodo_pago: datosPago.metodo_pago });
      setPagando(null);
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    await api.eliminarSocio(id);
    cargar();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex gap-2 flex-1">
          <input
            className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm flex-1 max-w-xs"
            placeholder="Buscar por nombre, DNI, email o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select
            className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
            value={filtroPlan}
            onChange={(e) => setFiltroPlan(e.target.value)}
          >
            <option value="todos">Todos los planes</option>
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
            <option value="anual">Anual</option>
            <option value="diario">Diario</option>
          </select>
          <select
            className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="al_dia">Al día</option>
            <option value="pendiente">Pendiente</option>
            <option value="baja">Baja</option>
          </select>
        </div>
        <button
          onClick={abrirModalCrear}
          className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg whitespace-nowrap"
        >
          + Añadir socio
        </button>
      </div>

      {error && !modalAbierto && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="max-h-[28rem] overflow-y-auto border border-neutral-100 rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-neutral-400 border-b border-neutral-200 bg-white sticky top-0">
              <th className="py-2 px-3 font-normal">Nombre</th>
              <th className="py-2 font-normal">Plan</th>
              <th className="py-2 font-normal">Estado</th>
              <th className="py-2 font-normal">Próximo pago</th>
              <th className="py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {sociosFiltrados.map((s) => (
              <tr key={s.id} className={`border-b border-neutral-100 ${s.diario ? 'text-neutral-400' : ''}`}>
                <td className="py-2.5 px-3">{s.nombre}{!!s.diario && <span className="ml-1 text-xs">(diario)</span>}</td>
                <td className={`py-2.5 capitalize ${s.diario ? '' : 'text-neutral-500'}`}>{s.plan}</td>
                <td className="py-2.5">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs ${s.diario ? 'bg-neutral-100 text-neutral-400' : ESTADO_STYLES[s.estado] || ''}`}>
                    {s.estado.replace('_', ' ')}
                  </span>
                </td>
                <td className={`py-2.5 ${s.diario ? '' : 'text-neutral-500'}`}>
                  {s.proximo_pago ? new Date(s.proximo_pago).toLocaleDateString('es-ES') : '—'}
                </td>
                <td className="py-2.5 text-right whitespace-nowrap pr-3">
                  {!s.diario && s.estado !== 'al_dia' && (
                    <button onClick={() => abrirModalPago(s)} className="text-neutral-400 hover:text-green-600 text-xs mr-2">
                      Marcar como pagado
                    </button>
                  )}
                  <button onClick={() => setViendo(s)} className="text-neutral-400 hover:text-brand-dark text-xs mr-2">
                    Ver
                  </button>
                  <button onClick={() => abrirModalEditar(s)} className="text-neutral-400 hover:text-brand-dark text-xs mr-2">
                    Editar
                  </button>
                  {usuario.rol === 'admin' && (
                    <button onClick={() => eliminar(s.id)} className="text-neutral-400 hover:text-red-600 text-xs">
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {sociosFiltrados.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-neutral-400">Sin resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <Modal onClose={() => setModalAbierto(false)}>
          <form
            onSubmit={guardarSocio}
            className="bg-white rounded-xl p-5 w-full max-w-sm flex flex-col gap-3 shadow-lg"
          >
            <p className="text-sm font-medium mb-1">{editandoId ? 'Editar socio' : 'Añadir socio'}</p>

            {!editandoId && (
              <label className="flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={nuevo.diario}
                  onChange={(e) => setNuevo({ ...nuevo, diario: e.target.checked })}
                />
                Visitante diario (solo un día)
              </label>
            )}

            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Nombre del socio"
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            />

            {!nuevo.diario && (
              <>
                <input
                  className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
                  placeholder="DNI"
                  value={nuevo.dni}
                  onChange={(e) => setNuevo({ ...nuevo, dni: e.target.value })}
                />
                <input
                  className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
                  placeholder="Email"
                  value={nuevo.email}
                  onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
                />
                <input
                  className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
                  placeholder="Teléfono"
                  value={nuevo.telefono}
                  onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })}
                />
                <select
                  className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
                  value={nuevo.plan}
                  onChange={(e) => setNuevo({ ...nuevo, plan: e.target.value })}
                >
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="anual">Anual</option>
                </select>
                <textarea
                  className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
                  placeholder="Observaciones"
                  rows={2}
                  value={nuevo.observaciones}
                  onChange={(e) => setNuevo({ ...nuevo, observaciones: e.target.value })}
                />
                {!editandoId && (
                  <>
                    <input
                      className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
                      placeholder="Pago inicial cobrado (€, opcional)"
                      type="number"
                      step="0.01"
                      min="0"
                      value={nuevo.importe}
                      onChange={(e) => setNuevo({ ...nuevo, importe: e.target.value })}
                    />
                    <select
                      className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
                      value={nuevo.metodo_pago}
                      onChange={(e) => setNuevo({ ...nuevo, metodo_pago: e.target.value })}
                    >
                      {METODOS_PAGO.map((m) => (
                        <option key={m.valor} value={m.valor}>{m.icono} {m.etiqueta}</option>
                      ))}
                    </select>
                  </>
                )}
              </>
            )}

            {nuevo.diario && (
              <>
                <input
                  className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
                  placeholder="Importe cobrado (€)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={nuevo.importe}
                  onChange={(e) => setNuevo({ ...nuevo, importe: e.target.value })}
                />
                <select
                  className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
                  value={nuevo.metodo_pago}
                  onChange={(e) => setNuevo({ ...nuevo, metodo_pago: e.target.value })}
                >
                  {METODOS_PAGO.map((m) => (
                    <option key={m.valor} value={m.valor}>{m.icono} {m.etiqueta}</option>
                  ))}
                </select>
              </>
            )}

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="text-neutral-500 text-sm px-4 py-1.5 rounded-lg hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50"
                type="submit"
                disabled={guardando}
              >
                {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Añadir'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {viendo && (
        <Modal onClose={() => setViendo(null)}>
          <div className="bg-white rounded-xl p-5 w-full max-w-sm flex flex-col gap-3 shadow-lg">
            <p className="text-sm font-medium">{viendo.nombre}</p>

            <div className="text-sm text-neutral-600 flex flex-col gap-1.5">
              <div className="flex justify-between"><span className="text-neutral-400">DNI</span><span>{viendo.dni || '—'}</span></div>
              <div className="flex justify-between"><span className="text-neutral-400">Email</span><span>{viendo.email || '—'}</span></div>
              <div className="flex justify-between"><span className="text-neutral-400">Teléfono</span><span>{viendo.telefono || '—'}</span></div>
              <div className="flex justify-between"><span className="text-neutral-400">Plan</span><span className="capitalize">{viendo.diario ? 'Visitante diario' : viendo.plan}</span></div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Estado</span>
                <span className={`px-2.5 py-0.5 rounded-md text-xs ${ESTADO_STYLES[viendo.estado] || ''}`}>{viendo.estado.replace('_', ' ')}</span>
              </div>
              {!viendo.diario && (
                <div className="flex justify-between"><span className="text-neutral-400">Próximo pago</span><span>{viendo.proximo_pago ? new Date(viendo.proximo_pago).toLocaleDateString('es-ES') : '—'}</span></div>
              )}
              <div className="flex justify-between"><span className="text-neutral-400">Alta</span><span>{viendo.fecha_alta ? new Date(viendo.fecha_alta).toLocaleDateString('es-ES') : '—'}</span></div>
              {viendo.observaciones && (
                <div className="flex flex-col gap-0.5 pt-1">
                  <span className="text-neutral-400">Observaciones</span>
                  <span className="text-neutral-700">{viendo.observaciones}</span>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-100 pt-3">
              <p className="text-xs font-medium text-neutral-500 mb-1.5">Historial de pagos</p>
              {historialPagos.length === 0 ? (
                <p className="text-sm text-neutral-400">Sin pagos registrados todavía.</p>
              ) : (
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                  {historialPagos.map((m) => (
                    <div key={m.id} className="flex justify-between text-sm">
                      <span className="text-neutral-500">
                        {new Date(m.fecha).toLocaleDateString('es-ES')} · {etiquetaMetodoPago(m.metodo_pago)}
                      </span>
                      <span className="text-green-600">{formatEuros(m.importe)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-neutral-100 pt-3">
              <p className="text-xs font-medium text-neutral-500 mb-1.5">Rutinas asignadas</p>
              <p className="text-sm text-neutral-400">Sin rutinas asignadas todavía.</p>
            </div>

            <div>
              <p className="text-xs font-medium text-neutral-500 mb-1.5">Dietas asignadas</p>
              <p className="text-sm text-neutral-400">Sin dietas asignadas todavía.</p>
            </div>

            <div className="flex justify-end mt-1">
              <button onClick={() => setViendo(null)} className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg">
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {pagando && (
        <Modal onClose={() => setPagando(null)}>
          <form onSubmit={confirmarPago} className="bg-white rounded-xl p-5 w-full max-w-sm flex flex-col gap-3 shadow-lg">
            <p className="text-sm font-medium mb-1">Marcar como pagado — {pagando.nombre}</p>
            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Importe cobrado (€)"
              type="number"
              step="0.01"
              min="0"
              value={datosPago.importe}
              onChange={(e) => setDatosPago({ ...datosPago, importe: e.target.value })}
              autoFocus
            />
            <select
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              value={datosPago.metodo_pago}
              onChange={(e) => setDatosPago({ ...datosPago, metodo_pago: e.target.value })}
            >
              {METODOS_PAGO.map((m) => (
                <option key={m.valor} value={m.valor}>{m.icono} {m.etiqueta}</option>
              ))}
            </select>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end gap-2 mt-1">
              <button type="button" onClick={() => setPagando(null)} className="text-neutral-500 text-sm px-4 py-1.5 rounded-lg hover:bg-neutral-100">
                Cancelar
              </button>
              <button className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50" type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Confirmar pago'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
