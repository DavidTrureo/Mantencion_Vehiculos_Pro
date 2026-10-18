/**
 * Motor Inteligente de Reconocimiento y Extracción Automática de Documentos Chilenos (OCR y PDF)
 * Soporta Certificado de Inscripción de Vehículos Motorizados (CIVM / Padrón), Revisión Técnica (PRT), SOAP y Permiso de Circulación.
 * Admite imágenes (JPG, PNG, WEBP, SVG) y documentos PDF nativos o escaneados.
 */

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

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

// Meses en español para normalizar fechas textuales
const MESES_ES = {
  'ENERO': '01', 'FEBRERO': '02', 'MARZO': '03', 'ABRIL': '04',
  'MAYO': '05', 'JUNIO': '06', 'JULIO': '07', 'AGOSTO': '08',
  'SEPTIEMBRE': '09', 'SETIEMBRE': '09', 'OCTUBRE': '10', 'NOVIEMBRE': '11', 'DICIEMBRE': '12'
};

/**
 * Normaliza y limpia una fecha a formato YYYY-MM-DD
 * Soporta DD/MM/YYYY, YYYY-MM-DD y fechas textuales como "15 de Octubre de 2025"
 */
function normalizarFecha(fechaRaw) {
  if (!fechaRaw) return null;
  const clean = fechaRaw.trim().toUpperCase();

  // Fecha textual en español: ej. "15 DE OCTUBRE DE 2025" o "31 DE MARZO 2026"
  const textMatch = clean.match(/(\d{1,2})\s+DE\s+([A-Z]+)\s+(?:DEL?\s+)?(20\d\d)/i);
  if (textMatch) {
    const dia = textMatch[1].padStart(2, '0');
    const mes = MESES_ES[textMatch[2]];
    const anio = textMatch[3];
    if (mes) return `${anio}-${mes}-${dia}`;
  }

  const parts = clean.replace(/\s+/g, '').split(/[-\/\.]/);
  if (parts.length !== 3) return null;

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
    let s = dataUrl.trim();
    if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
    if (!s.includes('data:image/svg+xml;base64,')) return null;
    const b64 = s.replace(/^.*data:image\/svg\+xml;base64,/, '');
    const decoded = atob(b64);
    return decoded.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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
 * Procesa documentos PDF con PDF.js:
 * 1. Extrae el texto digital embebido de las primeras 3 páginas.
 * 2. Renderiza la primera página a Canvas para generar una vista previa/copia en imagen (dataURL).
 * 3. Si el PDF es escaneado (sin texto digital o texto < 25 caracteres), ejecuta OCR Tesseract sobre la imagen renderizada.
 * @param {string} dataUrl - PDF en formato data:application/pdf;base64,... o base64
 * @returns {Promise<{ texto: string, renderedImage: string|null }>}
 */
export async function extraerTextoYRenderDePdf(dataUrl) {
  try {
    const pdfjsLib = await import('pdfjs-dist');

    // Configurar worker de PDF.js localmente para soporte offline en web y Capacitor
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker || `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }

    // Extraer cadena base64 limpia y convertir a Uint8Array
    let b64 = dataUrl;
    if (b64.includes(',')) {
      b64 = b64.split(',')[1];
    }
    const cleanB64 = b64.replace(/\s+/g, '');
    const binaryStr = atob(cleanB64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    const pdfDoc = await loadingTask.promise;
    const numPages = Math.min(pdfDoc.numPages, 3);

    let fullText = '';
    let renderedImage = null;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);

      // Renderizar página 1 a Canvas de alta fidelidad para vista previa / tarjeta / modal
      if (pageNum === 1 && typeof document !== 'undefined') {
        try {
          const viewport = page.getViewport({ scale: 1.8 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          await page.render({
            canvasContext: ctx,
            viewport: viewport
          }).promise;

          renderedImage = canvas.toDataURL('image/jpeg', 0.88);
        } catch (canvasErr) {
          console.warn("Error renderizando página 1 del PDF a canvas:", canvasErr);
        }
      }

      // Extraer capa de texto digital
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => item.str)
        .filter(Boolean)
        .join(' ');

      fullText += ` ${pageText}`;
    }

    fullText = fullText.replace(/\s+/g, ' ').trim();

    // Si el PDF es una fotocopia escaneada sin capa de texto digital nativa, ejecutar OCR con Tesseract sobre la imagen renderizada
    if ((!fullText || fullText.length < 25) && renderedImage) {
      console.log("PDF sin capa de texto digital. Ejecutando OCR en imagen renderizada...");
      const ocrText = await ejecutarOcrImagen(renderedImage);
      if (ocrText && ocrText.trim().length > 0) {
        fullText = ocrText;
      }
    }

    return {
      texto: fullText,
      renderedImage
    };
  } catch (err) {
    console.error("Error procesando PDF con pdfjs-dist:", err);
    return {
      texto: '',
      renderedImage: null
    };
  }
}

/**
 * Parser de Certificado de Inscripción de Vehículos Motorizados (CIVM / Padrón del Registro Civil)
 */
export function parsearPadron(texto) {
  const t = texto.toUpperCase();
  const res = {};

  // Patente chilena (ej: FWKR-41, FWKR · 41, BB-1234, o Inscripción: FWKR.41-6)
  const patenteMatch = t.match(/(?:PLACA|PATENTE|PLACA ÚNICA|INSCRIPCI[ÓO]N)[^\w]*([A-Z]{2,4})[·\.\-\s]+([0-9]{2,4})/i) ||
                       t.match(/\b([B-DF-HJ-NP-TV-Z]{4})[·\.\-\s]?([0-9]{2})\b/) ||
                       t.match(/\b([A-Z]{2})[·\.\-\s]?([0-9]{4})\b/);
  if (patenteMatch) {
    res.patente = `${patenteMatch[1]}${patenteMatch[2]}`.replace(/[^A-Z0-9]/g, '');
  }

  // Folio de Registro Civil (ej: RC-2018-984210, Folio: 543210987)
  const folioMatch = t.match(/(?:FOLIO|DOCUMENTO|CERTIFICADO)[^\w:]*:[^\w]*([A-Z0-9\-]{4,25})/i) ||
                     t.match(/\b(RC[-A-Z0-9]{6,20})\b/) ||
                     t.match(/FOLIO[^\w]*([0-9\-]{5,15})/i);
  if (folioMatch) res.padronFolio = folioMatch[1].trim();

  // VIN / Chasis (17 caracteres)
  const vinMatch = t.match(/(?:CHASIS|VIN|N[°º]\s*CHASIS)[^\w:]*:[^\w]*([A-HJ-NPR-Z0-9]{15,18})/i) || 
                   t.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
  if (vinMatch) res.padronVin = vinMatch[1].trim();

  // Motor
  const motorMatch = t.match(/(?:MOTOR|N[°º]\s*MOTOR)[^\w:]*:[^\w]*([A-Z0-9\-]{5,20})/i);
  if (motorMatch) res.padronMotor = motorMatch[1].trim();

  // Fecha Emisión
  const fechaMatch = t.match(/(?:EMISI[ÓO]N|FECHA)[^\w:]*:[^\w]*(\d{1,2}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{2,4})/i) ||
                     t.match(/(\d{1,2}\s+DE\s+[A-Z]+\s+(?:DEL?\s+)?20\d\d)/i);
  if (fechaMatch) {
    res.padronFechaEmision = normalizarFecha(fechaMatch[1]);
  }

  // Año de Fabricación
  const anioMatch = t.match(/(?:AÑO|FABRICACI[ÓO]N|MODELO)[^\w:]*:[^\w]*(19\d\d|20\d\d)/i);
  if (anioMatch) res.anio = parseInt(anioMatch[1]);

  return res;
}

/**
 * Parser de Certificado de Revisión Técnica (PRT)
 */
export function parsearRevisionTecnica(texto) {
  const t = texto.toUpperCase();
  const res = {};

  // Número / Folio de Certificado (con o sin dos puntos, ej: CERTIFICADO N° 123456, PRT-8841)
  const numMatch = t.match(/(?:CERTIFICADO|FOLIO)\s*(?:N[°º]|NRO|NUMERO|\.)\s*:?\s*([A-Z0-9\-]{4,20})/i) ||
                   t.match(/(?:CERTIFICADO|FOLIO)[^\w:]*:[^\w]*([A-Z0-9\-]{4,20})/i) ||
                   t.match(/\b(PRT[-A-Z0-9]{4,20})\b/) ||
                   t.match(/N[°º]\s*([0-9\-]{5,15})/i);
  if (numMatch) res.revisionTecnicaNumero = numMatch[1].trim();

  // Vencimiento PRT:
  // Se prioriza la fecha de vencimiento/próximo control por sobre la fecha de inspección/otorgamiento
  const vencMatch = t.match(/(?:VENCIMIENTO|VENCE|HASTA|PR[ÓO]XIMO\s+CONTROL|PR[ÓO]XIMA\s+REVISI[ÓO]N)[^\d]*(\d{1,2}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{2,4}|\d{4}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{1,2})/i) ||
                    t.match(/(?:VÁLIDO|VALIDO)\s+HASTA[^\d]*(\d{1,2}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{2,4}|\d{4}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{1,2})/i) ||
                    t.match(/(\d{1,2}\s+DE\s+[A-Z]+\s+(?:DEL?\s+)?20\d\d)/i);
  if (vencMatch) {
    res.revisionTecnicaVencimiento = normalizarFecha(vencMatch[1]);
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

  // Póliza:
  // Soporta: POLIZA N° 7101728445, PÓLIZA N°: 7101728445, POLIZA: 7101728445, N° POLIZA 7101728445, POL-9988123
  const polMatch = t.match(/(?:POLIZA|P[ÓO]LIZA)\s*(?:N[°º]|NRO|NUMERO|\.)\s*:?\s*([0-9A-Z\-]{6,20})/i) ||
                   t.match(/(?:POLIZA|P[ÓO]LIZA)\s*:\s*([0-9A-Z\-]{6,20})/i) ||
                   t.match(/N[°º]\s*(?:DE\s*)?(?:POLIZA|P[ÓO]LIZA)\s*:?\s*([0-9A-Z\-]{6,20})/i) ||
                   t.match(/\b(POL[-A-Z0-9]{5,25})\b/) ||
                   t.match(/(?:P[ÓO]LIZA|POLIZA)[^\w:]*:[^\w]*([A-Z0-9\-]{5,25})/i);
  if (polMatch) {
    res.soapPoliza = polMatch[1].trim();
  }

  // Patente si aparece en el certificado (ej: INSCRIPCIÓN R.V.M. FWKR41-6)
  const patenteMatch = t.match(/(?:PLACA|PATENTE|PLACA ÚNICA|INSCRIPCI[ÓO]N(?:\s*R\.?V\.?M\.?)?)[^\w]*([A-Z]{2,4})[·\.\-\s]+([0-9]{2,4})/i) ||
                       t.match(/\b([B-DF-HJ-NP-TV-Z]{4})[·\.\-\s]?([0-9]{2})\b/);
  if (patenteMatch) {
    res.patente = `${patenteMatch[1]}${patenteMatch[2]}`.replace(/[^A-Z0-9]/g, '');
  }

  // Vencimiento SOAP:
  // En Chile los SOAP tienen Fecha de Otorgamiento / Inicio (ej: 01/04/YYYY) y Fecha de Vencimiento (31/03/YYYY).
  // La fecha que debe registrarse como vigencia oficial es la FECHA DE VENCIMIENTO (31 de marzo).

  // Caso 1: Estructura de tabla "RIGE DESDE HASTA \n 01/04/2026 31/03/2027"
  const tableMatch = t.match(/(?:RIGE\s*)?DESDE\s+HASTA[\s\n\r]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})[\s\n\r]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
  if (tableMatch) {
    res.soapVencimiento = normalizarFecha(tableMatch[2]);
  } else {
    // Caso 2: Formato en línea "DESDE 01/04/2026 HASTA 31/03/2027"
    const inlineMatch = t.match(/DESDE[^\d]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})[^\d]*HASTA[^\d]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
    if (inlineMatch) {
      res.soapVencimiento = normalizarFecha(inlineMatch[2]);
    } else {
      // Caso 3: Fecha 31 de marzo (vencimiento legal del SOAP en Chile)
      const marzoMatch = t.match(/(31\s*[-\/\.]\s*03\s*[-\/\.]\s*20\d\d)/);
      if (marzoMatch) {
        res.soapVencimiento = normalizarFecha(marzoMatch[1]);
      } else {
        // Caso 4: HASTA individual no precedido de DESDE
        const vencMatch = t.match(/(?:HASTA|T[ÉE]RMINO|VENCE|VENCIMIENTO)[^\d]*(\d{1,2}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{2,4})/i);
        if (vencMatch) {
          res.soapVencimiento = normalizarFecha(vencMatch[1]);
        }
      }
    }
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

  // Folio / Comprobante de pago (ej: FOLIO N° 12345, COMPROBANTE N° 88412)
  const folioMatch = t.match(/(?:FOLIO|COMPROBANTE|PERMISO)\s*(?:N[°º]|NRO|NUMERO|\.)\s*:?\s*([A-Z0-9\-]{4,25})/i) ||
                     t.match(/(?:FOLIO|COMPROBANTE|PERMISO)[^\w:]*:[^\w]*([A-Z0-9\-]{4,25})/i) ||
                     t.match(/\b(FOL[-A-Z0-9]{4,25})\b/) ||
                     t.match(/\b(PC[-A-Z0-9]{4,20})\b/);
  if (folioMatch) res.permisoCirculacionFolio = folioMatch[1].trim();

  // Vencimiento Permiso:
  // En Chile vence el 31 de marzo. Evitar capturar la fecha de pago como vencimiento.
  const marzoMatch = t.match(/(31\s*[-\/\.]\s*03\s*[-\/\.]\s*20\d\d)/);
  if (marzoMatch) {
    res.permisoCirculacionVencimiento = normalizarFecha(marzoMatch[1]);
  } else {
    const vencMatch = t.match(/(?:VENCE|VENCIMIENTO|VÁLIDO\s+HASTA|VALIDO\s+HASTA)[^\d]*(\d{1,2}\s*[-\/\.]\s*\d{1,2}\s*[-\/\.]\s*\d{2,4})/i);
    if (vencMatch) {
      res.permisoCirculacionVencimiento = normalizarFecha(vencMatch[1]);
    }
  }

  return res;
}

/**
 * Función principal para procesar cualquier documento vehicular chileno
 * Admite archivos PDF o imágenes (JPG, PNG, WEBP, SVG)
 * @param {string} tipoDoc - 'PADRON' | 'PRT' | 'SOAP' | 'PERMISO'
 * @param {string} fileDataUrl - Documento en base64 (PDF, SVG, PNG, JPG, etc.)
 * @returns {Promise<Object>} Datos extraídos automáticamente y `renderedImage` si fue PDF
 */
export async function autoEscanearDocumento(tipoDoc, fileDataUrl) {
  if (!fileDataUrl) return {};

  let texto = '';
  let renderedImage = null;

  const isPdf = typeof fileDataUrl === 'string' && (
    fileDataUrl.startsWith('data:application/pdf') || 
    fileDataUrl.includes('application/pdf')
  );

  if (isPdf) {
    const pdfRes = await extraerTextoYRenderDePdf(fileDataUrl);
    texto = pdfRes.texto;
    renderedImage = pdfRes.renderedImage;
  } else {
    // 1. Intentar extracción directa si es SVG
    texto = extraerTextoDeSvg(fileDataUrl);

    // 2. Si no es SVG o no arrojó texto, ejecutar OCR con Tesseract.js
    if (!texto || texto.trim().length < 15) {
      texto = await ejecutarOcrImagen(fileDataUrl);
    }
  }

  let res = {};
  if (texto && texto.trim().length > 0) {
    switch (tipoDoc) {
      case 'PADRON':
        res = parsearPadron(texto);
        break;
      case 'PRT':
        res = parsearRevisionTecnica(texto);
        break;
      case 'SOAP':
        res = parsearSoap(texto);
        break;
      case 'PERMISO':
        res = parsearPermisoCirculacion(texto);
        break;
      default:
        res = {};
    }
  }

  // Si procesamos un PDF y obtuvimos una imagen de alta resolución renderizada de su primera página,
  // la adjuntamos para que las vistas previas, tarjetas y modal la muestren de inmediato
  if (renderedImage) {
    res.renderedImage = renderedImage;
  }

  return res;
}
