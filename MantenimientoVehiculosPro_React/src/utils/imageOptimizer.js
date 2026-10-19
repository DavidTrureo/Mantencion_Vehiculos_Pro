/**
 * Utilidad Profesional de Optimización y Almacenamiento en la Nube (Cloud Storage)
 * Regla de Oro Cloud:
 * 1. Compresión client-side a WebP (ahorro del 70-85% sin pérdida visual de calidad para lectura de patentes/folias).
 * 2. Carga en Object Storage (Firebase Cloud Storage CDN).
 * 3. Almacenamiento exclusivo de URLs públicas en la base de datos PostgreSQL (Neon).
 */

import { api } from '../services/api';

/**
 * Verifica si una cadena ya es una URL pública en la nube
 */
export const isCloudUrl = (val) => {
  if (!val || typeof val !== 'string') return false;
  const str = val.trim().toLowerCase();
  return str.startsWith('http://') || str.startsWith('https://');
};

/**
 * Convierte un Data URL Base64 a un objeto Blob binario nativo
 */
export const dataUrlToBlob = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  if (!dataUrl.startsWith('data:')) return null;

  try {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error('Error al convertir DataURL a Blob:', err);
    return null;
  }
};

/**
 * Comprime y convierte una imagen a formato WebP optimizado con resolución controlada.
 * Si el archivo es un PDF, respeta el formato binario PDF original.
 *
 * @param {File|Blob|string} fileOrDataUrl - Archivo original, Blob o cadena Base64
 * @param {Object} options - Parámetros de optimización
 * @param {number} options.maxWidth - Ancho máximo (default: 1920px)
 * @param {number} options.maxHeight - Alto máximo (default: 1920px)
 * @param {number} options.quality - Calidad WebP entre 0.0 y 1.0 (default: 0.82)
 * @returns {Promise<{ blob: Blob, isPdf: boolean, format: string, originalSize: number, compressedSize: number }>}
 */
export const comprimirAWebP = async (fileOrDataUrl, options = {}) => {
  const { maxWidth = 1920, maxHeight = 1920, quality = 0.82 } = options;

  let inputBlob = null;
  let isPdf = false;

  if (typeof fileOrDataUrl === 'string') {
    if (fileOrDataUrl.includes('application/pdf')) {
      isPdf = true;
    }
    inputBlob = dataUrlToBlob(fileOrDataUrl);
  } else if (fileOrDataUrl instanceof Blob) {
    inputBlob = fileOrDataUrl;
    if (inputBlob.type === 'application/pdf') {
      isPdf = true;
    }
  }

  if (!inputBlob) {
    throw new Error('Formato de entrada no válido para optimización.');
  }

  // Si es PDF, lo mantenemos como PDF binario sin alterar
  if (isPdf) {
    return {
      blob: inputBlob,
      isPdf: true,
      format: 'pdf',
      originalSize: inputBlob.size,
      compressedSize: inputBlob.size
    };
  }

  // Si es imagen, redimensionar y codificar en WebP
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(inputBlob);
    const img = new Image();

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // Escalar manteniendo proporción
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a WebP
        canvas.toBlob(
          (webpBlob) => {
            URL.revokeObjectURL(objectUrl);
            if (!webpBlob) {
              // Fallback a JPEG si WebP falla
              canvas.toBlob(
                (jpegBlob) => {
                  resolve({
                    blob: jpegBlob || inputBlob,
                    isPdf: false,
                    format: 'jpeg',
                    originalSize: inputBlob.size,
                    compressedSize: jpegBlob ? jpegBlob.size : inputBlob.size
                  });
                },
                'image/jpeg',
                quality
              );
              return;
            }

            resolve({
              blob: webpBlob,
              isPdf: false,
              format: 'webp',
              originalSize: inputBlob.size,
              compressedSize: webpBlob.size
            });
          },
          'image/webp',
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo decodificar la imagen para compresión: ' + err));
    };

    img.src = objectUrl;
  });
};

/**
 * Optimiza el archivo (WebP / PDF) y lo sube directamente a Firebase Storage CDN
 * Retorna la URL pública final lista para guardar en la base de datos.
 *
 * @param {File|Blob|string} fileOrDataUrl
 * @param {Object} metadata
 * @param {string} metadata.tipo - Tipo de documento ('padron', 'prt', 'soap', 'permiso', 'incidente', 'factura')
 * @param {string} metadata.patente - Patente del vehículo
 * @returns {Promise<{ url: string, format: string, size: number }>}
 */
export const subirACloudStorage = async (fileOrDataUrl, { tipo = 'doc', patente = '' } = {}) => {
  if (!fileOrDataUrl) return { url: null };

  // Si ya es una URL en la nube, no es necesario volver a subirla
  if (isCloudUrl(fileOrDataUrl)) {
    return { url: fileOrDataUrl, format: 'url', size: 0 };
  }

  // 1. Optimizar imagen client-side a WebP (o mantener PDF binario)
  const optResult = await comprimirAWebP(fileOrDataUrl);
  const ext = optResult.isPdf ? 'pdf' : 'webp';
  const cleanPatente = (patente || 'vehiculo').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanTipo = (tipo || 'doc').toLowerCase().replace(/[^a-z0-9]/g, '');
  const filename = `${cleanTipo}_${cleanPatente}_${Date.now()}.${ext}`;

  // 2. Subir binario optimizado a Firebase Storage vía backend
  const uploadRes = await api.subirArchivo(optResult.blob, filename);

  if (!uploadRes || !uploadRes.url) {
    throw new Error('El servidor no retornó una URL válida para el archivo subido.');
  }

  return {
    url: uploadRes.url,
    format: optResult.format,
    size: optResult.compressedSize
  };
};
