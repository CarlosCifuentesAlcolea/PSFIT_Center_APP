import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DISCLAIMER = [
  'DESCARGO DE RESPONSABILIDAD',
  'En todo momento expongo mis experiencias personales y no incito ni fomento el uso de sustancias ilegales ni',
  'practicas insanas. Por lo que este correo es meramente informativo de lo que yo personalmente hago y nunca',
  'recomiendo hacer, por lo tanto carente de responsabilidad.'
];

function formatFecha(valor) {
  if (!valor) return '—';
  return new Date(`${valor}T00:00:00`).toLocaleDateString('es-ES');
}

// Quita el "1.- " que añade el campo numerado automático; el PDF muestra cada
// línea como su propia fila de tabla, sin necesidad del prefijo numérico.
function lineasLimpias(texto) {
  if (!texto) return [];
  return texto
    .split('\n')
    .map((l) => l.replace(/^\d+\.-\s*/, '').trim())
    .filter(Boolean);
}

function filasSeccion(etiqueta, lineas) {
  const lista = lineas.length > 0 ? lineas : ['—'];
  return lista.map((linea, i) =>
    i === 0
      ? [{ content: etiqueta, rowSpan: lista.length, styles: { fontStyle: 'bold', valign: 'middle', fillColor: [243, 244, 238] } }, linea]
      : [linea]
  );
}

async function logoBase64() {
  const blob = await fetch('/logo.png').then((r) => r.blob());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generarPdfDieta(socio, dieta) {
  const doc = new jsPDF();

  try {
    const dataUrl = await logoBase64();
    doc.addImage(dataUrl, 'PNG', 14, 10, 20, 20);
  } catch {
    // si no se puede cargar el logo, se genera el pdf igualmente sin el
  }

  doc.setFontSize(16);
  doc.setTextColor(92, 110, 1);
  doc.text('PS FIT Center', 38, 18);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(dieta.nombre_dieta || 'Dieta', 38, 25);

  doc.setFontSize(9);
  doc.setTextColor(0);
  const infoLineas = [
    `Nombre: ${socio.nombre}    Apellidos: ${socio.apellidos || '—'}`,
    `Fecha de inicio: ${formatFecha(dieta.fecha_inicio)}    Fecha de finalización: ${formatFecha(dieta.fecha_fin)}`,
    `Patologías: ${dieta.patologias || '—'}`,
    `Objetivo: ${dieta.objetivo || '—'}`
  ];
  let y = 36;
  for (const linea of infoLineas) {
    doc.text(linea, 14, y);
    y += 5;
  }

  const cuerpo = [];
  cuerpo.push(...filasSeccion('AYUNAS', lineasLimpias(dieta.ayunas)));
  cuerpo.push(['', '']);
  (dieta.comidas || []).forEach((c, i) => {
    cuerpo.push(...filasSeccion(`COMIDA ${i + 1}`, lineasLimpias(c)));
    cuerpo.push(['', '']);
  });
  cuerpo.push(...filasSeccion('ANTES DE DORMIR', lineasLimpias(dieta.antes_dormir)));
  cuerpo.push(['', '']);
  cuerpo.push(...filasSeccion('SUPLEMENTACIÓN', lineasLimpias(dieta.suplementacion)));
  if (dieta.duracion_suplementacion) {
    cuerpo.push(['Duración', dieta.duracion_suplementacion]);
  }

  autoTable(doc, {
    startY: y + 3,
    head: [['Sección', 'Detalle']],
    body: cuerpo,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [92, 110, 1] }
  });

  const alturaPagina = doc.internal.pageSize.getHeight();
  let yPie = doc.lastAutoTable.finalY + 12;
  if (yPie > alturaPagina - 25) {
    doc.addPage();
    yPie = 20;
  }

  doc.setFontSize(8);
  doc.setTextColor(90);
  doc.setFont(undefined, 'bolditalic');
  doc.text(DISCLAIMER[0], 14, yPie);
  doc.setFont(undefined, 'italic');
  DISCLAIMER.slice(1).forEach((linea, i) => {
    doc.text(linea, 14, yPie + 4 + i * 4);
  });

  const base = `${socio.nombre}_${socio.apellidos || ''}_${dieta.nombre_dieta || 'dieta'}`.trim();
  doc.save(`${base.replace(/[^a-z0-9_-]+/gi, '_')}.pdf`);
}
