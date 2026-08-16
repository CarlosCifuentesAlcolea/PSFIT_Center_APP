import ExcelJS from 'exceljs';

const CAMPOS = [
  ['Edad', 'edad'],
  ['Peso', 'peso'],
  ['Altura', 'altura'],
  ['Fecha de inicio', 'fecha_inicio'],
  ['Fecha de finalización', 'fecha_fin'],
  ['Patologías', 'patologias'],
  ['Días de entrenamiento', 'dias_entrenamiento'],
  ['Objetivo', 'objetivo']
];

export async function generarExcelRutina(socio, rutina) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PS FIT Center';
  workbook.created = new Date();
  const hoja = workbook.addWorksheet('Rutina');

  hoja.getColumn(1).width = 22;
  hoja.getColumn(2).width = 50;
  hoja.getColumn(3).width = 20;

  try {
    const logoBuffer = await fetch('/logo.png').then((r) => r.arrayBuffer());
    const imageId = workbook.addImage({ buffer: logoBuffer, extension: 'png' });
    hoja.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 70, height: 70 } });
  } catch {
    // si no se puede cargar el logo, se genera el excel igualmente sin el
  }

  hoja.mergeCells('B1:C1');
  hoja.getCell('B1').value = 'PS FIT Center';
  hoja.getCell('B1').font = { size: 16, bold: true, color: { argb: 'FF5C6E01' } };

  hoja.mergeCells('B2:C2');
  hoja.getCell('B2').value = rutina.nombre_rutina || 'Rutina de entrenamiento';
  hoja.getCell('B2').font = { size: 11, color: { argb: 'FF666666' } };

  const filas = [
    ['Nombre', socio.nombre],
    ['Apellidos', socio.apellidos || ''],
    ...CAMPOS.map(([etiqueta, campo]) => [etiqueta, rutina[campo] || ''])
  ];

  let fila = 5;
  for (const [etiqueta, valor] of filas) {
    const celdaEtiqueta = hoja.getCell(fila, 1);
    celdaEtiqueta.value = etiqueta;
    celdaEtiqueta.font = { bold: true };
    celdaEtiqueta.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4EE' } };
    hoja.getCell(fila, 2).value = valor;
    fila++;
  }

  fila += 1;
  const celdaTitulo = hoja.getCell(fila, 1);
  celdaTitulo.value = 'Contenido de la rutina';
  celdaTitulo.font = { bold: true, size: 12 };
  fila++;

  const lineas = (rutina.contenido || '').split('\n');
  for (const linea of lineas) {
    hoja.mergeCells(`A${fila}:C${fila}`);
    const celda = hoja.getCell(fila, 1);
    celda.value = linea;
    celda.alignment = { wrapText: true };
    fila++;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  const base = `${rutina.nombre_rutina || 'rutina'}_${socio.nombre}_${socio.apellidos || ''}`.trim();
  enlace.download = `${base.replace(/[^a-z0-9]+/gi, '_')}.xlsx`;
  enlace.click();
  URL.revokeObjectURL(url);
}
