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

export const cleanDocVal = (val) => {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (str === '' || str.toUpperCase() === 'NULL' || str.toUpperCase() === 'UNDEFINED' || str === 'null') {
    return null;
  }
  return str;
};

export const evaluarDocumento = (fechaVencimiento) => {
  const cleanFecha = cleanDocVal(fechaVencimiento);
  if (!cleanFecha) {
    return {
      estado: 'sin_registrar',
      label: 'Sin Registrar',
      chipLabel: 'Sin Reg.',
      badgeClass: 'badge-secondary',
      dias: null,
      color: 'var(--text-muted)'
    };
  }

  // Parsear fecha considerando formatos YYYY-MM-DD, DD-MM-YYYY o ISO
  let cleanStr = cleanFecha;
  if (cleanStr.includes('T')) {
    cleanStr = cleanStr.split('T')[0];
  }
  cleanStr = cleanStr.replace(/\//g, '-').trim();

  const partes = cleanStr.split('-');
  let anio, mes, dia;

  if (partes.length === 3) {
    if (partes[0].length === 4) {
      // YYYY-MM-DD
      anio = Number(partes[0]);
      mes = Number(partes[1]) - 1;
      dia = Number(partes[2]);
    } else if (partes[2].length === 4) {
      // DD-MM-YYYY
      dia = Number(partes[0]);
      mes = Number(partes[1]) - 1;
      anio = Number(partes[2]);
    }
  }

  let vencimiento;
  if (anio && !isNaN(mes) && dia) {
    vencimiento = new Date(anio, mes, dia);
  } else {
    vencimiento = new Date(cleanFecha);
  }

  if (!vencimiento || isNaN(vencimiento.getTime())) {
    return {
      estado: 'sin_registrar',
      label: 'Sin Registrar',
      chipLabel: 'Sin Reg.',
      badgeClass: 'badge-secondary',
      dias: null,
      color: 'var(--text-muted)'
    };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const diffTime = vencimiento.getTime() - hoy.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      estado: 'vencido',
      label: `Vencido (${Math.abs(diffDays)}d)`,
      chipLabel: 'Vencido',
      dias: diffDays,
      badgeClass: 'badge-danger',
      color: 'var(--color-danger)'
    };
  } else if (diffDays === 0) {
    return {
      estado: 'por_vencer',
      label: 'Vence Hoy',
      chipLabel: 'Vence Hoy',
      dias: 0,
      badgeClass: 'badge-warning',
      color: 'var(--color-warning)'
    };
  } else if (diffDays <= 30) {
    return {
      estado: 'por_vencer',
      label: `Vence en ${diffDays}d`,
      chipLabel: `${diffDays}d`,
      dias: diffDays,
      badgeClass: 'badge-warning',
      color: 'var(--color-warning)'
    };
  } else {
    return {
      estado: 'vigente',
      label: `Al día (${diffDays}d)`,
      chipLabel: 'Al día',
      dias: diffDays,
      badgeClass: 'badge-success',
      color: 'var(--color-success)'
    };
  }
};

