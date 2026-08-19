import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatFecha(valor) {
  if (!valor) return '—';
  return new Date(`${valor}T00:00:00`).toLocaleDateString('es-ES');
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

export async function generarPdfRutina(socio, rutina) {
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
  doc.text(rutina.nombre_rutina || 'Rutina de entrenamiento', 38, 25);

  doc.setFontSize(9);
  doc.setTextColor(0);
  const infoLineas = [
    `Nombre: ${socio.nombre}    Apellidos: ${socio.apellidos || '—'}`,
    `Edad: ${rutina.edad || '—'}    Peso: ${rutina.peso || '—'}    Altura: ${rutina.altura || '—'}`,
    `Fecha de inicio: ${formatFecha(rutina.fecha_inicio)}    Fecha de finalización: ${formatFecha(rutina.fecha_fin)}`,
    `Patologías: ${rutina.patologias || '—'}    Días de entrenamiento: ${rutina.dias_entrenamiento || '—'}`,
    `Objetivo: ${rutina.objetivo || '—'}`
  ];
  let y = 36;
  for (const linea of infoLineas) {
    doc.text(linea, 14, y);
    y += 5;
  }

  if (rutina.calentamiento) {
    doc.setFont(undefined, 'bold');
    doc.text('Calentamiento', 14, y);
    doc.setFont(undefined, 'normal');
    y += 5;
    for (const linea of rutina.calentamiento.split('\n')) {
      if (!linea.trim()) continue;
      doc.text(linea.replace(/^\d+\.-\s*/, '• '), 14, y);
      y += 4.5;
    }
    y += 3;
  }

  const cuerpo = [];
  (rutina.bloques || []).forEach((b) => {
    if (b.ejercicios.length === 0) {
      cuerpo.push([{ content: b.nombre, styles: { fontStyle: 'bold' } }, 'Sin ejercicios', '']);
    } else {
      b.ejercicios.forEach((ej, i) => {
        cuerpo.push(
          i === 0
            ? [{ content: b.nombre, rowSpan: b.ejercicios.length, styles: { fontStyle: 'bold', valign: 'middle', fillColor: [243, 244, 238] } }, ej.tipo, `${ej.series} x ${ej.repeticiones}`]
            : [ej.tipo, `${ej.series} x ${ej.repeticiones}`]
        );
      });
    }
  });

  if (cuerpo.length > 0) {
    autoTable(doc, {
      startY: y + 2,
      head: [['Día / Bloque', 'Ejercicio', 'Series x Rep.']],
      body: cuerpo,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [92, 110, 1] }
    });
  }

  const base = `${socio.nombre}_${socio.apellidos || ''}_${rutina.nombre_rutina || 'rutina'}`.trim();
  doc.save(`${base.replace(/[^a-z0-9_-]+/gi, '_')}.pdf`);
}
