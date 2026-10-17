/**
 * Motor Inteligente de Reconocimiento y Extracción Automática de Documentos Chilenos (OCR)
 * Soporta Certificado de Inscripción de Vehículos Motorizados (CIVM / Padrón), Revisión Técnica (PRT), SOAP y Permiso de Circulación.
 */

// Lista de aseguradoras chilenas reconocidas
const ASEGURADORAS_CHILE = [
  'BCI Seguros', 'Consorcio', 'Mapfre', 'HDI Seguros', 'Seguros Falabella',
  'Zurich Santander', 'Sura', 'Reale Seguros', 'Liberty Seguros', 
  'BancoEstado', 'Chilena Consolidada', 'Renta Nacional', 'Mutual de Seguridad'
];

// Lista de municipalidades chilenas comunes
const MUNICIPALIDADES_CHILE = [
  'Providencia', 'Las Condes', 'Santiago', 'Ñuñoa', 'Maipú', 'La Florida',
  'Vitacura', 'Lo Barnechea', 'San Miguel', 'La Reina', 'Peñalolén', 'Pudahuel',
  'Quilicura', 'Renca', 'Recoleta', 'Independencia', 'Estación Central',
  'Viña del Mar', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta',
  'Temuco', 'Rancagua', 'Talca', 'Puerto Montt', 'Iquique', 'Arica', 'Chillán'
];

/**
 * Normaliza y limpia una fecha a formato YYYY-MM-DD
 */
function normalizarFecha(fechaRaw) {
  if (!fechaRaw) return null;
  const clean = fechaRaw.replace(/[^0-9/-]/g, '');
  const partsSlash = clean.split('/');
  const partsDash = clean.split('-');
  const parts = partsSlash.length === 3 ? partsSlash : (partsDash.length === 3 ? partsDash : null);

  if (!parts) return null;

  // DD/MM/YYYY o DD-MM-YYYY
  if (parts[0].length <= 2 && parts[2].length === 4) {
    const dia = parts[0].padStart(2, '0');
    const mes = parts[1].padStart(2, '0');
    const anio = parts[2];
    return `${anio}-${mes}-${dia}`;
  }
  // YYYY/MM/DD o YYYY-MM-DD
  if (parts[0].length === 4 && parts[2].length <= 2) {
    const anio = parts[0];
    const mes = parts[1].padStart(2, '0');
    const dia = parts[2].padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  return null;
}

/**
 * Extrae texto si la imagen es SVG Base64
 */
function extraerTextoDeSvg(dataUrl) {
  try {
    if (!dataUrl.startsWith('data:image/svg+xml;base64,')) return null;
    const b64 = dataUrl.replace('data:image/svg+xml;base64,', '');
    const decoded = atob(b64);
    // Extraer texto plano eliminando etiquetas xml
    return decoded.replace(/<[^>]+>/g, ' ');
  } catch (e) {
    return null;
  }
}

/**
 * Ejecuta OCR con Tesseract.js para imágenes JPG/PNG/WEBP
 */
async function ejecutarOcrImagen(imageSrc) {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('spa');
    const ret = await worker.recognize(imageSrc);
    await worker.terminate();
    return ret.data.text || '';
  } catch (e) {
    console.warn("Tesseract OCR fallback:", e);
    return '';
  }
}

/**
 * Parser de Certificado de Inscripción de Vehículos Motorizados (CIVM / Padrón del Registro Civil)
 */
export function parsearPadron(texto) {
  const t = texto.toUpperCase();
  const res = {};

  // Patente (ej: FWKR-41, FWKR 41, FWKR.41 o AB1234)
  const patenteMatch = t.match(/([A-Z]{2,4})[·\.\-\s]?([0-9]{2,4})/);
  if (patenteMatch) {
    res.patente = `${patenteMatch[1]}${patenteMatch[2]}`;
  }

  // Folio de Registro Civil (ej: RC-2018-984210 o FOLIO 123456)
  const folioMatch = t.match(/FOLIO[^\w]*([A-Z0-9\-]{5,20})/i) || t.match(/(RC[-A-Z0-9]{6,20})/);
  if (folioMatch) res.padronFolio = folioMatch[1].trim();

  // VIN / Chasis (17 caracteres alfanuméricos)
  const vinMatch = t.match(/(?:CHASIS|VIN)[^\w]*([A-HJ-NPR-Z0-9]{15,18})/i) || t.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
  if (vinMatch) res.padronVin = vinMatch[1].trim();

  // Motor
  const motorMatch = t.match(/MOTOR[^\w]*([A-Z0-9\-]{5,20})/i);
  if (motorMatch) res.padronMotor = motorMatch[1].trim();

  // Fecha Emisión
  const fechaMatch = t.match(/(?:EMISI[ÓO]N|FECHA)[^\w]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i);
  if (fechaMatch) {
    const norm = normalizarFecha(fechaMatch[1]);
    if (norm) res.padronFechaEmision = norm;
  }

  // Marca / Modelo / Año
  const anioMatch = t.match(/(?:AÑO|FABRICACI[ÓO]N)[^\w]*(19\d\d|20\d\d)/i);
  if (anioMatch) res.anio = parseInt(anioMatch[1]);

  return res;
}