export const evaluarEstadoDocumentacionVehiculo = (vehiculo) => {
  if (!vehiculo) {
    return {
      estado: 'incompleto',
      label: 'Sin Datos',
      chipLabel: 'Sin Datos',
      badgeClass: 'badge-secondary',
      color: 'var(--text-muted)',
      borderColor: 'var(--border-color)',
      iconText: '❓',
      descripcion: 'No hay información del vehículo registrada.'
    };
  }

  const padronValido = Boolean(
    cleanDocVal(vehiculo.padronFolio) || 
    cleanDocVal(vehiculo.padronImagen) || 
    cleanDocVal(vehiculo.padronVin)
  );

  const padronStatus = padronValido
    ? { estado: 'vigente', label: 'Inscrito / Al Día', chipLabel: 'Al día', badgeClass: 'badge-success', color: 'var(--color-success)' }
    : { estado: 'sin_registrar', label: 'Sin Adjuntar', chipLabel: 'Sin Doc.', badgeClass: 'badge-secondary', color: 'var(--text-muted)' };

  const prtStatus = evaluarDocumento(vehiculo.revisionTecnicaVencimiento);
  const soapStatus = evaluarDocumento(vehiculo.soapVencimiento);
  const permisoStatus = evaluarDocumento(vehiculo.permisoCirculacionVencimiento);

  const docs = [
    { nombre: 'Padrón', st: padronStatus },
    { nombre: 'PRT', st: prtStatus },
    { nombre: 'SOAP', st: soapStatus },
    { nombre: 'Permiso', st: permisoStatus }
  ];

  const hasExpired = docs.some(d => d.st.estado === 'vencido');
  const hasPending = docs.some(d => d.st.estado === 'sin_registrar');
  const hasExpiringSoon = docs.some(d => d.st.estado === 'por_vencer');
  const allValid = docs.every(d => d.st.estado === 'vigente');

  if (hasExpired) {
    const vencidos = docs.filter(d => d.st.estado === 'vencido').map(d => d.nombre);
    return {
      estado: 'vencido',
      label: 'Docs Vencidos',
      chipLabel: 'Vencido',
      badgeClass: 'badge-danger',
      color: 'var(--color-danger)',
      borderColor: 'rgba(239, 68, 68, 0.4)',
      iconText: '🛑',
      descripcion: `Documentación vencida: ${vencidos.join(', ')}. Infracción a Ley de Tránsito.`,
      padronStatus,
      prtStatus,
      soapStatus,
      permisoStatus
    };
  }

  if (hasPending) {
    const faltantes = docs.filter(d => d.st.estado === 'sin_registrar').map(d => d.nombre);
    return {
      estado: 'incompleto',
      label: 'Docs Incompletos',
      chipLabel: 'Incompleto',
      badgeClass: 'badge-warning',
      color: '#f59e0b',
      borderColor: 'rgba(245, 158, 11, 0.4)',
      iconText: '⚠️',
      descripcion: `Falta registrar en BD: ${faltantes.join(', ')}.`,
      faltantes,
      padronStatus,
      prtStatus,
      soapStatus,
      permisoStatus
    };
  }

  if (hasExpiringSoon) {
    const porVencer = docs.filter(d => d.st.estado === 'por_vencer').map(d => `${d.nombre} (${d.st.chipLabel})`);
    return {
      estado: 'por_vencer',
      label: 'Docs por Vencer',
      chipLabel: 'Por Vencer',
      badgeClass: 'badge-warning',
      color: '#f59e0b',
      borderColor: 'rgba(245, 158, 11, 0.4)',
      iconText: '⏳',
      descripcion: `Próximos a vencer: ${porVencer.join(', ')}.`,
      padronStatus,
      prtStatus,
      soapStatus,
      permisoStatus
    };
  }

  if (allValid) {
    return {
      estado: 'al_dia',
      label: 'Docs al Día',
      chipLabel: 'Al día',
      badgeClass: 'badge-success',
      color: 'var(--color-success)',
      borderColor: 'rgba(16, 185, 129, 0.4)',
      iconText: '✅',
      descripcion: 'Padrón, PRT, SOAP y Permiso de Circulación registrados y vigentes.',
      padronStatus,
      prtStatus,
      soapStatus,
      permisoStatus
    };
  }

  return {
    estado: 'incompleto',
    label: 'Docs Incompletos',
    chipLabel: 'Incompleto',
    badgeClass: 'badge-secondary',
    color: 'var(--text-muted)',
    borderColor: 'var(--border-color)',
    iconText: '⚠️',
    descripcion: 'Documentación legal pendiente de verificación.',
    padronStatus,
    prtStatus,
    soapStatus,
    permisoStatus
  };
};

