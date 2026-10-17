import React from 'react';
import { 
  FileCheck, 
  ShieldCheck, 
  Calendar, 
  Building, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Car
} from 'lucide-react';

export const evaluarDocumento = (fechaVencimiento) => {
  if (!fechaVencimiento) {
    return {
      estado: 'sin_registrar',
      label: 'Sin Registrar',
      badgeClass: 'badge-secondary',
      dias: null,
      color: 'var(--text-muted)'
    };
  }

  // Parsear fecha YYYY-MM-DD
  const partes = fechaVencimiento.split('-');
  if (partes.length !== 3) {
    return {
      estado: 'sin_registrar',
      label: 'Fecha Inválida',
      badgeClass: 'badge-secondary',
      dias: null,
      color: 'var(--text-muted)'
    };
  }

  const vencimiento = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const diffTime = vencimiento.getTime() - hoy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      estado: 'vencido',
      label: `Vencido (${Math.abs(diffDays)}d)`,
      dias: diffDays,
      badgeClass: 'badge-danger',
      color: 'var(--color-danger)'
    };
  } else if (diffDays <= 30) {
    return {
      estado: 'por_vencer',
      label: `Vence en ${diffDays}d`,
      dias: diffDays,
      badgeClass: 'badge-warning',
      color: 'var(--color-warning)'
    };
  } else {
    return {
      estado: 'vigente',
      label: `Al día (${diffDays}d)`,
      dias: diffDays,
      badgeClass: 'badge-success',
      color: 'var(--color-success)'
    };
  }
};

