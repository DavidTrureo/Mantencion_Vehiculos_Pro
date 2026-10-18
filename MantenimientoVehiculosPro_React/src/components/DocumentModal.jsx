import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Building, 
  CheckCircle2, 
  UploadCloud,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Share2
} from 'lucide-react';
import { cleanDocVal } from './DocumentosVehiculoSection';

const DocumentModal = ({ documento, onClose, onUploadImage }) => {
  if (!documento) return null;

  const [isExpanded, setIsExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Escuchar tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isExpanded) {
          setIsExpanded(false);
          setZoom(1);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded, onClose]);

  // Mostrar mensaje temporal (Toast interno)
  const showFeedback = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Descarga y compartir ultra-robusto (compatible con Android Capacitor, Chrome Mobile y Web)
  const handleDownload = async () => {
    if (!documento.imagen) return;
    setDownloading(true);

    const isPdf = typeof documento.imagen === 'string' && documento.imagen.includes('application/pdf');
    const ext = isPdf ? 'pdf' : 'png';
    const nombreArchivo = `${documento.tipo || 'Documento'}_${documento.patente || 'Vehiculo'}.${ext}`;

    try {
      // 1. Convertir Base64 / Data URL a Blob nativo
      let blob;
      if (documento.imagen.startsWith('data:')) {
        const parts = documento.imagen.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : (isPdf ? 'application/pdf' : 'image/png');
        const b64Data = parts[1] || parts[0];
        const byteCharacters = atob(b64Data.replace(/\s+/g, ''));
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: mimeType });
      } else {
        const response = await fetch(documento.imagen);
        blob = await response.blob();
      }

      // 2. Si está en dispositivo móvil (Android WebView / Capacitor), invocar Web Share API nativo
      if (navigator.canShare) {
        try {
          const file = new File([blob], nombreArchivo, { type: blob.type });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: nombreArchivo,
              text: `Copia oficial de ${documento.titulo || 'documento'} - Patente ${documento.patente || ''}`
            });
            showFeedback('Documento compartido / descargado correctamente.');
            setDownloading(false);
            return;
          }
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') {
            setDownloading(false);
            return; // El usuario cerró el diálogo de compartir
          }
          console.warn("navigator.share falló, intentando descarga con enlace directo:", shareErr);
        }
      }

      // 3. Descarga vía Blob URL para navegador Web / Desktop
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = nombreArchivo;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        setDownloading(false);
        showFeedback('Descarga iniciada exitosamente.');
      }, 800);
    } catch (err) {
      console.error("Error al procesar descarga de documento:", err);
      // Fallback final con dataUrl directa
      try {
        const link = document.createElement('a');
        link.href = documento.imagen;
        link.download = nombreArchivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showFeedback('Descarga iniciada.');
      } catch (e) {
        console.error("Error en fallback de descarga:", e);
        showFeedback('No se pudo descargar automáticamente.');
      }
      setDownloading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !onUploadImage) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result;
      if (isPdf) {
        try {
          const { extraerTextoYRenderDePdf } = await import('../services/documentParser');
          const pdfRes = await extraerTextoYRenderDePdf(dataUrl);
          if (pdfRes.renderedImage) {
            onUploadImage(pdfRes.renderedImage);
            return;
          }
        } catch (err) {
          console.warn("Error renderizando PDF en modal:", err);
        }
      }
      onUploadImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const getStatusBadge = () => {
    switch (documento.estado) {
      case 'vigente':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={13} />
            <span>Al Día / Vigente</span>
          </span>
        );
      case 'por_vencer':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <AlertTriangle size={13} />
            <span>Vence Pronto ({documento.diasRestantes} días)</span>
          </span>
        );
      case 'vencido':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <AlertTriangle size={13} />
            <span>Vencido (Infracción)</span>
          </span>
        );
      default:
        return (
          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
            No Registrado
          </span>
        );
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
        <div 
          className="modal-content" 
          onClick={(e) => e.stopPropagation()} 
          style={{ 
            maxWidth: '720px', 
            width: '94%',
            maxHeight: '92vh',
            display: 'flex', 
            flexDirection: 'column', 
            padding: '1.5rem',
            backgroundColor: '#0c121e',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            position: 'relative'
          }}
        >
          {/* Toast de Feedback */}
          {toastMsg && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #0284c7',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              zIndex: 1200
            }}>
              {toastMsg}
            </div>
          )}

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                padding: '0.65rem', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: documento.estado === 'vencido' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: documento.estado === 'vencido' ? 'var(--color-danger)' : 'var(--primary)'
              }}>
                <FileText size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    {documento.titulo}
                  </h3>
                  {getStatusBadge()}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Vehículo Patente: <strong style={{ color: 'var(--primary)' }}>{documento.patente || 'S/P'}</strong>
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              aria-label="Cerrar modal"
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: 'none', 
                color: 'var(--text-muted)', 
                cursor: 'pointer',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Metadata Grid */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '0.75rem', 
              marginBottom: '1.25rem',
              padding: '0.85rem 1rem',
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                Fecha de Vencimiento
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem', fontWeight: 600, color: documento.estado === 'vencido' ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                <Calendar size={14} />
                <span>
                  {(() => {
                    const cleaned = cleanDocVal(documento.fechaVencimiento);
                    if (!cleaned || cleaned.toLowerCase().includes('inválida') || cleaned.toLowerCase().includes('invalida')) {
                      return 'No registrada / Pendiente';
                    }
                    return cleaned;
                  })()}
                </span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                {documento.numeroLabel || 'N° Documento / Folio'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <ShieldCheck size={14} color="var(--primary)" />
                <span>{cleanDocVal(documento.numero) || 'Sin especificar'}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                {documento.emisorLabel || 'Entidad Emisora'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <Building size={14} color="var(--text-muted)" />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {cleanDocVal(documento.emisor) || 'Sin especificar'}
                </span>
              </div>
            </div>

            {documento.detallesExtra && documento.detallesExtra.filter(d => cleanDocVal(d.valor)).map((det, i) => (
              <div key={i}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
                  {det.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  <span>{cleanDocVal(det.valor)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Image Preview Area con Tap/Click para Ampliar */}
          <div 
            style={{ 
              flex: 1, 
              minHeight: '270px',
              maxHeight: '50vh',
              backgroundColor: '#05070c', 
              border: '1px dashed var(--border-color)', 
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '0.5rem'
            }}
          >
            {documento.imagen ? (
              <div 
                onClick={() => {
                  setZoom(1.25);
                  setIsExpanded(true);
                }}
                title="Presiona para ampliar a pantalla completa con zoom"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  cursor: 'zoom-in',
                  position: 'relative'
                }}
              >
                <img 
                  src={documento.imagen} 
                  alt={`Copia oficial de ${documento.titulo}`} 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '46vh', 
                    objectFit: 'contain', 
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                    transition: 'transform 0.2s ease'
                  }}
                />

                {/* Botón flotante para ampliar */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoom(1.25);
                    setIsExpanded(true);
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(15, 23, 42, 0.88)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                  }}
                >
                  <Maximize2 size={13} />
                  <span>Ampliar Documento</span>
                </button>

                {/* Badge inferior para educar al usuario */}
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '0.72rem',
                  padding: '4px 12px',
                  borderRadius: '15px',
                  pointerEvents: 'none',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <Maximize2 size={12} color="var(--primary)" />
                  <span>Toca el documento para ampliar en pantalla completa</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 0.75rem' }} />
                <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                  No hay copia oficial digital o escaneada de este documento.
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: onUploadImage ? '1.25rem' : '0' }}>
                  {onUploadImage
                    ? 'Puedes adjuntar una foto legible o comprobante digital para que esté disponible en terreno y controles.'
                    : 'Documento en modo solo lectura para fiscalización. Para actualizar la copia oficial, contacta al Administrador de Flota.'}
                </p>

                {onUploadImage && (
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UploadCloud size={16} />
                    <span>Subir Documento (PDF o Foto)</span>
                    <input type="file" accept="image/*,application/pdf,.pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <div>
              {documento.imagen && onUploadImage && (
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <UploadCloud size={14} />
                  <span>Reemplazar Documento</span>
                  <input type="file" accept="image/*,application/pdf,.pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {documento.imagen && (
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={handleDownload}
                  disabled={downloading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Download size={15} />
                  <span>{downloading ? 'Descargando...' : 'Descargar'}</span>
                </button>
              )}

              <button 
                type="button" 
                className="btn btn-primary btn-sm" 
                onClick={onClose}
                style={{ minWidth: '90px' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL FULLSCREEN LIGHTBOX (AMPLIACIÓN TOTAL CON ZOOM INTERACTIVO) */}
      {isExpanded && documento.imagen && (
        <div 
          onClick={() => {
            setIsExpanded(false);
            setZoom(1);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            backgroundColor: 'rgba(2, 6, 23, 0.96)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Barra Superior de Control de Zoom */}
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1.25rem',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff'
            }}
          >
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                {documento.titulo}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Patente: <strong style={{ color: 'var(--primary)' }}>{documento.patente || 'S/P'}</strong> • Fiscalización y Controles
              </div>
            </div>

            {/* Controles de Zoom y Descarga */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                backgroundColor: 'rgba(255,255,255,0.08)', 
                borderRadius: '8px', 
                padding: '2px', 
                border: '1px solid rgba(255,255,255,0.15)' 
              }}>
                <button
                  type="button"
                  title="Alejar"
                  onClick={() => setZoom(z => Math.max(z - 0.25, 0.75))}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center' }}
                >
                  <ZoomOut size={16} />
                </button>

                <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '46px', textAlign: 'center', fontFamily: 'monospace' }}>
                  {Math.round(zoom * 100)}%
                </span>

                <button
                  type="button"
                  title="Acercar"
                  onClick={() => setZoom(z => Math.min(z + 0.25, 3.5))}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center' }}
                >
                  <ZoomIn size={16} />
                </button>

                <button
                  type="button"
                  title="Restablecer tamaño original"
                  onClick={() => setZoom(1)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
              >
                <Download size={14} />
                <span className="hide-mobile">Descargar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setZoom(1);
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#f87171',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  marginLeft: '0.5rem'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Área de Visualización Ampliada con Desplazamiento Táctil */}
          <div 
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              alignItems: zoom > 1 ? 'flex-start' : 'center',
              justifyContent: zoom > 1 ? 'flex-start' : 'center',
              padding: '1.5rem',
              cursor: zoom > 1 ? 'grab' : 'zoom-in',
              WebkitOverflowScrolling: 'touch'
            }}
            onClick={(e) => {
              // Click en el contenedor fuera de la imagen cierra el visor
              if (e.target === e.currentTarget) {
                setIsExpanded(false);
                setZoom(1);
              }
            }}
          >
            <div style={{ margin: 'auto', display: 'inline-block', position: 'relative' }}>
              <img 
                src={documento.imagen} 
                alt={`Ampliación de ${documento.titulo}`} 
                onClick={(e) => {
                  e.stopPropagation();
                  // Doble toque o click alterna entre 1x y 2x
                  setZoom(z => z > 1.2 ? 1 : 2);
                }}
                style={{
                  width: `${Math.round(100 * zoom)}%`,
                  maxWidth: zoom > 1 ? 'none' : '90vw',
                  maxHeight: zoom > 1 ? 'none' : '84vh',
                  objectFit: 'contain',
                  borderRadius: '6px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out'
                }}
              />
            </div>
          </div>

          {/* Barra inferior informativa */}
          <div style={{
            padding: '0.6rem 1rem',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#94a3b8',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <span>💡 <strong>Tip:</strong> Puedes arrastrar con el dedo o mouse para mover el documento ampliado.</span>
            <span>•</span>
            <span>Toca dos veces la imagen para alternar zoom rápido (1x / 2x).</span>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentModal;
