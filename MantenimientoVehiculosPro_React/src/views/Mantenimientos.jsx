import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Car,
  Wrench, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  Calendar, 
  Milestone, 
  AlertCircle,
  FileImage, 
  X,
  FileText
} from 'lucide-react';
import Toast from '../components/Toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Mantenimientos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlVehicleId = searchParams.get('vehiculoId');

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  
  const [maintenances, setMaintenances] = useState([]);

  const exportToExcel = () => {
    if (maintenances.length === 0) return;
    const dataToExport = maintenances.map(m => ({
      ID: m.id,
      Tipo: m.tipo,
      Descripción: m.descripcion,
      Fecha: m.fecha,
      Kilometraje: `${m.kilometraje} km`,
      Costo: m.costo,
      Estado: m.estado,
      Latitud: m.latitud || 'N/A',
      Longitud: m.longitud || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historial");
    XLSX.writeFile(workbook, `reporte_mantenimiento_${selectedVehicle?.patente || 'flota'}.xlsx`);
  };

  const exportToPDF = () => {
    if (maintenances.length === 0) return;
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Reporte de Mantenimiento VehículosPro", 14, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Vehículo: ${selectedVehicle?.patente || 'Todos'} (${selectedVehicle?.marca || ''} ${selectedVehicle?.modelo || ''})`, 14, 30);
    doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString('es-CL')}`, 14, 35);
    
    const tableColumn = ["Tipo", "Descripción", "Fecha", "Kilometraje", "Costo", "Estado"];
    const tableRows = [];

    maintenances.forEach(m => {
      const maintenanceData = [
        m.tipo,
        m.descripcion,
        m.fecha,
        `${m.kilometraje} km`,
        formatCurrency(m.costo),
        m.estado
      ];
      tableRows.push(maintenanceData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 42,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`reporte_mantenimiento_${selectedVehicle?.patente || 'flota'}.pdf`);
  };
  const [groupedMaintenances, setGroupedMaintenances] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [recommendations, setRecommendations] = useState([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [formTipo, setFormTipo] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0]);
  const [formKilometraje, setFormKilometraje] = useState('');
  const [formEstado, setFormEstado] = useState('REALIZADO');
  const [formCosto, setFormCosto] = useState('');
  const [formFacturaImagen, setFormFacturaImagen] = useState('');
  
  // Toast
  const [toast, setToast] = useState(null);

  // Cargar vehículos
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        let list = [];
        if (user?.role === 'ADMIN' || user?.role === 'MECANICO') {
          list = await api.getTodosLosVehiculos();
        } else {
          list = await api.getVehiculosPorUsuario(user.id);
        }
        setVehicles(list);

        if (list.length > 0) {
          // Si hay un ID en la URL, seleccionar ese, si no el primero
          const matched = list.find(v => v.id === Number(urlVehicleId));
          setSelectedVehicle(matched || list[0]);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error("Error al cargar vehículos:", e);
        setToast({ message: 'No se pudo cargar la lista de vehículos.', type: 'error' });
        setLoading(false);
      }
    };
    fetchVehicles();
  }, [user.id, user.role, urlVehicleId]);

  // Cargar recomendaciones globales
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const list = await api.getRecomendaciones();
        setRecommendations(list);
      } catch (e) {
        console.error("Error al cargar recomendaciones:", e);
      }
    };
    fetchRecommendations();
  }, []);

  // Cargar mantenimientos del vehículo seleccionado
  const fetchMaintenances = useCallback(async () => {
    if (!selectedVehicle) return;
    setLoading(true);
    try {
      const list = await api.getMantenimientosPorVehiculo(selectedVehicle.id);
      setMaintenances(list);

      // Agrupar por tipo
      const grouped = list.reduce((acc, m) => {
        const key = m.tipo || 'General';
        if (!acc[key]) acc[key] = [];
        acc[key].push(m);
        return acc;
      }, {});

      // Ordenar mantenimientos de cada grupo por kilometraje desc
      Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => b.kilometraje - a.kilometraje);
      });

      setGroupedMaintenances(grouped);

      // Auto expandir todos por defecto si hay cambios de vehículo
      const expandMap = {};
      Object.keys(grouped).forEach(key => {
        expandMap[key] = true;
      });
      setExpandedGroups(expandMap);
    } catch (e) {
      console.error("Error al cargar mantenimientos:", e);
      setToast({ message: 'Error al recuperar historial de mantenimientos.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedVehicle]);

  useEffect(() => {
    fetchMaintenances();
  }, [fetchMaintenances]);

  // Toggle Accordion Group
  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Convertir imagen a Base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // Límite de 2MB
      setToast({ message: 'La imagen no debe superar los 2MB de tamaño.', type: 'error' });
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormFacturaImagen(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Abrir Modal de Creación
  const handleOpenCreateModal = (presetTipo = '') => {
    setModalType('create');
    setEditingId(null);
    setFormTipo(presetTipo);
    setFormDescripcion('');
    setFormFecha(new Date().toISOString().split('T')[0]);
    setFormKilometraje(selectedVehicle ? selectedVehicle.kilometraje : '');
    setFormEstado('REALIZADO');
    setFormCosto('');
    setFormFacturaImagen('');
    setShowModal(true);
  };

  // Abrir Modal de Edición
  const handleOpenEditModal = (m) => {
    setModalType('edit');
    setEditingId(m.id);
    setFormTipo(m.tipo);
    setFormDescripcion(m.descripcion || '');
    setFormFecha(m.fecha || '');
    setFormKilometraje(m.kilometraje);
    setFormEstado(m.estado);
    setFormCosto(m.costo || '');
    setFormFacturaImagen(m.facturaImagen || '');
    setShowModal(true);
  };

  // Guardar Mantenimiento
  const handleSaveMaintenance = async (e) => {
    e.preventDefault();

    if (!formTipo || !formFecha || !formKilometraje || !formEstado) {
      setToast({ message: 'Por favor complete todos los campos requeridos.', type: 'error' });
      return;
    }

    // Validaciones
    if (formCosto !== '' && Number(formCosto) < 0) {
      setToast({ message: 'El costo no puede ser negativo.', type: 'error' });
      return;
    }

    if (new Date(formFecha) > new Date()) {
      setToast({ message: 'La fecha no puede ser futura.', type: 'error' });
      return;
    }

    // Validación del kilometraje con respecto al anterior del mismo tipo
    const mismoTipo = groupedMaintenances[formTipo] || [];
    const ultimo = mismoTipo
      .filter(m => modalType === 'create' || m.id !== editingId)
      .reduce((max, curr) => curr.kilometraje > max ? curr.kilometraje : max, 0);

    if (parseInt(formKilometraje) < ultimo) {
      setToast({ message: `El kilometraje debe ser mayor o igual al anterior de este tipo (${ultimo} km).`, type: 'error' });
      return;
    }

    const payload = {
      tipo: formTipo,
      descripcion: formDescripcion,
      fecha: formFecha,
      kilometraje: parseInt(formKilometraje),
      estado: formEstado,
      costo: formCosto !== '' ? parseFloat(formCosto) : null,
      facturaImagen: formFacturaImagen || null,
      vehiculoId: selectedVehicle.id
    };

    try {
      if (modalType === 'create') {
        await api.crearMantenimiento(selectedVehicle.id, payload);
        setToast({ message: 'Mantenimiento registrado con éxito.', type: 'success' });
      } else {
        await api.actualizarMantenimiento(editingId, payload);
        setToast({ message: 'Mantenimiento actualizado con éxito.', type: 'success' });
      }
      setShowModal(false);
      fetchMaintenances();
      
      // Actualizar kilometraje del vehículo si el nuevo mantenimiento es mayor
      if (parseInt(formKilometraje) > selectedVehicle.kilometraje) {
        await api.actualizarVehiculo(selectedVehicle.id, {
          ...selectedVehicle,
          kilometraje: parseInt(formKilometraje),
          propietarioId: selectedVehicle.propietarioId || user?.id || 1
        });
        // Recargar datos de vehículos de fondo
        let updatedList = [];
        if (user?.role === 'ADMIN' || user?.role === 'MECANICO') {
          updatedList = await api.getTodosLosVehiculos();
        } else {
          updatedList = await api.getVehiculosPorUsuario(user.id);
        }
        setVehicles(updatedList);
        const updatedMatch = updatedList.find(v => v.id === selectedVehicle.id);
        if (updatedMatch) setSelectedVehicle(updatedMatch);
      }
    } catch (e) {
      console.error("Error al guardar mantenimiento:", e);
      setToast({ message: e.message || 'Error al guardar el mantenimiento.', type: 'error' });
    }
  };

  // Eliminar Mantenimiento
  const handleDelete = async (id) => {
    if (!window.confirm('¿Desea eliminar de forma permanente este registro de mantenimiento?')) {
      return;
    }
    try {
      await api.eliminarMantenimiento(id);
      setToast({ message: 'Registro de mantenimiento eliminado.', type: 'success' });
      fetchMaintenances();
    } catch (e) {
      console.error("Error al eliminar mantenimiento:", e);
      setToast({ message: 'No se pudo eliminar el registro.', type: 'error' });
    }
  };

  const getBadgeClass = (estado) => {
    if (estado === 'REALIZADO') return 'badge-success';
    if (estado === 'PROXIMO') return 'badge-warning';
    return 'badge-danger';
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '$0';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Header */}
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
            Historial de Mantenimientos
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Registro detallado de repuestos, costos e intervenciones
          </p>
        </div>

        {vehicles.length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Selector de Vehículo con Patente destacada */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                flexWrap: 'wrap'
              }}
            >
              <Car size={18} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Vehículo:</span>
              <select 
                className="form-input form-select"
                style={{ 
                  minWidth: '240px', 
                  maxWidth: '100%',
                  width: 'auto',
                  padding: '0.4rem 2rem 0.4rem 0.75rem', 
                  fontSize: '0.85rem',
                  margin: 0,
                  border: 'none',
                  background: 'rgba(0,0,0,0.2)',
                  fontWeight: 600
                }}
                value={selectedVehicle?.id || ''}
                onChange={(e) => {
                  const found = vehicles.find(v => v.id === Number(e.target.value));
                  if (found) setSelectedVehicle(found);
                }}
              >
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.marca} {v.modelo} · [{v.patente || 'Sin Patente'}]{v.anio ? ` (${v.anio})` : ''}
                  </option>
                ))}
              </select>

              {selectedVehicle && (
                <span 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em'
                  }}
                  title="Patente del vehículo seleccionado"
                >
                  🏷️ {selectedVehicle.patente || 'Sin Patente'}
                </span>
              )}
            </div>

            {maintenances.length > 0 && (
              <>
                <button 
                  className="btn btn-secondary" 
                  onClick={exportToExcel}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FileText size={18} color="#10b981" />
                  <span>Excel</span>
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={exportToPDF}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FileText size={18} color="#ef4444" />
                  <span>PDF</span>
                </button>
              </>
            )}

            <button 
              className="btn btn-primary" 
              onClick={() => handleOpenCreateModal()}
              disabled={!selectedVehicle}
            >
              <Plus size={18} />
              <span>Registrar Mantención</span>
            </button>
          </div>
        )}
      </div>

      {vehicles.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
          <AlertCircle size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No tiene vehículos registrados</h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Primero registre un vehículo para poder gestionar sus mantenimientos.
          </p>
          <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/vehiculos')}>
            Ir a Vehículos
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1.5rem' }} className="mants-layout">
          
          {/* Left panel: Accordions */}
          <div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : Object.keys(groupedMaintenances).length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <Wrench size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <h3>Historial Limpio</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Aún no hay registros de mantenimiento para este vehículo{selectedVehicle ? ` (${selectedVehicle.marca} ${selectedVehicle.modelo} · ${selectedVehicle.patente || 'Sin Patente'})` : ''}.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.keys(groupedMaintenances).map((tipoKey) => {
                  const items = groupedMaintenances[tipoKey];
                  const isExpanded = !!expandedGroups[tipoKey];
                  
                  return (
                    <div 
                      key={tipoKey} 
                      className="glass-card" 
                      style={{ 
                        padding: 0, 
                        overflow: 'hidden',
                        border: '1px solid var(--border-color)' 
                      }}
                    >
                      {/* Accordion Header */}
                      <div 
                        onClick={() => toggleGroup(tipoKey)}
                        className="accordion-header"
                        style={{ 
                          padding: '1.25rem 1.5rem', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          cursor: 'pointer',
                          backgroundColor: 'rgba(255,255,255,0.02)',
                          userSelect: 'none',
                          borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div style={{ padding: '0.5rem', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>
                            <Wrench size={18} />
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{tipoKey}</span>
                            <span style={{ marginLeft: '0.75rem', fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                              {items.length} {items.length === 1 ? 'registro' : 'registros'}
                            </span>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="accordion-body" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                          {items.map((m) => (
                            <div 
                              key={m.id} 
                              style={{ 
                                padding: '1rem', 
                                border: '1px solid rgba(255,255,255,0.05)', 
                                borderRadius: 'var(--radius-md)', 
                                backgroundColor: 'rgba(255,255,255,0.01)',
                                position: 'relative'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span className={`badge ${getBadgeClass(m.estado)}`}>
                                    {m.estado}
                                  </span>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Calendar size={14} /> {m.fecha}
                                  </span>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Milestone size={14} /> {(m.kilometraje ?? 0).toLocaleString()} km
                                  </span>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button 
                                    className="btn btn-secondary btn-sm" 
                                    style={{ padding: '0.35rem' }} 
                                    onClick={() => handleOpenEditModal(m)}
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                  <button 
                                    className="btn btn-secondary btn-sm" 
                                    style={{ padding: '0.35rem', color: 'var(--color-danger)' }} 
                                    onClick={() => handleDelete(m.id)}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              {/* Descripcion */}
                              {m.descripcion && (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                                  {m.descripcion}
                                </p>
                              )}

                              {/* Evidencias fotográficas, sonoras y GPS */}
                              {(m.evidenciaFotoUrl || m.audioUrl || (m.latitud && m.longitud)) && (
                                <div style={{ 
                                  display: 'flex', 
                                  flexDirection: 'column',
                                  gap: '0.75rem',
                                  marginBottom: '0.75rem',
                                  padding: '0.75rem',
                                  borderRadius: 'var(--radius-sm)',
                                  backgroundColor: 'rgba(255,255,255,0.01)',
                                  border: '1px solid var(--border-color)'
                                }}>
                                  {m.evidenciaFotoUrl && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Evidencia Fotográfica:</span>
                                      <a href={m.evidenciaFotoUrl} target="_blank" rel="noreferrer">
                                        <img 
                                          src={m.evidenciaFotoUrl} 
                                          alt="Evidencia fotográfica" 
                                          style={{ 
                                            maxWidth: '100%', 
                                            maxHeight: '120px', 
                                            objectFit: 'cover', 
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--border-color)',
                                            cursor: 'pointer'
                                          }} 
                                        />
                                      </a>
                                    </div>
                                  )}
                                  
                                  {m.audioUrl && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Evidencia de Audio (Grabación de Ruido):</span>
                                      <audio 
                                        src={m.audioUrl} 
                                        controls 
                                        style={{ 
                                          width: '100%', 
                                          height: '32px',
                                          borderRadius: 'var(--radius-sm)'
                                        }} 
                                      />
                                    </div>
                                  )}

                                  {m.latitud && m.longitud && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Ubicación GPS de Registro:</span>
                                      <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', height: '180px', width: '100%' }}>
                                        <iframe 
                                          title="Ubicación GPS"
                                          width="100%" 
                                          height="100%" 
                                          frameBorder="0" 
                                          scrolling="no" 
                                          marginHeight="0" 
                                          marginWidth="0" 
                                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${m.longitud - 0.003}%2C${m.latitud - 0.003}%2C${m.longitud + 0.003}%2C${m.latitud + 0.003}&layer=mapnik&marker=${m.latitud}%2C${m.longitud}`}
                                        />
                                      </div>
                                      <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${m.latitud},${m.longitud}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500, display: 'inline-block', marginTop: '0.2rem' }}
                                      >
                                        Ver en Google Maps
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Costo & Factura */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                                  <DollarSign size={16} color="var(--color-success)" /> {formatCurrency(m.costo)}
                                </span>

                                {m.facturaImagen && (
                                  <a 
                                    href={m.facturaImagen} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '0.35rem', 
                                      fontSize: '0.8rem', 
                                      color: 'var(--primary)', 
                                      textDecoration: 'none',
                                      fontWeight: 500,
                                      border: '1px solid rgba(59,130,246,0.2)',
                                      padding: '0.2rem 0.5rem',
                                      borderRadius: 'var(--radius-sm)',
                                      backgroundColor: 'rgba(59,130,246,0.05)'
                                    }}
                                  >
                                    <FileImage size={14} />
                                    <span>Ver Factura</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right panel: Recommendations */}
          <div>
            <div className="glass-card" style={{ border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--primary)" />
                Intervalos Sugeridos
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '550px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                {recommendations.map((rec) => (
                  <div 
                    key={rec.id} 
                    style={{ 
                      padding: '0.85rem', 
                      borderRadius: 'var(--radius-md)', 
                      backgroundColor: 'rgba(255,255,255,0.01)', 
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{rec.tipo}</span>
                      <button 
                        onClick={() => handleOpenCreateModal(rec.tipo)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        + Registrar
                      </button>
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', fontWeight: 500, marginBottom: '0.5rem' }}>
                      Cada {(rec.minKm ?? rec.intervaloKmMin ?? 0).toLocaleString()} - {(rec.maxKm ?? rec.intervaloKmMax ?? 0).toLocaleString()} km
                    </div>
                    
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      {rec.consejo || rec.descripcion || ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>
                  {modalType === 'create' ? 'Registrar Mantenimiento' : 'Editar Registro'}
                </h2>
                {selectedVehicle && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    <span>🚗 <strong>{selectedVehicle.marca} {selectedVehicle.modelo}</strong></span>
                    <span 
                      style={{
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.05em'
                      }}
                    >
                      🏷️ {selectedVehicle.patente || 'Sin Patente'}
                    </span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMaintenance}>
              
              {/* Tipo */}
              <div className="form-group">
                <label className="form-label">Tipo de Mantención</label>
                <select 
                  className="form-input form-select"
                  value={formTipo}
                  onChange={(e) => setFormTipo(e.target.value)}
                  required
                >
                  <option value="">Seleccione una categoría</option>
                  <option value="Cambio de aceite">Cambio de aceite</option>
                  <option value="Revisión de frenos">Revisión de frenos</option>
                  <option value="Cambio de batería">Cambio de batería</option>
                  <option value="Revisión de neumáticos">Revisión de neumáticos</option>
                  <option value="Cambio de bujías">Cambio de bujías</option>
                  <option value="Revisión de suspensión">Revisión de suspensión</option>
                  <option value="Cambio de filtro de aire">Cambio de filtro de aire</option>
                  <option value="Limpieza de inyectores">Limpieza de inyectores</option>
                  <option value="Otro">Otro (General)</option>
                </select>
                {formTipo === 'Otro' && (
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Escriba el tipo de mantenimiento" 
                    style={{ marginTop: '0.5rem' }}
                    onChange={(e) => setFormTipo(e.target.value)} 
                    required 
                  />
                )}
              </div>

              {/* Descripcion */}
              <div className="form-group">
                <label className="form-label">Descripción / Notas</label>
                <textarea 
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="Detalle los repuestos utilizados o comentarios adicionales"
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                />
              </div>

              <div className="form-grid-2">
                {/* Fecha */}
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={formFecha}
                    onChange={(e) => setFormFecha(e.target.value)}
                    required
                  />
                </div>

                {/* Kilometraje */}
                <div className="form-group">
                  <label className="form-label">Kilometraje registrado (km)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    min="0"
                    placeholder="Ej. 45000"
                    value={formKilometraje}
                    onChange={(e) => setFormKilometraje(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                {/* Estado */}
                <div className="form-group">
                  <label className="form-label">Estado de la Mantención</label>
                  <select 
                    className="form-input form-select"
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value)}
                    required
                  >
                    <option value="REALIZADO">REALIZADO (Completado)</option>
                    <option value="PROXIMO">PROXIMO (Planificado)</option>
                    <option value="ATRASADO">ATRASADO (Vencido)</option>
                  </select>
                </div>

                {/* Costo */}
                <div className="form-group">
                  <label className="form-label">Costo ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    min="0"
                    placeholder="Valor total"
                    value={formCosto}
                    onChange={(e) => setFormCosto(e.target.value)}
                  />
                </div>
              </div>

              {/* Imagen Factura/Boleta */}
              <div className="form-group">
                <label className="form-label">Imagen de la Factura o Comprobante</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ fontSize: '0.85rem' }}
                  />
                  {formFacturaImagen && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', padding: '0.5rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                      <img src={formFacturaImagen} alt="Factura Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>Cargada correctamente</span>
                      <button 
                        type="button" 
                        onClick={() => setFormFacturaImagen('')}
                        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalType === 'create' ? 'Registrar' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
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
        .mants-layout {
          grid-template-columns: 3fr 1fr;
        }

        @media (max-width: 992px) {
          .mants-layout {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .accordion-header {
            padding: 1rem 0.85rem !important;
          }
          .accordion-body {
            padding: 1rem 0.85rem !important;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};

export default Mantenimientos;
