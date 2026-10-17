import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Car, 
  Wrench, 
  DollarSign, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  UserCheck,
  Compass,
  Sparkles,
  FileCheck,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Eye,
  Camera,
  Check,
  CheckCircle2,
  X,
  Phone
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Toast from '../components/Toast';
import { evaluarDocumento } from '../components/DocumentosVehiculoSection';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState({ id: 'ALL', fullName: 'Toda la Flota Corporativa' });
  const [vehicles, setVehicles] = useState([]);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalMaintenance: 0,
    totalCost: 0,
    alertCount: 0
  });
  const [allAlerts, setAllAlerts] = useState([]);
  const [docAlerts, setDocAlerts] = useState([]);
  const [incidentAlerts, setIncidentAlerts] = useState([]);
  const [activeAlertTab, setActiveAlertTab] = useState('INCIDENTES'); // 'INCIDENTES' | 'DOCUMENTOS' | 'MANTENIMIENTO'
  const [selectedIncidentModal, setSelectedIncidentModal] = useState(null);
  const [toast, setToast] = useState(null);

  const isAdmin = user?.role === 'ADMIN';
  const isMecanico = user?.role === 'MECANICO';

  // Cargar lista de usuarios si es Admin o Mecánico
  useEffect(() => {
    const fetchUsers = async () => {
      if (isAdmin || isMecanico) {
        try {
          const list = await api.getUsuarios();
          setUsers(list);
          // Por defecto en empresas, mostrar toda la flota corporativa
          setSelectedUser({ id: 'ALL', fullName: 'Toda la Flota Corporativa' });
        } catch (e) {
          console.error("Error al cargar usuarios:", e);
          setToast({ message: e.message || 'No se pudo cargar la lista de usuarios.', type: 'error' });
          // Fallback para que el dashboard no quede colgado en el spinner si el servidor rechaza usuarios
          setSelectedUser({ id: 'ALL', fullName: 'Toda la Flota Corporativa' });
          setLoading(false);
        }
      } else {
        // Para conductores o usuarios estándar
        setSelectedUser(user);
      }
    };
    fetchUsers();
  }, [isAdmin, isMecanico, user]);

  // Cargar vehículos y calcular estadísticas (con soporte de auto-refresco en vivo)
  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!selectedUser) return;
    
    if (!isSilent) setLoading(true);
    try {
      // 1. Obtener vehículos (flota completa o por conductor)
      let vehList = [];
      if (selectedUser.id === 'ALL') {
        vehList = await api.getTodosLosVehiculos();
      } else {
        vehList = await api.getVehiculosPorUsuario(selectedUser.id);
      }
      
      // 2. Para cada vehículo, cargar sus mantenimientos para calcular costos y estadísticas
      let totalMantsCount = 0;
      let totalCostsSum = 0;
      let alertsArr = [];
      let docAlertsArr = [];

      const detailedVehicles = await Promise.all(vehList.map(async (v) => {
        try {
          const mants = await api.getMantenimientosPorVehiculo(v.id);
          const costs = mants.reduce((sum, m) => sum + (m.costo || 0), 0);
          totalMantsCount += mants.length;
          totalCostsSum += costs;
          
          if (v.alertas && v.alertas.length > 0) {
            v.alertas.forEach(alertText => {
              alertsArr.push({
                vehicleId: v.id,
                vehicleName: `${v.marca} ${v.modelo} (${v.patente || v.anio})`,
                patente: v.patente || 'S/P',
                propietario: v.propietarioNombre || 'No asignado',
                text: alertText
              });
            });
          }

          // Evaluar Vencimientos de Documentos Legales
          // 1. Revisión Técnica (PRT)
          const prt = evaluarDocumento(v.revisionTecnicaVencimiento);
          if (prt.estado === 'vencido' || prt.estado === 'por_vencer') {
            docAlertsArr.push({
              vehicleId: v.id,
              vehicleName: `${v.marca} ${v.modelo}`,
              patente: v.patente || 'S/P',
              tipoDoc: 'Revisión Técnica (PRT)',
              vencimiento: v.revisionTecnicaVencimiento,
              estado: prt.estado,
              label: prt.label,
              color: prt.color,
              dias: prt.dias
            });
          }

          // 2. SOAP
          const soap = evaluarDocumento(v.soapVencimiento);
          if (soap.estado === 'vencido' || soap.estado === 'por_vencer') {
            docAlertsArr.push({
              vehicleId: v.id,
              vehicleName: `${v.marca} ${v.modelo}`,
              patente: v.patente || 'S/P',
              tipoDoc: 'Seguro Obligatorio (SOAP)',
              vencimiento: v.soapVencimiento,
              estado: soap.estado,
              label: soap.label,
              color: soap.color,
              dias: soap.dias
            });
          }

          // 3. Permiso de Circulación
          const perm = evaluarDocumento(v.permisoCirculacionVencimiento);
          if (perm.estado === 'vencido' || perm.estado === 'por_vencer') {
            docAlertsArr.push({
              vehicleId: v.id,
              vehicleName: `${v.marca} ${v.modelo}`,
              patente: v.patente || 'S/P',
              tipoDoc: 'Permiso de Circulación',
              vencimiento: v.permisoCirculacionVencimiento,
              estado: perm.estado,
              label: perm.label,
              color: perm.color,
              dias: perm.dias
            });
          }

          // 4. Padrón (R.V.M.)
          if (!v.padronFolio && !v.padronImagen && !v.padronVin) {
            docAlertsArr.push({
              vehicleId: v.id,
              vehicleName: `${v.marca} ${v.modelo}`,
              patente: v.patente || 'S/P',
              tipoDoc: 'Padrón (R.V.M.)',
              vencimiento: 'Sin Registro',
              estado: 'sin_registrar',
              label: 'Documento no adjuntado',
              color: '#f59e0b',
              dias: null
            });
          }

          return { ...v, mantenimientos: mants, totalCost: costs };
        } catch (err) {
          console.error(`Error cargando mantenimientos del vehículo ${v.id}:`, err);
          return { ...v, mantenimientos: [], totalCost: 0 };
        }
      }));

      // Cargar reportes de anomalías / siniestros emitidos por conductores desde la base central MySQL
      let incidentReports = [];
      try {
        incidentReports = await api.getIncidentes();
      } catch (e) {
        console.warn("Aviso al leer incidentes desde backend:", e);
        try {
          const saved = localStorage.getItem('vehiculospro_incidentes_reportados');
          incidentReports = saved ? JSON.parse(saved) : [];
        } catch (localErr) {
          incidentReports = [];
        }
      }

      setVehicles(detailedVehicles);
      setAllAlerts(alertsArr);
      setDocAlerts(docAlertsArr);
      setIncidentAlerts(incidentReports);

      const activeIncidents = incidentReports.filter(i => !i.resuelto);
      const totalAlertsCount = alertsArr.length + docAlertsArr.length + activeIncidents.length;

      setStats({
        totalVehicles: detailedVehicles.length,
        totalMaintenance: totalMantsCount,
        totalCost: totalCostsSum,
        alertCount: totalAlertsCount
      });

      // Si hay incidentes activos sin atender, sugerir esa pestaña al inicio
      if (activeIncidents.length > 0) {
        setActiveAlertTab('INCIDENTES');
      } else if (docAlertsArr.length > 0) {
        setActiveAlertTab('DOCUMENTOS');
      } else {
        setActiveAlertTab('MANTENIMIENTO');
      }
    } catch (e) {
      console.error("Error al cargar datos del dashboard:", e);
      if (!isSilent) setToast({ message: 'Error al recuperar la información de los vehículos.', type: 'error' });
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    loadDashboardData(false);

    // Actualización periódica en segundo plano cada 10 segundos
    const pollInterval = setInterval(() => {
      loadDashboardData(true);
    }, 10000);

    const handleFocus = () => {
      loadDashboardData(true);
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [loadDashboardData]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
  };

  const handleResolveIncident = async (incidentId) => {
    try {
      await api.resolverIncidente(incidentId, user?.fullName || user?.username || 'Administrador');
    } catch (apiErr) {
      console.warn("Aviso al resolver incidente en backend central:", apiErr);
    }

    let list = [];
    try {
      const saved = localStorage.getItem('vehiculospro_incidentes_reportados');
      list = saved ? JSON.parse(saved) : incidentAlerts;
    } catch (e) {
      list = incidentAlerts;
    }

    const updated = list.map(item => {
      if (item.id === incidentId) {
        return { ...item, resuelto: true, fechaResolucionStr: new Date().toLocaleString('es-CL') };
      }
      return item;
    });

    localStorage.setItem('vehiculospro_incidentes_reportados', JSON.stringify(updated));
    setIncidentAlerts(updated);

    const activeIncidents = updated.filter(i => !i.resuelto);
    setStats(prev => ({
      ...prev,
      alertCount: allAlerts.length + docAlerts.length + activeIncidents.length
    }));

    if (selectedIncidentModal?.id === incidentId) {
      setSelectedIncidentModal(null);
    }

    setToast({ message: 'Incidente marcado como atendido y registrado en el servidor.', type: 'success' });
  };

  const activeIncidents = incidentAlerts.filter(i => !i.resuelto);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Selector de Usuario para Admin/Mecánico */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1rem',
          marginBottom: '2rem' 
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Panel de Control
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Resumen de flota y estados de mantenimiento
          </p>
        </div>

        {(isAdmin || isMecanico) && users.length > 0 && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              background: 'rgba(255,255,255,0.03)',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)'
            }}
          >
            <UserCheck size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Ver flota de:</span>
            <select 
              className="form-input form-select"
              style={{ 
                width: '260px', 
                padding: '0.4rem 2rem 0.4rem 0.75rem', 
                fontSize: '0.875rem',
                margin: 0,
                border: 'none',
                background: 'rgba(0,0,0,0.2)'
              }}
              value={selectedUser?.id || 'ALL'}
              onChange={(e) => {
                if (e.target.value === 'ALL') {
                  setSelectedUser({ id: 'ALL', fullName: 'Toda la Flota Corporativa' });
                } else {
                  const found = users.find(u => u.id === Number(e.target.value));
                  if (found) setSelectedUser(found);
                }
              }}
            >
              <option value="ALL">🏢 Toda la Flota Corporativa</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  👤 {u.fullName} ({u.role})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
              gap: '1.5rem', 
              marginBottom: '2rem' 
            }}
          >
            {/* Stat: Vehiculos */}
            <div className="glass-card glass-card-hover" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>
                <Car size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Vehículos Flota</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.totalVehicles}</span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '0.25rem', fontSize: '0.72rem' }}>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>🟢 {vehicles.filter(v => !v.propietarioId && !v.propietarioNombre).length} disp.</span>
                  <span style={{ color: '#60a5fa', fontWeight: 600 }}>🔵 {vehicles.filter(v => !!v.propietarioId || !!v.propietarioNombre).length} en ruta</span>
                </div>
              </div>
            </div>

            {/* Stat: Mantenimientos */}
            <div className="glass-card glass-card-hover" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
                <Wrench size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Mantenimientos</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.totalMaintenance}</span>
              </div>
            </div>

            {/* Stat: Inversión */}
            <div className="glass-card glass-card-hover" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '0.85rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
                <DollarSign size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Costo Total</span>
                <span style={{ fontSize: '1.45rem', fontWeight: 800 }}>{formatCurrency(stats.totalCost)}</span>
              </div>
            </div>

            {/* Stat: Alertas */}
            <div 
              className="glass-card glass-card-hover" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.25rem',
                borderLeft: stats.alertCount > 0 ? '3px solid var(--color-danger)' : '1px solid var(--border-color)'
              }}
            >
              <div style={{ 
                padding: '0.85rem', 
                borderRadius: '12px', 
                background: stats.alertCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)', 
                color: stats.alertCount > 0 ? 'var(--color-danger)' : 'var(--text-muted)' 
              }}>
                <AlertTriangle size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Alertas</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: stats.alertCount > 0 ? 'var(--color-danger)' : 'inherit' }}>
                  {stats.alertCount}
                </span>
              </div>
            </div>
          </div>

          {/* Enterprise AI & Telemetry Hub */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            
            {/* GPS Telemetry Card */}
            <div 
              className="glass-card" 
              style={{ 
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    <Compass size={16} />
                    TELEMETRÍA & RUTAS GPS
                  </div>
                  <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Automático
                  </span>
                </div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Despacho de Rutas y Alertas por Kilometraje
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Calcula distancias entre centros logísticos, actualiza automáticamente el odómetro del vehículo y advierte si la ruta superará el límite de mantención.
                </p>
              </div>

              <Link 
                to="/rutas-gps" 
                className="btn btn-primary"
                style={{ 
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderColor: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  padding: '0.65rem 1rem'
                }}
              >
                <span>Monitorear Rutas y Flota GPS</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* AI Copilot Diagnostics Card */}
            <div 
              className="glass-card" 
              style={{ 
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    <Sparkles size={16} />
                    COPILOTO MECÁNICO IA
                  </div>
                  <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.2)', color: '#7dd3fc', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Predictivo
                  </span>
                </div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Diagnóstico Inteligente & Ahorro en Taller
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  Analiza fallas mecánicas por síntomas y kilometraje, estima costos en CLP, calcula ahorros preventivos y emite órdenes de trabajo inmediatas.
                </p>
              </div>

              <Link 
                to="/copiloto-ia" 
                className="btn btn-primary"
                style={{ 
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  borderColor: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  padding: '0.65rem 1rem'
                }}
              >
                <span>Consultar Copiloto IA</span>
                <ArrowRight size={16} />
              </Link>
            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }} className="dashboard-grid">
            
            {/* Left Panel: Chart & Vehicle List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Graphic Chart */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={18} color="var(--primary)" />
                    Inversión en Mantenimiento por Vehículo
                  </h3>
                </div>

                {vehicles.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay vehículos registrados para mostrar el gráfico.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
                    {vehicles.map((v) => {
                      const maxCost = Math.max(...vehicles.map(ve => ve.totalCost), 1);
                      const percentage = Math.min(100, Math.round((v.totalCost / maxCost) * 100));
                      
                      return (
                        <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '150px', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {v.marca} {v.modelo}
                          </div>
                          
                          {/* Bar */}
                          <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', height: '16px', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                            <div 
                              style={{ 
                                width: `${percentage}%`, 
                                height: '100%', 
                                background: 'linear-gradient(90deg, var(--primary), #60a5fa)',
                                borderRadius: '4px',
                                transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                              }} 
                            />
                          </div>
                          
                          <div style={{ width: '90px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {formatCurrency(v.totalCost)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick Vehicle List */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem' }}>Mis Vehículos</h3>
                  <Link to="/vehiculos" style={{ color: 'var(--primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', fontWeight: 500 }}>
                    Gestionar vehículos <ArrowRight size={14} />
                  </Link>
                </div>

                {vehicles.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay vehículos registrados para este usuario.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {vehicles.slice(0, 3).map((v) => (
                      <div key={v.id} style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>{v.marca} {v.modelo}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Año {v.anio} • {v.kilometraje.toLocaleString()} km</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                          <span className={`badge ${
                            v.alertas?.length > 0 ? 'badge-danger' : 'badge-success'
                          }`} style={{ fontSize: '0.65rem' }}>
                            {v.alertas?.length > 0 ? `${v.alertas.length} alertas` : 'Al día'}
                          </span>
                          <Link 
                            to={`/vehiculos?select=${v.id}`} 
                            style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}
                          >
                            Ver Detalles
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Centro de Notificaciones & Alertas Operativas */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} color={stats.alertCount > 0 ? 'var(--color-danger)' : 'var(--text-muted)'} />
                  Centro de Alertas
                </h3>
                <span className={`badge ${stats.alertCount > 0 ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.7rem' }}>
                  {stats.alertCount} activas
                </span>
              </div>

              {/* Pestañas de filtrado de alertas */}
              <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'rgba(0,0,0,0.25)', padding: '4px', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveAlertTab('INCIDENTES')}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: activeAlertTab === 'INCIDENTES' ? 'var(--color-danger)' : 'transparent',
                    color: activeAlertTab === 'INCIDENTES' ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <span>🚨 Siniestros</span>
                  {activeIncidents.length > 0 && (
                    <span style={{ backgroundColor: 'rgba(255,255,255,0.3)', padding: '1px 5px', borderRadius: '10px', fontSize: '0.65rem' }}>
                      {activeIncidents.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAlertTab('DOCUMENTOS')}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: activeAlertTab === 'DOCUMENTOS' ? 'var(--primary)' : 'transparent',
                    color: activeAlertTab === 'DOCUMENTOS' ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <span>📑 Documentos</span>
                  {docAlerts.length > 0 && (
                    <span style={{ backgroundColor: 'rgba(255,255,255,0.3)', padding: '1px 5px', borderRadius: '10px', fontSize: '0.65rem' }}>
                      {docAlerts.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAlertTab('MANTENIMIENTO')}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.25rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: activeAlertTab === 'MANTENIMIENTO' ? '#f59e0b' : 'transparent',
                    color: activeAlertTab === 'MANTENIMIENTO' ? '#000' : 'var(--text-secondary)',
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <span>🔧 Por Km</span>
                  {allAlerts.length > 0 && (
                    <span style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '1px 5px', borderRadius: '10px', fontSize: '0.65rem', color: '#fff' }}>
                      {allAlerts.length}
                    </span>
                  )}
                </button>
              </div>

              {/* TAB 1: Siniestros y Fallas reportadas por conductores */}
              {activeAlertTab === 'INCIDENTES' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto', maxHeight: '430px', paddingRight: '0.25rem' }}>
                  {activeIncidents.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                        ✔
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>Flota sin incidentes en ruta</div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No hay fallas mecánicas ni accidentes pendientes reportados por conductores.</p>
                    </div>
                  ) : (
                    activeIncidents.map((inc) => (
                      <div 
                        key={inc.id}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'rgba(239, 68, 68, 0.05)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderLeft: '4px solid var(--color-danger)',
                          fontSize: '0.82rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 800, color: '#fca5a5', fontSize: '0.88rem' }}>
                            Móvil #{inc.vehiculoId} · {inc.patente}
                          </span>
                          <span className={`badge ${inc.gravedad && inc.gravedad.includes('URGENTE') ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.62rem' }}>
                            {inc.gravedad ? inc.gravedad.split(' ')[0] : 'ALTA'}
                          </span>
                        </div>

                        <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {inc.tipoEvento} - {inc.vehiculoNombre}
                        </div>

                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>
                          "{inc.descripcion}"
                        </p>

                        {/* Metadata del Reporte: Conductor, fecha y hora */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                          <div>👤 <strong>{inc.conductorNombre}</strong></div>
                          <div>⏱️ {inc.fechaHoraStr || (inc.timestamp ? new Date(inc.timestamp).toLocaleString('es-CL') : 'Reciente')}</div>
                        </div>

                        {/* Acciones y Foto */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', alignItems: 'center' }}>
                          {inc.foto ? (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.75rem', padding: '0.35rem' }}
                              onClick={() => setSelectedIncidentModal(inc)}
                            >
                              <Camera size={14} color="var(--primary)" />
                              <span>Ver Foto Evidencia</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', flex: 1 }}>
                              Sin foto adjunta
                            </span>
                          )}

                          <button
                            type="button"
                            className="btn btn-success btn-sm"
                            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.75rem', padding: '0.35rem' }}
                            onClick={() => handleResolveIncident(inc.id)}
                            title="Marcar como atendido por el taller"
                          >
                            <Check size={14} />
                            <span>Atender en Taller</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: Vencimiento de Documentación Legal (PRT, SOAP, Permiso, Padrón) */}
              {activeAlertTab === 'DOCUMENTOS' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '430px', paddingRight: '0.25rem' }}>
                  {docAlerts.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                        <FileCheck size={20} />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>Documentación al día</div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Padrón, PRT, Permiso de Circulación y SOAP vigentes en toda la flota.</p>
                    </div>
                  ) : (
                    docAlerts.map((doc, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: doc.estado === 'vencido' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                          border: `1px solid ${doc.estado === 'vencido' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                          borderLeft: `4px solid ${doc.color}`,
                          fontSize: '0.82rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.3rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            Móvil #{doc.vehicleId} · {doc.patente}
                          </span>
                          <span className={`badge ${doc.estado === 'vencido' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.62rem' }}>
                            {doc.label}
                          </span>
                        </div>
                        <div style={{ color: doc.color, fontWeight: 600 }}>
                          {doc.tipoDoc}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span>Vencimiento: {doc.vencimiento}</span>
                          <Link to={`/vehiculos?select=${doc.vehicleId}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                            Regularizar ➔
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: Mantenciones por Kilometraje */}
              {activeAlertTab === 'MANTENIMIENTO' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '430px', paddingRight: '0.25rem' }}>
                  {allAlerts.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto' }}>
                        <Wrench size={20} />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>Pautas mecánicas al día</div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No hay mantenciones de aceite o pastillas vencidas por odómetro.</p>
                    </div>
                  ) : (
                    allAlerts.map((alert, index) => (
                      <div 
                        key={index} 
                        style={{ 
                          padding: '0.85rem 1rem', 
                          borderRadius: 'var(--radius-md)', 
                          backgroundColor: 'rgba(239, 68, 68, 0.04)', 
                          border: '1px solid rgba(239, 68, 68, 0.15)',
                          borderLeft: '4px solid var(--color-danger)',
                          fontSize: '0.82rem'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: '0.2rem' }}>
                          {alert.vehicleName}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                          {alert.text}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Link to="/mantenimientos" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                            Ingresar Orden de Taller ➔
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>

          </div>
        </>
      )}

      {/* Modal / Lightbox Detalle de Incidente & Fotografía en Gran Tamaño */}
      {selectedIncidentModal && (
        <div className="modal-overlay" onClick={() => setSelectedIncidentModal(null)} style={{ zIndex: 1200 }}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '92%', maxHeight: '90vh', overflowY: 'auto', animation: 'scaleUp 0.25s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.3rem' }}>📸</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Evidencia Fotográfica de Siniestro / Falla
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedIncidentModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            {/* Foto del evento */}
            {selectedIncidentModal.foto && (
              <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '1rem', maxHeight: '320px', backgroundColor: '#000', display: 'flex', justifyContent: 'center' }}>
                <img 
                  src={selectedIncidentModal.foto} 
                  alt="Evidencia fotográfica" 
                  style={{ maxWidth: '100%', maxHeight: '320px', objectFit: 'contain' }} 
                />
              </div>
            )}

            {/* Ficha del reporte */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.8rem', marginBottom: '1rem' }}>
              <div>🚗 <strong>Móvil #{selectedIncidentModal.vehiculoId}</strong>: {selectedIncidentModal.vehiculoNombre}</div>
              <div>🏷️ Patente: <strong>{selectedIncidentModal.patente}</strong></div>
              <div>👤 Conductor: <strong>{selectedIncidentModal.conductorNombre}</strong></div>
              <div>⏱️ Fecha: <strong>{selectedIncidentModal.fechaHoraStr}</strong></div>
              <div>⚡ Gravedad: <span className="badge badge-danger" style={{ fontSize: '0.62rem' }}>{selectedIncidentModal.gravedad}</span></div>
              <div>🔧 Tipo: <strong>{selectedIncidentModal.tipoEvento}</strong></div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Descripción del Conductor:</span>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                "{selectedIncidentModal.descripcion}"
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setSelectedIncidentModal(null)}
              >
                Cerrar
              </button>
              <button 
                type="button" 
                className="btn btn-success" 
                onClick={() => handleResolveIncident(selectedIncidentModal.id)}
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Check size={16} />
                <span>Marcar como Atendido en Taller</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Messages */}
      {toast && (
        <div className="toast-container">
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        </div>
      )}

      <style>{`
        .dashboard-grid {
          grid-template-columns: 2fr 1fr;
        }

        @media (max-width: 992px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
