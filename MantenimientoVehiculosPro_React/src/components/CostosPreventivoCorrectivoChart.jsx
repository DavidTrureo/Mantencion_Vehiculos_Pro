import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Calendar, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  PieChart, 
  Search
} from 'lucide-react';

const formatCLP = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// Heurística de respaldo para clasificar mantenciones
const clasificarMantenimiento = (m) => {
  if (m.clasificacion) {
    return m.clasificacion.toUpperCase().trim();
  }
  const text = ((m.tipo || '') + ' ' + (m.descripcion || '')).toLowerCase();
  if (
    text.includes('choque') || 
    text.includes('falla') || 
    text.includes('rotura') || 
    text.includes('reparac') || 
    text.includes('imprevist') || 
    text.includes('siniestro') || 
    text.includes('pana') || 
    text.includes('accidente') || 
    text.includes('emergenc') || 
    text.includes('averia') ||
    text.includes('correctiv')
  ) {
    return 'CORRECTIVO';
  }
  return 'PREVENTIVO';
};

const CostosPreventivoCorrectivoChart = ({ vehicles = [] }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('ALL'); // 'ALL' o 'YYYY-MM'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('TOTAL'); // 'TOTAL' | 'CORRECTIVO' | 'PREVENTIVO' | 'PATENTE'
  const [expandedPatente, setExpandedPatente] = useState(null);

  // 1. Extraer todos los meses disponibles a partir de las fechas de mantenciones
  const availableMonths = useMemo(() => {
    const monthSet = new Set();
    vehicles.forEach(v => {
      (v.mantenimientos || []).forEach(m => {
        if (m.fecha && m.fecha.length >= 7) {
          monthSet.add(m.fecha.substring(0, 7)); // 'YYYY-MM'
        }
      });
    });

    const sorted = Array.from(monthSet).sort().reverse();
    return sorted.map(ym => {
      const [year, month] = ym.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const label = date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
      return {
        key: ym,
        label: label.charAt(0).toUpperCase() + label.slice(1)
      };
    });
  }, [vehicles]);

  // 2. Procesar y filtrar datos por período
  const processedData = useMemo(() => {
    let globalPreventivo = 0;
    let globalCorrectivo = 0;

    const vehicleStats = vehicles.map(v => {
      const allMants = v.mantenimientos || [];
      
      const filteredMants = allMants.filter(m => {
        if (!m.fecha) return selectedPeriod === 'ALL';
        if (selectedPeriod === 'ALL') return true;
        return m.fecha.startsWith(selectedPeriod);
      });

      let prevCost = 0;
      let corrCost = 0;
      const mantsWithClass = filteredMants.map(m => {
        const cat = clasificarMantenimiento(m);
        const cost = Number(m.costo) || 0;
        if (cat === 'CORRECTIVO') {
          corrCost += cost;
        } else {
          prevCost += cost;
        }
        return { ...m, computedClass: cat, cleanCost: cost };
      });

      const totalCost = prevCost + corrCost;
      globalPreventivo += prevCost;
      globalCorrectivo += corrCost;

      const prevPct = totalCost > 0 ? Math.round((prevCost / totalCost) * 100) : 0;
      const corrPct = totalCost > 0 ? (100 - prevPct) : 0;

      return {
        id: v.id,
        patente: v.patente || 'S/P',
        marca: v.marca || 'Vehículo',
        modelo: v.modelo || '',
        anio: v.anio || '',
        totalCost,
        prevCost,
        corrCost,
        prevPct,
        corrPct,
        mantenimientos: mantsWithClass
      };
    });

    // Filtrar por término de búsqueda y vehículos
    let filteredList = vehicleStats.filter(v => {
      const matchSearch = v.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.modelo.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });

    // Ordenamiento
    filteredList.sort((a, b) => {
      if (sortBy === 'CORRECTIVO') return b.corrCost - a.corrCost;
      if (sortBy === 'PREVENTIVO') return b.prevCost - a.prevCost;
      if (sortBy === 'PATENTE') return a.patente.localeCompare(b.patente);
      return b.totalCost - a.totalCost; // Default TOTAL
    });

    const globalTotal = globalPreventivo + globalCorrectivo;
    const globalPrevPct = globalTotal > 0 ? Math.round((globalPreventivo / globalTotal) * 100) : 0;
    const globalCorrPct = globalTotal > 0 ? (100 - globalPrevPct) : 0;

    return {
      globalTotal,
      globalPreventivo,
      globalCorrectivo,
      globalPrevPct,
      globalCorrPct,
      vehicles: filteredList
    };
  }, [vehicles, selectedPeriod, searchTerm, sortBy]);

  const toggleExpand = (patente) => {
    setExpandedPatente(prev => prev === patente ? null : patente);
  };

  return (
    <div className="glass-card" style={{ marginTop: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      {/* Header con título y selector de mes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <PieChart size={22} color="#3b82f6" />
            Costos de Mantenimiento: Preventivo vs. Correctivo
          </h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Proporción de gasto en mantenciones programadas (aceite/filtros) frente a fallas inesperadas y siniestros por patente
          </p>
        </div>

        {/* Selector de Período Mensual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Calendar size={16} color="var(--primary)" />
          <select
            className="form-input"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ 
              padding: '0.3rem 0.6rem', 
              fontSize: '0.85rem', 
              background: 'transparent', 
              border: 'none', 
              color: '#ffffff', 
              outline: 'none',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="ALL" style={{ background: '#111827' }}>Acumulado Histórico (Todo)</option>
            {availableMonths.map(m => (
              <option key={m.key} value={m.key} style={{ background: '#111827' }}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards: Resumen Global del Período */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Total Invertido */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Gasto Total del Período</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f3f4f6', marginTop: '0.35rem' }}>
            {formatCLP(processedData.globalTotal)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Inversión global de la flota
          </div>
        </div>

        {/* Preventivo */}
        <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <div style={{ fontSize: '0.75rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <ShieldCheck size={14} /> Gasto Preventivo ({processedData.globalPrevPct}%)
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981', marginTop: '0.35rem' }}>
            {formatCLP(processedData.globalPreventivo)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6ee7b7', marginTop: '0.2rem' }}>
            Aceite, filtros, frenos, bujías
          </div>
        </div>

        {/* Correctivo */}
        <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
          <div style={{ fontSize: '0.75rem', color: '#f87171', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <AlertTriangle size={14} /> Gasto Correctivo ({processedData.globalCorrPct}%)
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ef4444', marginTop: '0.35rem' }}>
            {formatCLP(processedData.globalCorrectivo)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '0.2rem' }}>
            Fallas, averías, choques y siniestros
          </div>
        </div>

        {/* Índice de Salud */}
        <div style={{ 
          background: processedData.globalPrevPct >= 70 ? 'rgba(59, 130, 246, 0.08)' : 'rgba(245, 158, 11, 0.08)', 
          padding: '1rem', 
          borderRadius: '10px', 
          border: processedData.globalPrevPct >= 70 ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Índice de Salud Operativa</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: processedData.globalPrevPct >= 70 ? '#60a5fa' : '#fbbf24', marginTop: '0.35rem' }}>
            {processedData.globalPrevPct >= 70 ? '🟢 Gestión Óptima' : processedData.globalPrevPct >= 50 ? '🟡 Atención Preventiva' : '🔴 Alta Siniestralidad'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {processedData.globalPrevPct >= 70 
              ? 'Menos paradas imprevistas en ruta' 
              : 'Se recomienda intensificar pautas de rutina'}
          </div>
        </div>
      </div>

      {/* Barra Proporcional Continua Global */}
      <div style={{ marginBottom: '1.75rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            ● Preventivo: {processedData.globalPrevPct}% ({formatCLP(processedData.globalPreventivo)})
          </span>
          <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            ● Correctivo: {processedData.globalCorrPct}% ({formatCLP(processedData.globalCorrectivo)})
          </span>
        </div>

        <div style={{ width: '100%', height: '22px', borderRadius: '8px', overflow: 'hidden', display: 'flex', backgroundColor: '#1f2937' }}>
          {processedData.globalTotal === 0 ? (
            <div style={{ width: '100%', height: '100%', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#9ca3af' }}>
              Sin registros en este período
            </div>
          ) : (
            <>
              <div 
                style={{ 
                  width: `${processedData.globalPrevPct}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #059669, #10b981)', 
                  transition: 'width 0.8s ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
                title={`Preventivo: ${formatCLP(processedData.globalPreventivo)} (${processedData.globalPrevPct}%)`}
              >
                {processedData.globalPrevPct > 12 && `${processedData.globalPrevPct}%`}
              </div>
              <div 
                style={{ 
                  width: `${processedData.globalCorrPct}%`, 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #dc2626, #ef4444)', 
                  transition: 'width 0.8s ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
                title={`Correctivo: ${formatCLP(processedData.globalCorrectivo)} (${processedData.globalCorrPct}%)`}
              >
                {processedData.globalCorrPct > 12 && `${processedData.globalCorrPct}%`}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Controles de Lista: Buscador y Ordenador por Patente */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '240px' }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar por Patente o Modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.85rem', outline: 'none', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <Filter size={14} /> Ordenar por:
          <select
            className="form-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#111827', border: '1px solid var(--border-color)', color: '#ffffff', borderRadius: '6px' }}
          >
            <option value="TOTAL">Mayor Gasto Total</option>
            <option value="CORRECTIVO">Mayor Gasto Correctivo 🚨</option>
            <option value="PREVENTIVO">Mayor Gasto Preventivo 🟢</option>
            <option value="PATENTE">Patente (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Desglose Comparativo por Patente */}
      {processedData.vehicles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          No se encontraron vehículos o mantenimientos en el período seleccionado.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {processedData.vehicles.map(v => {
            const isExpanded = expandedPatente === v.patente;

            return (
              <div 
                key={v.id} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '10px', 
                  padding: '0.85rem 1rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Fila Principal de la Patente */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', cursor: 'pointer' }} onClick={() => toggleExpand(v.patente)}>
                  
                  {/* Badge de Patente Chilena */}
                  <div style={{ 
                    minWidth: '95px', 
                    background: '#0f172a', 
                    border: '1.5px solid #38bdf8', 
                    borderRadius: '5px', 
                    padding: '0.25rem 0.5rem', 
                    textAlign: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.08em', color: '#f8fafc', fontFamily: 'monospace' }}>
                      {v.patente}
                    </span>
                  </div>

                  {/* Info Vehículo */}
                  <div style={{ flex: '1 1 180px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f3f4f6' }}>
                      {v.marca} {v.modelo}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Año {v.anio} • {v.mantenimientos.length} mantenciones
                    </div>
                  </div>

                  {/* Barra de Proporción Dual (Preventivo vs Correctivo) */}
                  <div style={{ flex: '2 1 260px', minWidth: '220px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#34d399', fontWeight: 600 }}>🟢 Prev: {formatCLP(v.prevCost)} ({v.prevPct}%)</span>
                      <span style={{ color: '#f87171', fontWeight: 600 }}>🔴 Corr: {formatCLP(v.corrCost)} ({v.corrPct}%)</span>
                    </div>

                    <div style={{ width: '100%', height: '14px', borderRadius: '4px', overflow: 'hidden', display: 'flex', backgroundColor: '#1e293b' }}>
                      {v.totalCost === 0 ? (
                        <div style={{ width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
                      ) : (
                        <>
                          <div 
                            style={{ 
                              width: `${v.prevPct}%`, 
                              height: '100%', 
                              background: '#10b981', 
                              transition: 'width 0.5s ease' 
                            }} 
                            title={`Preventivo: ${formatCLP(v.prevCost)}`}
                          />
                          <div 
                            style={{ 
                              width: `${v.corrPct}%`, 
                              height: '100%', 
                              background: '#ef4444', 
                              transition: 'width 0.5s ease' 
                            }} 
                            title={`Correctivo: ${formatCLP(v.corrCost)}`}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Costo Total */}
                  <div style={{ minWidth: '110px', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f9fafb' }}>
                      {formatCLP(v.totalCost)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Inversión neta
                    </div>
                  </div>

                  {/* Flecha de expansión */}
                  <div style={{ color: 'var(--text-muted)' }}>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Detalle Desplegable con Mantenciones del Vehículo */}
                {isExpanded && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.05)', animation: 'fadeIn 0.2s ease-in' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Detalle de intervenciones para {v.patente} ({selectedPeriod === 'ALL' ? 'Histórico' : selectedPeriod}):
                    </div>

                    {v.mantenimientos.length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No hay registros en este período.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.5rem' }}>
                        {v.mantenimientos.map(m => (
                          <div 
                            key={m.id} 
                            style={{ 
                              padding: '0.6rem 0.8rem', 
                              borderRadius: '6px', 
                              background: m.computedClass === 'CORRECTIVO' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                              border: `1px solid ${m.computedClass === 'CORRECTIVO' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f3f4f6' }}>
                                {m.computedClass === 'CORRECTIVO' ? '🔴' : '🟢'} {m.tipo}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {m.fecha} • {m.kilometraje ? `${Number(m.kilometraje).toLocaleString()} km` : ''}
                              </div>
                              {m.descripcion && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {m.descripcion}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.85rem', color: m.computedClass === 'CORRECTIVO' ? '#f87171' : '#34d399' }}>
                              {formatCLP(m.cleanCost)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CostosPreventivoCorrectivoChart;
