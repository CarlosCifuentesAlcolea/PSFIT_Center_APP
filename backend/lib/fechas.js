const MESES_POR_PLAN = { mensual: 1, trimestral: 3, anual: 12 };

// Calcula el proximo pago como el dia 1 del mes que corresponda segun el plan,
// contando desde `desde` (por defecto hoy). Ej: mensual desde 15 julio -> 1 agosto.
function calcularProximoPago(plan, desde = new Date()) {
  const meses = MESES_POR_PLAN[plan] || 1;
  const d = new Date(desde);
  d.setDate(1);
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
}

function formatoFecha(date) {
  return date.toISOString().slice(0, 10);
}

module.exports = { calcularProximoPago, formatoFecha, MESES_POR_PLAN };