const DocumentosVehiculoSection = ({ vehiculo, onOpenModal }) => {
  if (!vehiculo) return null;

  const padronStatus = (vehiculo.padronFolio || vehiculo.padronImagen || vehiculo.padronVin)
    ? { estado: 'vigente', label: 'Inscrito / Al Día', badgeClass: 'badge-success', color: 'var(--color-success)' }
    : { estado: 'sin_registrar', label: 'Sin Adjuntar', badgeClass: 'badge-secondary', color: 'var(--text-muted)' };

  const prtStatus = evaluarDocumento(vehiculo.revisionTecnicaVencimiento);
  const soapStatus = evaluarDocumento(vehiculo.soapVencimiento);
  const permisoStatus = evaluarDocumento(vehiculo.permisoCirculacionVencimiento);

  // Estado general de fiscalización
  const hasExpired = prtStatus.estado === 'vencido' || soapStatus.estado === 'vencido' || permisoStatus.estado === 'vencido';
  const hasPending = prtStatus.estado === 'sin_registrar' || soapStatus.estado === 'sin_registrar' || permisoStatus.estado === 'sin_registrar' || padronStatus.estado === 'sin_registrar';
  const allValid = prtStatus.estado === 'vigente' && soapStatus.estado === 'vigente' && permisoStatus.estado === 'vigente' && padronStatus.estado === 'vigente';

  const docs = [
    {
      tipo: 'PADRON',
      titulo: 'Certificado de Inscripción de Vehículos Motorizados (Padrón)',
      descripcion: 'Registro de Vehículos Motorizados (R.V.M.) - Servicio de Registro Civil e Identificación de Chile',
      fechaVencimiento: vehiculo.padronFechaEmision ? `Emitido: ${vehiculo.padronFechaEmision}` : 'Documento Permanente',
      numero: vehiculo.padronFolio || vehiculo.padronVin,
      numeroLabel: 'Folio / N° Chasis (VIN)',
      emisor: 'Servicio de Registro Civil e Identificación',
      emisorLabel: 'Entidad Emisora',
      imagen: vehiculo.padronImagen,
      patente: vehiculo.patente,
      estadoInfo: padronStatus,
      detallesExtra: [
        { label: 'N° Chasis / VIN', valor: vehiculo.padronVin },
        { label: 'N° Motor', valor: vehiculo.padronMotor },
        { label: 'Fecha Emisión', valor: vehiculo.padronFechaEmision }
      ]
    },
    {
      tipo: 'PRT',
      titulo: 'Certificado Revisión Técnica (PRT)',
      descripcion: 'Planta de Revisión Técnica y Emisión de Gases',
      fechaVencimiento: vehiculo.revisionTecnicaVencimiento,
      numero: vehiculo.revisionTecnicaNumero,
      numeroLabel: 'N° Certificado / Planta',
      emisor: vehiculo.revisionTecnicaNumero ? `Planta ${vehiculo.revisionTecnicaNumero}` : 'Planta Homologada',
      emisorLabel: 'Planta PRT',
      imagen: vehiculo.revisionTecnicaImagen,
      patente: vehiculo.patente,
      estadoInfo: prtStatus
    },
    {
      tipo: 'SOAP',
      titulo: 'Seguro Obligatorio (SOAP)',
      descripcion: 'Seguro Obligatorio de Accidentes Personales',
      fechaVencimiento: vehiculo.soapVencimiento,
      numero: vehiculo.soapPoliza,
      numeroLabel: 'N° de Póliza',
      emisor: vehiculo.soapAseguradora,
      emisorLabel: 'Compañía Aseguradora',
      imagen: vehiculo.soapImagen,
      patente: vehiculo.patente,
      estadoInfo: soapStatus
    },
    {
      tipo: 'PERMISO',
      titulo: 'Permiso de Circulación',
      descripcion: 'Habilitación Municipal Anual para Circular',
      fechaVencimiento: vehiculo.permisoCirculacionVencimiento,
      numero: vehiculo.permisoCirculacionFolio,
      numeroLabel: 'Folio / Comprobante de Pago',
      emisor: vehiculo.permisoCirculacionMunicipalidad,
      emisorLabel: 'Municipalidad Emisora',
      imagen: vehiculo.permisoCirculacionImagen,
      patente: vehiculo.patente,
      estadoInfo: permisoStatus
    }
  ];

  return (
    <div style={{ marginTop: '1.25rem' }}>
      
      {/* Banner de Estado General de Legalidad */}
      <div 
        style={{ 
          padding: '0.85rem 1rem', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: hasExpired 
            ? 'rgba(239, 68, 68, 0.12)' 
            : allValid 
              ? 'rgba(16, 185, 129, 0.12)' 
              : 'rgba(245, 158, 11, 0.12)',
          border: `1px solid ${hasExpired ? 'rgba(239, 68, 68, 0.3)' : allValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
        }}
      >
        <div style={{ flexShrink: 0 }}>
          {hasExpired ? (
            <AlertTriangle size={22} color="var(--color-danger)" />
          ) : allValid ? (
            <CheckCircle2 size={22} color="var(--color-success)" />
          ) : (
            <AlertCircle size={22} color="var(--color-warning)" />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: '0.88rem', 
            fontWeight: 700, 
            color: hasExpired ? 'var(--color-danger)' : allValid ? 'var(--color-success)' : 'var(--color-warning)' 
          }}>
            {hasExpired 
              ? 'DOCUMENTACIÓN VENCIDA — NO APTO PARA CIRCULAR' 
              : allValid 
                ? 'DOCUMENTACIÓN AL DÍA — VEHÍCULO HABILITADO' 
                : 'DOCUMENTACIÓN INCOMPLETA / PENDIENTE'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            {hasExpired 
              ? 'Presenta documentos obligatorios vencidos ante la Ley de Tránsito 18.290 de Chile.' 
              : allValid 
                ? 'Revisión técnica, SOAP y permiso de circulación en regla.' 
                : 'Se recomienda registrar las fechas y certificados pendientes.'}
          </div>
        </div>
      </div>

      {/* Grid de los 3 Documentos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
        {docs.map((doc, idx) => {
          const st = doc.estadoInfo;
          const hasImage = Boolean(doc.imagen);

          return (
            <div 
              key={idx}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Top row: Name & Badge */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileCheck size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {doc.tipo}
                    </span>
                  </div>

                  <span className={`badge ${st.badgeClass}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                    {st.label}
                  </span>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: '1.3' }}>
                  {doc.titulo}
                </div>

                {/* Details list */}
                <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Vence:</span>
                    <strong style={{ color: st.color }}>{doc.fechaVencimiento || 'No registrada'}</strong>
                  </div>

                  {doc.emisor && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{doc.tipo === 'SOAP' ? 'Aseguradora:' : doc.tipo === 'PRT' ? 'Planta:' : 'Municipalidad:'}</span>
                      <span style={{ color: 'var(--text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>
                        {doc.emisor}
                      </span>
                    </div>
                  )}

                  {doc.numero && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>N°:</span>
                      <span style={{ color: 'var(--text-primary)' }}>{doc.numero}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button: View Image */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenModal({
                  titulo: doc.titulo,
                  tipo: doc.tipo,
                  patente: vehiculo.patente,
                  fechaVencimiento: doc.fechaVencimiento,
                  numero: doc.numero,
                  numeroLabel: doc.numeroLabel,
                  emisor: doc.emisor,
                  emisorLabel: doc.emisorLabel,
                  imagen: doc.imagen,
                  estado: st.estado,
                  diasRestantes: st.dias
                })}
                style={{
                  width: '100%',
                  fontSize: '0.78rem',
                  padding: '0.45rem 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  border: hasImage ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-color)',
                  color: hasImage ? 'var(--primary)' : 'var(--text-secondary)'
                }}
              >
                <Eye size={14} />
                <span>{hasImage ? 'Ver Documento' : 'Sin Imagen (Ver Ficha)'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentosVehiculoSection;
