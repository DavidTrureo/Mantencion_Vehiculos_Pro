import React from 'react';
import { 
  X, 
  Download, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Building, 
  CheckCircle2, 
  UploadCloud 
} from 'lucide-react';
import { cleanDocVal } from './DocumentosVehiculoSection';

const DocumentModal = ({ documento, onClose, onUploadImage }) => {
  if (!documento) return null;

  const handleDownload = () => {
    if (!documento.imagen) return;
    const isPdf = typeof documento.imagen === 'string' && documento.imagen.includes('application/pdf');
    const ext = isPdf ? 'pdf' : 'png';
    const link = document.createElement('a');
    link.href = documento.imagen;
    link.download = `${documento.tipo || 'Documento'}_${documento.patente || 'Vehiculo'}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '680px', 
          width: '94%',
          maxHeight: '92vh',
          display: 'flex', 
          flexDirection: 'column', 
          padding: '1.5rem',
          backgroundColor: '#0c121e',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
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

        {/* Image Preview Area */}
        <div 
          style={{ 
            flex: 1, 
            minHeight: '260px',
            maxHeight: '52vh',
            backgroundColor: '#05070c', 
            border: '1px dashed var(--border-color)', 
            borderRadius: 'var(--radius-md)',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            padding: '0.75rem'
          }}
        >
          {documento.imagen ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img 
                src={documento.imagen} 
                alt={`Copia oficial de ${documento.titulo}`} 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '48vh', 
                  objectFit: 'contain', 
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
                }}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 0.75rem' }} />
              <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
                No hay fotografía ni copia escaneada de este documento.
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
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Download size={15} />
                <span>Descargar</span>
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
  );
};

export default DocumentModal;