const DocumentosVehiculoSection = ({ vehiculo, onOpenModal }) => {
  if (!vehiculo) return null;

  const docGeneral = evaluarEstadoDocumentacionVehiculo(vehiculo);
  const padronStatus = docGeneral.padronStatus;
  const prtStatus = docGeneral.prtStatus;
  const soapStatus = docGeneral.soapStatus;
  const permisoStatus = docGeneral.permisoStatus;

  const hasExpired = docGeneral.estado === 'vencido';
  const allValid = docGeneral.estado === 'al_dia';

  const emisorPrt = cleanDocVal(vehiculo.revisionTecnicaNumero) 
    ? `Planta ${cleanDocVal(vehiculo.revisionTecnicaNumero)}` 
    : 'Planta Homologada';

  const docs = [
    {
      tipo: 'PADRON',
      titulo: 'Certificado de Inscripción de Vehículos Motorizados (Padrón)',
      descripcion: 'Registro de Vehículos Motorizados (R.V.M.) - Servicio de Registro Civil e Identificación de Chile',
      fechaVencimiento: cleanDocVal(vehiculo.padronFechaEmision) ? `Emitido: ${cleanDocVal(vehiculo.padronFechaEmision)}` : 'Documento Permanente',
      numero: cleanDocVal(vehiculo.padronFolio) || cleanDocVal(vehiculo.padronVin) || 'Sin registrar',
      numeroLabel: 'Folio / N° Chasis (VIN)',
      emisor: 'Servicio de Registro Civil e Identificación',
      emisorLabel: 'Entidad Emisora',
      imagen: cleanDocVal(vehiculo.padronImagen),
      patente: vehiculo.patente,
      estadoInfo: padronStatus,
      detallesExtra: [
        { label: 'N° Chasis / VIN', valor: cleanDocVal(vehiculo.padronVin) },
        { label: 'N° Motor', valor: cleanDocVal(vehiculo.padronMotor) },
        { label: 'Fecha Emisión', valor: cleanDocVal(vehiculo.padronFechaEmision) }
      ].filter(d => d.valor)
    },
    {
      tipo: 'PRT',
      titulo: 'Certificado Revisión Técnica (PRT)',
      descripcion: 'Planta de Revisión Técnica y Emisión de Gases',
      fechaVencimiento: cleanDocVal(vehiculo.revisionTecnicaVencimiento) || 'Sin registrar',
      numero: cleanDocVal(vehiculo.revisionTecnicaNumero) || 'Sin registrar',
      numeroLabel: 'N° Certificado / Planta',
      emisor: emisorPrt,
      emisorLabel: 'Planta PRT',
      imagen: cleanDocVal(vehiculo.revisionTecnicaImagen),
      patente: vehiculo.patente,
      estadoInfo: prtStatus
    },
    {
      tipo: 'SOAP',
      titulo: 'Seguro Obligatorio (SOAP)',
      descripcion: 'Seguro Obligatorio de Accidentes Personales',
      fechaVencimiento: cleanDocVal(vehiculo.soapVencimiento) || 'Sin registrar',
      numero: cleanDocVal(vehiculo.soapPoliza) || 'Sin registrar',
      numeroLabel: 'N° de Póliza',
      emisor: cleanDocVal(vehiculo.soapAseguradora) || 'Compañía Aseguradora',
      emisorLabel: 'Compañía Aseguradora',
      imagen: cleanDocVal(vehiculo.soapImagen),
      patente: vehiculo.patente,
      estadoInfo: soapStatus
    },
    {
      tipo: 'PERMISO',
      titulo: 'Permiso de Circulación',
      descripcion: 'Habilitación Municipal Anual para Circular',
      fechaVencimiento: cleanDocVal(vehiculo.permisoCirculacionVencimiento) || 'Sin registrar',
      numero: cleanDocVal(vehiculo.permisoCirculacionFolio) || 'Sin registrar',
      numeroLabel: 'Folio / Comprobante de Pago',
      emisor: cleanDocVal(vehiculo.permisoCirculacionMunicipalidad) || 'Municipalidad Emisora',
      emisorLabel: 'Municipalidad Emisora',
      imagen: cleanDocVal(vehiculo.permisoCirculacionImagen),
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
              title="Toca para ver y ampliar documento"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: hasImage ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                boxShadow: hasImage ? '0 4px 14px rgba(0,0,0,0.25)' : 'none'
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

                {/* Si tiene imagen adjunta, mostrar miniatura previa que invita a tocar */}
                {hasImage && (
                  <div style={{ 
                    marginBottom: '0.65rem', 
                    borderRadius: '6px', 
                    overflow: 'hidden', 
                    height: '65px', 
                    backgroundColor: '#000', 
                    border: '1px solid rgba(255,255,255,0.08)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img 
                      src={doc.imagen} 
                      alt={doc.titulo} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} 
                    />
                    <div style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      backgroundColor: 'rgba(0,0,0,0.3)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '5px',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 600
                    }}>
                      <Eye size={13} color="var(--primary)" />
                      <span>Toca para ampliar</span>
                    </div>
                  </div>
                )}

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
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenModal({
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
                  });
                }}
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
                <span>{hasImage ? 'Ver / Ampliar Documento' : 'Sin Imagen (Ver Ficha)'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentosVehiculoSection;