/**
 * Parser de Certificado de Revisión Técnica (PRT)
 */
export function parsearRevisionTecnica(texto) {
  const t = texto.toUpperCase();
  const res = {};

  // Número / Folio de Certificado
  const numMatch = t.match(/(?:CERTIFICADO|FOLIO|DOC)[^\w]*N?[°º]?[^\w]*([0-9\-]{5,15})/i) || t.match(/(PRT[-A-Z0-9]{5,20})/);
  if (numMatch) res.revisionTecnicaNumero = numMatch[1].trim();

  // Vencimiento
  const vencMatch = t.match(/(?:VENCE|VENCIMIENTO|HASTA|PR[ÓO]XIMO)[^\w]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}|\d{4}[-/\.]\d{1,2}[-/\.]\d{1,2})/i) ||
                    t.match(/(\d{4}-\d{2}-\d{2})/);
  if (vencMatch) {
    const norm = normalizarFecha(vencMatch[1]);
    if (norm) res.revisionTecnicaVencimiento = norm;
  }

  return res;
}

/**
 * Parser de Seguro Obligatorio (SOAP)
 */
export function parsearSoap(texto) {
  const t = texto.toUpperCase();
  const res = {};

  // Aseguradora
  for (const cia of ASEGURADORAS_CHILE) {
    if (t.includes(cia.toUpperCase())) {
      res.soapAseguradora = cia;
      break;
    }
  }

  // Póliza
  const polMatch = t.match(/(?:P[ÓO]LIZA)[^\w]*N?[°º]?[^\w]*([0-9A-Z\-]{5,20})/i) || t.match(/(POL[-A-Z0-9]{6,20})/);
  if (polMatch) res.soapPoliza = polMatch[1].trim();

  // Vencimiento SOAP (En Chile vence el 31 de marzo)
  const vencMatch = t.match(/(?:VENCE|HASTA|VIGENCIA)[^\w]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i) ||
                    t.match(/(31[-/\.]03[-/\.]20\d\d)/);
  if (vencMatch) {
    const norm = normalizarFecha(vencMatch[1]);
    if (norm) res.soapVencimiento = norm;
  }

  return res;
}

/**
 * Parser de Permiso de Circulación
 */
export function parsearPermisoCirculacion(texto) {
  const t = texto.toUpperCase();
  const res = {};

  // Municipalidad
  for (const muni of MUNICIPALIDADES_CHILE) {
    if (t.includes(muni.toUpperCase())) {
      res.permisoCirculacionMunicipalidad = `I. Municipalidad de ${muni}`;
      break;
    }
  }

  // Folio
  const folioMatch = t.match(/(?:FOLIO|PERMISO)[^\w]*N?[°º]?[^\w]*([0-9A-Z\-]{4,15})/i) || t.match(/(PC[-A-Z0-9]{5,20})/);
  if (folioMatch) res.permisoCirculacionFolio = folioMatch[1].trim();

  // Vencimiento Permiso (normalmente 31 de marzo en Chile)
  const vencMatch = t.match(/(?:VENCE|VENCIMIENTO|PAGO)[^\w]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i) ||
                    t.match(/(31[-/\.]03[-/\.]20\d\d)/);
  if (vencMatch) {
    const norm = normalizarFecha(vencMatch[1]);
    if (norm) res.permisoCirculacionVencimiento = norm;
  }

  return res;
}

/**
 * Función principal para procesar cualquier documento vehicular chileno
 * @param {string} tipoDoc - 'PADRON' | 'PRT' | 'SOAP' | 'PERMISO'
 * @param {string} fileDataUrl - Imagen en base64 (SVG, PNG, JPG, etc.)
 * @returns {Promise<Object>} Datos extraídos automáticamente
 */
export async function autoEscanearDocumento(tipoDoc, fileDataUrl) {
  if (!fileDataUrl) return {};

  // 1. Intentar extracción directa si es SVG
  let texto = extraerTextoDeSvg(fileDataUrl);

  // 2. Si no es SVG o no arrojó texto, ejecutar OCR con Tesseract.js
  if (!texto || texto.trim().length < 15) {
    texto = await ejecutarOcrImagen(fileDataUrl);
  }

  if (!texto || texto.trim().length === 0) {
    return {};
  }

  switch (tipoDoc) {
    case 'PADRON':
      return parsearPadron(texto);
    case 'PRT':
      return parsearRevisionTecnica(texto);
    case 'SOAP':
      return parsearSoap(texto);
    case 'PERMISO':
      return parsearPermisoCirculacion(texto);
    default:
      return {};
  }
}
