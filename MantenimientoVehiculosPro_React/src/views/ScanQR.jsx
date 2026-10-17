import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import jsQR from 'jsqr';
import { 
  QrCode, 
  Search, 
  Car, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Phone, 
  Mail,
  Camera,
  Image,
  RefreshCw,
  StopCircle,
  FileCheck,
  Clock,
  Gauge,
  Fuel,
  Sparkles,
  CheckSquare,
  AlertCircle,
  Check,
  Video,
  Navigation,
  Radio,
  MapPin,
  History,
  FileText,
  Zap
} from 'lucide-react';
import Toast from '../components/Toast';
import DocumentModal from '../components/DocumentModal';
import DocumentosVehiculoSection from '../components/DocumentosVehiculoSection';
import { calculateHaversineDistanceKm } from '../services/routingService';

const ScanQR = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isMecanico = user?.role === 'MECANICO';
  const [driversList, setDriversList] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  const [qrText, setQrText] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [toast, setToast] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Estados de Turno / Check-in / Check-out
  const [activeShift, setActiveShift] = useState(null);
  const [showStartShiftModal, setShowStartShiftModal] = useState(false);
  const [showEndShiftModal, setShowEndShiftModal] = useState(false);
  const [shiftKmInicial, setShiftKmInicial] = useState('');
  const [isOdometerBroken, setIsOdometerBroken] = useState(false);
  const [shiftCombustibleInicial, setShiftCombustibleInicial] = useState('100% (Lleno)');
  const [checklist, setChecklist] = useState({ luces: true, neumaticos: true, frenos: true, carroceria: true });
  const [shiftNotasInicial, setShiftNotasInicial] = useState('');
  const [shiftKmFinal, setShiftKmFinal] = useState('');
  const [shiftCombustibleFinal, setShiftCombustibleFinal] = useState('75% (3/4)');
  const [shiftNotasFinal, setShiftNotasFinal] = useState('');
  const [shiftFallasDetectadas, setShiftFallasDetectadas] = useState('');
  const [submittingShift, setSubmittingShift] = useState(false);

  // Estados de Reporte de Falla / Accidente con Fotografía
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentTipo, setIncidentTipo] = useState('Falla Mecánica');
  const [incidentGravedad, setIncidentGravedad] = useState('URGENTE / ACCIDENTE');
  const [incidentDescripcion, setIncidentDescripcion] = useState('');
  const [incidentFoto, setIncidentFoto] = useState(null);
  const [compressingIncidentFoto, setCompressingIncidentFoto] = useState(false);
  const [submittingIncident, setSubmittingIncident] = useState(false);
  const incidentCameraRef = useRef(null);
  const incidentGalleryRef = useRef(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const [torchActive, setTorchActive] = useState(false);
  const fileInputRef = useRef(null);
  const captureCameraRef = useRef(null);

  // Odómetro Virtual GPS en tiempo real durante la jornada (Modo Reparto)
  const gpsWatchIdRef = useRef(null);
  const lastGpsCoordsRef = useRef(null);
  const [liveGpsStats, setLiveGpsStats] = useState({
    speed: 0,
    accuracy: null,
    pointsCount: 0,
    isTracking: false
  });

  // Historial de Conducción del Conductor
  const [driverHistory, setDriverHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('TODOS');

  const loadDriverHistory = useCallback(async () => {
    if (!user?.id) return;
    setLoadingHistory(true);
    try {
      let serverRecords = [];
      try {
        serverRecords = await api.getHistorialTurnosConductor(user.id);
      } catch (err) {
        console.warn("Aviso al consultar historial de turnos en backend:", err);
      }

      let localRecords = [];
      try {
        const saved = localStorage.getItem('vehiculospro_historial_jornadas');
        if (saved) {
          const parsed = JSON.parse(saved);
          localRecords = Array.isArray(parsed) ? parsed.filter(p => String(p.conductorId) === String(user.id)) : [];
        }
      } catch (e) {}

      const mappedServer = Array.isArray(serverRecords) ? serverRecords.map(t => {
        const inicioDate = t.fechaHoraInicio ? new Date(t.fechaHoraInicio) : null;
        const finDate = t.fechaHoraFin ? new Date(t.fechaHoraFin) : null;
        let duracionTexto = 'En curso';
        if (inicioDate && finDate) {
          const duracionMin = Math.max(1, Math.round((finDate.getTime() - inicioDate.getTime()) / 60000));
          const horas = Math.floor(duracionMin / 60);
          const minutos = duracionMin % 60;
          duracionTexto = horas > 0 ? `${horas}h ${minutos}m` : `${minutos} min`;
        }
        const kmRec = (t.kmFin && t.kmInicio) ? Math.max(0, t.kmFin - t.kmInicio) : Math.round(t.kmGpsRecorridos || 0);

        return {
          id: t.id,
          vehiculoId: t.vehiculoId,
          vehiculoNombre: `${t.vehiculoMarca || ''} ${t.vehiculoModelo || ''}`.trim() || 'Vehículo de Flota',
          patente: t.vehiculoPatente || 'S/P',
          conductorId: t.conductorId,
          conductorNombre: t.conductorNombre || user?.fullName || 'Conductor',
          cerradoPor: t.cerradoPorNombre || 'Sistema',
          esCierreAdministrativo: t.esCierreAdministrativo || false,
          fechaInicioStr: inicioDate ? inicioDate.toLocaleString('es-CL') : 'S/F',
          fechaFinStr: finDate ? finDate.toLocaleString('es-CL') : (t.estado === 'EN_RUTA' ? '🟢 En Ruta' : 'S/F'),
          duracion: duracionTexto,
          kmInicial: t.kmInicio || 0,
          kmFinal: t.kmFin || t.kmInicio || 0,
          kmRecorridos: kmRec,
          kmGpsExacto: t.kmGpsRecorridos || 0,
          odometroAveriado: !!(t.kmGpsRecorridos && (!t.kmFin || t.kmFin === t.kmInicio)),
          combustibleFinal: 'Estándar',
          estado: t.estado || 'FINALIZADO',
          notas: t.observaciones || 'Turno completado sin novedades'
        };
      }) : [];

      const seenIds = new Set();
      const combined = [];
      for (const item of [...mappedServer, ...localRecords]) {
        const key = `${item.id}-${item.patente}`;
        if (!seenIds.has(key)) {
          seenIds.add(key);
          combined.push(item);
        }
      }

      setDriverHistory(combined);
    } catch (e) {
      console.error("Error al cargar historial del conductor:", e);
    } finally {
      setLoadingHistory(false);
    }
  }, [user?.id, user?.fullName]);

  // Cargar una lista de códigos rápidos para facilitar la demostración y sincronizar turno activo
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vehiculospro_jornada_activa');
      if (saved) {
        const parsed = JSON.parse(saved);
        setActiveShift(parsed);
      }
    } catch (e) {}

    // Sincronizar turno activo desde MySQL si el chofer tiene sesión iniciada
    if (user?.id) {
      api.getTurnoActivoConductor(user.id).then(serverTurno => {
        if (serverTurno && serverTurno.id) {
          setActiveShift(prev => {
            if (prev && prev.backendTurnoId === serverTurno.id) return prev;
            const restored = {
              id: serverTurno.id,
              backendTurnoId: serverTurno.id,
              vehiculoId: serverTurno.vehiculoId,
              vehiculoNombre: `${serverTurno.vehiculoMarca || ''} ${serverTurno.vehiculoModelo || ''}`.trim() || 'Vehículo de Flota',
              patente: serverTurno.vehiculoPatente || 'S/P',
              conductorId: serverTurno.conductorId,
              conductorNombre: serverTurno.conductorNombre || 'Conductor',
              iniciadoPor: serverTurno.iniciadoPorNombre || 'Sistema',
              esDespachoAdministrativo: serverTurno.esCierreAdministrativo || false,
              kmInicial: serverTurno.kmInicio,
              kmGpsAcumulados: serverTurno.kmGpsRecorridos || 0,
              puntosGpsCount: 0,
              velocidadActual: 0,
              combustibleInicial: '100% (Lleno)',
              notasInicial: serverTurno.observaciones || 'Turno activo en servidor',
              odometroAveriado: false,
              checklist: { luces: true, neumaticos: true, frenos: true, carroceria: true },
              inicioTimestamp: serverTurno.fechaHoraInicio || new Date().toISOString(),
              fechaInicioStr: serverTurno.fechaHoraInicio ? new Date(serverTurno.fechaHoraInicio).toLocaleString('es-CL') : new Date().toLocaleString('es-CL')
            };
            localStorage.setItem('vehiculospro_jornada_activa', JSON.stringify(restored));
            return restored;
          });
        }
      }).catch(() => {});
    }

    const loadDemoQrs = async () => {
      try {
        const list = await api.getTodosLosVehiculos();
        setAvailableVehicles(list.map(v => ({
          qrCode: v.qrCode || `VEHICULO:${v.id}`,
          label: `${v.marca} ${v.modelo} [Patente: ${v.patente || 'S/P'}]`
        })));
      } catch (e) {
        console.error("Error al cargar vehículos:", e);
      }
    };

    const loadDrivers = async () => {
      try {
        const users = await api.getUsuarios();
        if (Array.isArray(users)) {
          setDriversList(users);
        }
      } catch (err) {
        console.warn("Aviso al cargar usuarios para despacho:", err);
      }
    };

    loadDemoQrs();
    loadDrivers();
    loadDriverHistory();
  }, [user?.id, loadDriverHistory]);


  // Rastreo continuo por GPS (WatchPosition) para calcular odómetro punto a punto
  useEffect(() => {
    if (!activeShift) {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
      lastGpsCoordsRef.current = null;
      setLiveGpsStats(prev => ({ ...prev, isTracking: false, speed: 0 }));
      return;
    }

    if (!('geolocation' in navigator)) {
      console.warn("Geolocalización no soportada en este navegador.");
      return;
    }

    setLiveGpsStats(prev => ({ ...prev, isTracking: true }));

    gpsWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, accuracy } = pos.coords;
        const currentSpeedKmh = speed ? Math.round(speed * 3.6) : 0;

        let deltaKm = 0;
        if (lastGpsCoordsRef.current) {
          deltaKm = calculateHaversineDistanceKm(
            lastGpsCoordsRef.current.lat,
            lastGpsCoordsRef.current.lng,
            latitude,
            longitude
          );
        }

        // Filtro antirruido para reparto: ignorar vibraciones menores a 12 metros (0.012 km) o saltos satelitales anómalos (>2.5 km en 1 tick)
        const isSignificantMovement = deltaKm >= 0.012 && deltaKm < 2.5;

        setActiveShift(prevShift => {
          if (!prevShift) return null;
          const nuevoKm = isSignificantMovement
            ? Number(((prevShift.kmGpsAcumulados || 0) + deltaKm).toFixed(3))
            : (prevShift.kmGpsAcumulados || 0);

          const updated = {
            ...prevShift,
            kmGpsAcumulados: nuevoKm,
            velocidadActual: currentSpeedKmh,
            puntosGpsCount: (prevShift.puntosGpsCount || 0) + (isSignificantMovement ? 1 : 0),
            ultimoGps: { lat: latitude, lng: longitude, time: Date.now() }
          };

          localStorage.setItem('vehiculospro_jornada_activa', JSON.stringify(updated));
          return updated;
        });

        if (isSignificantMovement || !lastGpsCoordsRef.current) {
          lastGpsCoordsRef.current = { lat: latitude, lng: longitude };
        }

        setLiveGpsStats(prev => ({
          speed: currentSpeedKmh,
          accuracy: accuracy ? Math.round(accuracy) : null,
          pointsCount: prev.pointsCount + (isSignificantMovement ? 1 : 0),
          isTracking: true
        }));

        // Enviar telemetría al backend periódicamente si hay vehículo
        if (activeShift?.vehiculoId) {
          api.enviarTelemetriaGps({
            vehiculoId: activeShift.vehiculoId,
            patente: activeShift.patente,
            lat: latitude,
            lng: longitude,
            velocidad: currentSpeedKmh,
            rumbo: 0,
            odometro: (activeShift.kmInicial || 0) + Math.round(activeShift.kmGpsAcumulados || 0),
            satelites: 14
          }).catch(() => {});
        }
      },
      (err) => {
        console.warn("Aviso de geolocalización continua:", err);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );

    return () => {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
    };
  }, [activeShift?.id]);

  // Simular avance de recorrido GPS (+1.5 km) para pruebas de escritorio o demostración
  const handleSimulateGpsAdvance = (kmToAdd = 1.5) => {
    if (!activeShift) return;
    const nuevoKm = Number(((activeShift.kmGpsAcumulados || 0) + kmToAdd).toFixed(3));
    const updated = {
      ...activeShift,
      kmGpsAcumulados: nuevoKm,
      puntosGpsCount: (activeShift.puntosGpsCount || 0) + 1,
      velocidadActual: 42
    };
    setActiveShift(updated);
    localStorage.setItem('vehiculospro_jornada_activa', JSON.stringify(updated));
    setToast({
      message: `🛰️ Simulación de reparto: +${kmToAdd} km sumados por GPS. Total acumulado: +${nuevoKm.toFixed(2)} km.`,
      type: 'info'
    });
  };

  const handleScan = async (codeToSearch) => {
    const searchCode = (codeToSearch || qrText || '').trim();
    if (!searchCode) {
      setToast({ message: 'Por favor, ingrese o escanee un código QR.', type: 'warning' });
      return;
    }

    setSearching(true);
    setResult(null);
    setErrorMsg('');

    // Parsear ID
    let vehiculoId = null;
    if (searchCode.startsWith('VEHICULO:')) {
      vehiculoId = Number(searchCode.replace('VEHICULO:', ''));
    } else {
      vehiculoId = Number(searchCode);
    }

    if (isNaN(vehiculoId)) {
      setErrorMsg(`Formato de código QR inválido (${searchCode}). Debe ser: VEHICULO:{id} o un número.`);
      setSearching(false);
      return;
    }

    try {
      // 1. Obtener vehículo por ID
      const veh = await api.getVehiculoById(vehiculoId);
      
      // 2. Obtener propietario
      let owner = null;
      try {
        if (veh.propietarioId) {
          owner = await api.getUsuarioById(veh.propietarioId);
        }
      } catch (e) {
        console.error("Error al obtener propietario del vehículo:", e);
      }

      setResult({
        vehicle: veh,
        owner: owner
      });

      // Sincronizar estado de turno activo
      try {
        const savedShift = localStorage.getItem('vehiculospro_jornada_activa');
        setActiveShift(savedShift ? JSON.parse(savedShift) : null);
      } catch (err) {}

      setShiftKmInicial(veh.kilometraje || 0);
      setShiftKmFinal(veh.kilometraje || 0);
      if (veh.propietarioId) {
        setSelectedDriverId(String(veh.propietarioId));
      } else {
        setSelectedDriverId(String(user?.id || ''));
      }

      setToast({ message: `Vehículo ${veh.marca} ${veh.modelo} detectado exitosamente.`, type: 'success' });
    } catch (e) {
      console.error(e);
      setErrorMsg('Vehículo no encontrado en el sistema.');
      setToast({ message: 'Código QR no registrado en la base de datos.', type: 'error' });
    } finally {
      setSearching(false);
    }
  };

  // Confirmar inicio de turno (Check-in rápido)
  const handleConfirmStartShift = async () => {
    if (!result?.vehicle) return;
    const targetVeh = result.vehicle;

    if (targetVeh.activo === false) {
      setToast({ 
        message: `El vehículo ${targetVeh.patente} se encuentra APAGADO / FUERA DE SERVICIO por el Administrador. No es posible iniciar turno.`, 
        type: 'error' 
      });
      return;
    }

    const km = Number(shiftKmInicial);
    if (isNaN(km) || km < 0) {
      setToast({ message: 'Por favor ingrese un kilometraje inicial válido.', type: 'warning' });
      return;
    }

    if ((isAdmin || isMecanico) && (!selectedDriverId || selectedDriverId === 'NONE') && !targetVeh.propietarioId) {
      setToast({ message: 'Por favor asigne un conductor responsable para este vehículo antes de iniciar el turno.', type: 'warning' });
      return;
    }

    const targetDriver = (isAdmin || isMecanico) && selectedDriverId
      ? (driversList.find(d => String(d.id) === String(selectedDriverId)) || user)
      : (user || { id: targetVeh.propietarioId, fullName: targetVeh.propietarioNombre || 'Conductor' });

    if (!targetDriver || !targetDriver.id) {
      setToast({ message: 'El vehículo debe contar con un conductor asignado para registrar salida y actualizar odómetro.', type: 'warning' });
      return;
    }

    const esDespachoAdmin = (isAdmin || isMecanico) && targetDriver.id !== user?.id;

    setSubmittingShift(true);
    try {
      // 1. Persistir el turno formal en la tabla turnos_jornadas de MySQL (Backend)
      let backendTurno = null;
      try {
        backendTurno = await api.iniciarTurno({
          vehiculoId: targetVeh.id,
          conductorId: targetDriver.id,
          iniciadorId: user?.id,
          kmInicio: km,
          tipoSalida: isOdometerBroken ? 'REPARTO_DINAMICO_GPS' : 'ESTANDAR',
          observaciones: shiftNotasInicial || (
            esDespachoAdmin
              ? `[DESPACHO ADMINISTRATIVO]: Despachado por ${user?.fullName || user?.username} para el chofer ${targetDriver.fullName || targetDriver.username}.`
              : (isOdometerBroken ? 'Odómetro físico averiado (cálculo virtual GPS)' : 'Sin observaciones al inicio')
          )
        });
      } catch (tErr) {
        console.warn("Aviso al registrar turno en base de datos central:", tErr);
      }

      // 2. Sincronizar asignación y odómetro del vehículo en BD
      let updatedVeh = null;
      try {
        updatedVeh = await api.actualizarVehiculo(targetVeh.id, {
          ...targetVeh,
          propietarioId: targetDriver.id,
          kilometraje: km
        });
      } catch (apiErr) {
        console.warn("Aviso al sincronizar asignación en API backend:", apiErr);
      }

      const newShift = {
        id: backendTurno?.id || Date.now(),
        backendTurnoId: backendTurno?.id || null,
        vehiculoId: targetVeh.id,
        vehiculoNombre: `${targetVeh.marca} ${targetVeh.modelo}`,
        patente: targetVeh.patente || 'S/P',
        conductorId: targetDriver.id,
        conductorNombre: targetDriver.fullName || targetDriver.username || 'Conductor',
        iniciadoPor: user?.fullName || user?.username || 'Sistema',
        esDespachoAdministrativo: esDespachoAdmin,
        kmInicial: km,
        kmGpsAcumulados: 0,
        puntosGpsCount: 0,
        velocidadActual: 0,
        combustibleInicial: shiftCombustibleInicial,
        notasInicial: shiftNotasInicial || (
          esDespachoAdmin
            ? `[DESPACHO ADMINISTRATIVO]: Despachado por ${user?.fullName || user?.username} para el chofer ${targetDriver.fullName || targetDriver.username}.`
            : (isOdometerBroken ? 'Odómetro físico averiado (cálculo virtual GPS)' : 'Sin observaciones al inicio')
        ),
        odometroAveriado: isOdometerBroken,
        checklist: { ...checklist },
        inicioTimestamp: new Date().toISOString(),
        fechaInicioStr: new Date().toLocaleString('es-CL')
      };

      const updatedVehicleState = {
        ...targetVeh,
        propietarioId: targetDriver.id,
        propietarioNombre: targetDriver.fullName || targetDriver.username,
        kilometraje: km
      };

      localStorage.setItem('vehiculospro_jornada_activa', JSON.stringify(newShift));
      setActiveShift(newShift);
      setResult({
        vehicle: updatedVehicleState,
        owner: targetDriver
      });
      setShowStartShiftModal(false);
      loadDriverHistory();

      setToast({
        message: esDespachoAdmin
          ? `🚀 ¡Despacho exitoso! Móvil ${targetVeh.patente} asignado a ${targetDriver.fullName || targetDriver.username} por Supervisión.`
          : `¡Turno iniciado con éxito en ${targetVeh.patente}! Conductor asignado: ${targetDriver.fullName || targetDriver.username}. ${isOdometerBroken ? '(Modo Odómetro Virtual GPS activo)' : ''}`,
        type: 'success'
      });

    } catch (e) {
      console.error("Error al iniciar turno:", e);
      setToast({ message: 'Error al registrar inicio de turno.', type: 'error' });
    } finally {
      setSubmittingShift(false);
    }
  };

  // Abrir modal de finalización de turno con cálculo GPS inteligente pre-cargado
  const handleOpenEndShiftModal = async () => {
    if (!activeShift) return;

    if (!result?.vehicle) {
      try {
        const veh = await api.getVehiculoById(activeShift.vehiculoId);
        let owner = null;
        if (veh.propietarioId) {
          try {
            owner = await api.getUsuarioById(veh.propietarioId);
          } catch (e) {}
        }
        setResult({ vehicle: veh, owner });
      } catch (err) {
        console.warn("No se pudo cargar vehículo para cierre:", err);
      }
    }

    const kmGps = activeShift.kmGpsAcumulados || 0;
    const kmSugerido = activeShift.kmInicial + (kmGps > 0 ? Math.round(kmGps) : 0);
    setShiftKmFinal(kmSugerido);
    setShowEndShiftModal(true);
  };

  // Confirmar fin de turno (Check-out)
  const handleConfirmEndShift = async () => {
    if (!activeShift) return;

    let targetVeh = result?.vehicle;
    if (!targetVeh) {
      try {
        targetVeh = await api.getVehiculoById(activeShift.vehiculoId);
      } catch (e) {
        targetVeh = { id: activeShift.vehiculoId, patente: activeShift.patente, kilometraje: activeShift.kmInicial };
      }
    }

    const kmFin = Number(shiftKmFinal);
    if (isNaN(kmFin) || kmFin < activeShift.kmInicial) {
      setToast({
        message: `El kilometraje final (${kmFin || 0} km) no puede ser menor al inicial (${activeShift.kmInicial} km).`,
        type: 'warning'
      });
      return;
    }

    const esCierreAdmin = (isAdmin || isMecanico) && activeShift.conductorId !== user?.id;

    setSubmittingShift(true);
    try {
      // 1. Actualizar el odómetro oficial en la base de datos MySQL mediante la API
      await api.actualizarVehiculo(targetVeh.id, {
        ...targetVeh,
        kilometraje: kmFin
      });

      // 2. Calcular estadísticas del turno
      const kmRecorridos = kmFin - activeShift.kmInicial;
      const duracionMin = Math.max(1, Math.round((Date.now() - new Date(activeShift.inicioTimestamp).getTime()) / 60000));
      const horas = Math.floor(duracionMin / 60);
      const minutos = duracionMin % 60;
      const duracionTexto = horas > 0 ? `${horas}h ${minutos}m` : `${minutos} min`;

      // 3. Crear registro histórico de bitácora
      const completedRecord = {
        id: Date.now(),
        vehiculoId: activeShift.vehiculoId,
        vehiculoNombre: activeShift.vehiculoNombre,
        patente: activeShift.patente,
        conductorId: activeShift.conductorId,
        conductorNombre: activeShift.conductorNombre,
        cerradoPor: user?.fullName || user?.username || 'Sistema',
        rolOperador: user?.role || 'CONDUCTOR',
        esCierreAdministrativo: esCierreAdmin,
        fechaInicioStr: activeShift.fechaInicioStr,
        fechaFinStr: new Date().toLocaleString('es-CL'),
        duracion: duracionTexto,
        kmInicial: activeShift.kmInicial,
        kmFinal: kmFin,
        kmRecorridos: kmRecorridos,
        kmGpsExacto: activeShift.kmGpsAcumulados ? Number(activeShift.kmGpsAcumulados.toFixed(2)) : kmRecorridos,
        combustibleInicial: activeShift.combustibleInicial,
        combustibleFinal: shiftCombustibleFinal,
        odometroAveriado: activeShift.odometroAveriado || isOdometerBroken,
        notas: shiftNotasFinal || (
          esCierreAdmin
            ? `[CIERRE FORZADO ADMINISTRATIVO]: Realizado por ${user?.fullName || user?.username} (Supervisor/Torre de Control).`
            : (activeShift.odometroAveriado ? 'Odómetro virtual acumulado por GPS (reparto urbano sin tablero)' : (activeShift.kmGpsAcumulados > 0 ? `Odómetro asistido por satélite (+${activeShift.kmGpsAcumulados.toFixed(2)} km GPS)` : 'Turno cerrado conforme'))
        ),
        fallasDetectadas: shiftFallasDetectadas || 'Sin fallas mecánicas reportadas'
      };

      // 4. Persistir cierre de turno en MySQL (Backend)
      const turnoIdToClose = activeShift.backendTurnoId || activeShift.id;
      if (turnoIdToClose) {
        try {
          await api.finalizarTurno(turnoIdToClose, {
            kmFin: kmFin,
            kmGpsRecorridos: activeShift.kmGpsAcumulados ? Number(activeShift.kmGpsAcumulados.toFixed(2)) : kmRecorridos,
            finalizadorId: user?.id,
            esCierreAdministrativo: esCierreAdmin,
            observaciones: completedRecord.notas
          });
        } catch (closeErr) {
          console.warn("Aviso al sincronizar cierre de turno en API backend:", closeErr);
        }
      }

      let history = [];
      try {
        const savedHist = localStorage.getItem('vehiculospro_historial_jornadas');
        history = savedHist ? JSON.parse(savedHist) : [];
      } catch (e) {}

      const updatedHistory = [completedRecord, ...history.slice(0, 29)];
      localStorage.setItem('vehiculospro_historial_jornadas', JSON.stringify(updatedHistory));
      localStorage.removeItem('vehiculospro_jornada_activa');

      setActiveShift(null);
      setShowEndShiftModal(false);
      loadDriverHistory();


      // Actualizar estado local del vehículo a DISPONIBLE (Sin Asignar)
      if (result?.vehicle) {
        setResult(prev => ({
          ...prev,
          owner: null,
          vehicle: {
            ...prev.vehicle,
            kilometraje: kmFin,
            propietarioId: null,
            propietarioNombre: null
          }
        }));
      }

      setToast({
        message: esCierreAdmin
          ? `🛑 Turno de ${activeShift.conductorNombre} cerrado administrativamente por Supervisión. Móvil liberado (+${kmRecorridos} km).`
          : `¡Turno finalizado! Se recorrieron +${kmRecorridos} km (${duracionTexto}) vía Odómetro GPS. El móvil ahora está disponible / sin asignar.`,
        type: 'success'
      });
    } catch (e) {
      console.error("Error al finalizar turno:", e);
      setToast({ message: 'Error al sincronizar odómetro en el servidor.', type: 'error' });
    } finally {
      setSubmittingShift(false);
    }
  };

  // Detener la cámara de manera segura y liberar hardware
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch (e) {}
        });
      } catch (e) {}
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchActive(false);
    setCameraActive(false);
  }, []);

  // Iniciar escaneo en vivo con la cámara nativa del dispositivo
  const startCamera = async () => {
    setCameraError('');
    setErrorMsg('');

    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('El dispositivo o navegador no soporta captura de video en vivo.');
      }

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (backCamErr) {
        console.warn("Cámara trasera con constraints específicos no disponible, intentando genérica:", backCamErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      if (!stream) {
        throw new Error('No se pudo inicializar el flujo de video.');
      }

      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.error("Error al activar cámara:", err);
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isMobileNet = !window.isSecureContext && !isLocalhost;
      if (isMobileNet) {
        setCameraError('El navegador móvil bloqueó el video en vivo por política de seguridad de red local. Pulsa el botón "📸 Foto Manual" para abrir directamente la cámara nativa.');
      } else {
        setCameraError(`No se pudo acceder al visor de cámara (${err.message || 'Permiso denegado'}). Verifica los permisos de cámara de la app.`);
      }
      setCameraActive(false);
    }
  };

  // Encender/apagar linterna en celulares que lo soporten
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && typeof track.applyConstraints === 'function') {
      try {
        const nextState = !torchActive;
        await track.applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchActive(nextState);
      } catch (e) {
        console.warn("Linterna/flash no soportada por este sensor de cámara:", e);
      }
    }
  };

  // Bucle de lectura en tiempo real con jsQR (100% aislado del DOM de React)
  useEffect(() => {
    if (!cameraActive || !streamRef.current) return;

    let isScanning = true;
    const video = videoRef.current;
    if (video) {
      video.srcObject = streamRef.current;
      video.setAttribute('playsinline', 'true');
      video.muted = true;
      video.play().catch(e => console.warn("Aviso al reproducir stream:", e));
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const scanFrame = () => {
      if (!isScanning) return;

      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth'
        });

        if (code && code.data && code.data.trim()) {
          isScanning = false;
          try {
            if (navigator.vibrate) navigator.vibrate(80);
          } catch (e) {}

          stopCamera();
          setQrText(code.data);
          handleScan(code.data);
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [cameraActive, stopCamera]);

  // Apagar cámara al desmontar la vista
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Decodificador avanzado multi-capa para fotografías y capturas móviles
  const decodeQrFromImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          try {
            // Intento 1: Detección directa usando jsQR sobre canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "attemptBoth"
            });
            
            if (code && code.data) {
              return resolve(code.data);
            }

            // Intento 2: Con margen blanco perimetral (Quiet Zone padding para fotos con bordes oscuros)
            const padding = 60;
            canvas.width = img.width + padding * 2;
            canvas.height = img.height + padding * 2;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, padding, padding);

            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "attemptBoth"
            });
            if (code && code.data) {
              return resolve(code.data);
            }

            // Intento 3: Redimensionamiento óptimo para fotos gigantes de móviles (e.g. 12MP/48MP)
            const maxDim = 1200;
            if (img.width > maxDim || img.height > maxDim) {
              const scale = Math.min(maxDim / img.width, maxDim / img.height);
              canvas.width = Math.round(img.width * scale);
              canvas.height = Math.round(img.height * scale);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "attemptBoth"
              });
              if (code && code.data) {
                return resolve(code.data);
              }
            }

            resolve(null);
          } catch (err) {
            console.error("Error en procesamiento de canvas jsQR:", err);
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = event.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  // Escanear código QR desde archivo de imagen subido o foto tomada
  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSearching(true);
    setErrorMsg('');
    try {
      // Decodificador multi-capa con jsQR
      const decoded = await decodeQrFromImage(file);

      if (decoded) {
        setQrText(decoded);
        handleScan(decoded);
      } else {
        setErrorMsg('No se detectó un código QR legible en la foto. Intenta enfocar bien de cerca el código QR del vehículo.');
        setToast({ message: 'No se detectó código QR en la foto. Intenta nuevamente.', type: 'error' });
      }
    } catch (err) {
      console.error("Error al procesar QR:", err);
      setErrorMsg('Error al procesar la imagen seleccionada.');
      setToast({ message: 'Error al procesar la imagen.', type: 'error' });
    } finally {
      setSearching(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (captureCameraRef.current) captureCameraRef.current.value = '';
    }
  };

  // Actualizar imagen del documento legal directamente desde la vista técnica
  const handleUploadDocumentImage = async (newBase64) => {
    if (!result?.vehicle || !selectedDoc) return;
    try {
      const v = result.vehicle;
      const payload = {
        ...v,
        revisionTecnicaImagen: selectedDoc.tipo === 'PRT' ? newBase64 : v.revisionTecnicaImagen,
        soapImagen: selectedDoc.tipo === 'SOAP' ? newBase64 : v.soapImagen,
        permisoCirculacionImagen: selectedDoc.tipo === 'PERMISO' ? newBase64 : v.permisoCirculacionImagen
      };
      const updated = await api.actualizarVehiculo(v.id, payload);
      setResult(prev => ({
        ...prev,
        vehicle: updated
      }));
      setSelectedDoc(prev => ({
        ...prev,
        imagen: newBase64
      }));
      setToast({ message: `Fotografía de ${selectedDoc.tipo} actualizada exitosamente.`, type: 'success' });
    } catch (err) {
      console.error("Error al actualizar fotografía:", err);
      setToast({ message: 'Error al guardar la fotografía del documento.', type: 'error' });
    }
  };

  // Subir o capturar foto del incidente / falla con compresión automática directa a Base64 para MySQL
  const handleIncidentImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressingIncidentFoto(true);

    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Genera el Base64 comprimido óptimo (~80 KB - 120 KB)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setIncidentFoto(compressedBase64);
          setToast({ message: '📸 Fotografía capturada y lista para enviar.', type: 'success' });
        } catch (canvasErr) {
          console.warn("Fallback de imagen con FileReader:", canvasErr);
          const reader = new FileReader();
          reader.onload = (fe) => {
            setIncidentFoto(fe.target.result);
          };
          reader.readAsDataURL(file);
        } finally {
          URL.revokeObjectURL(objectUrl);
          setCompressingIncidentFoto(false);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        const reader = new FileReader();
        reader.onload = (fe) => {
          setIncidentFoto(fe.target.result);
          setCompressingIncidentFoto(false);
        };
        reader.onerror = () => {
          setToast({ message: 'No se pudo leer la fotografía seleccionada.', type: 'error' });
          setCompressingIncidentFoto(false);
        };
        reader.readAsDataURL(file);
      };

      img.src = objectUrl;
    } catch (err) {
      console.error("Error al procesar foto:", err);
      try {
        const reader = new FileReader();
        reader.onload = (fe) => {
          setIncidentFoto(fe.target.result);
          setCompressingIncidentFoto(false);
        };
        reader.readAsDataURL(file);
      } catch (fatalErr) {
        setToast({ message: 'Error al procesar fotografía.', type: 'error' });
        setCompressingIncidentFoto(false);
      }
    }
    e.target.value = '';
  };

  // Enviar reporte formal de falla o accidente
  const handleReportIncident = async () => {
    const targetVeh = result?.vehicle || (activeShift ? { id: activeShift.vehiculoId, marca: activeShift.vehiculoNombre, patente: activeShift.patente } : null);
    if (!targetVeh) {
      setToast({ message: 'No hay vehículo seleccionado para asociar el reporte.', type: 'warning' });
      return;
    }

    if (!incidentDescripcion.trim()) {
      setToast({ message: 'Por favor ingrese una descripción de lo ocurrido o falla observada.', type: 'warning' });
      return;
    }

    if (!incidentFoto) {
      const confirmarSinFoto = window.confirm('⚠️ No has adjuntado una fotografía de evidencia.\n\n¿Deseas enviar la alerta solo con la descripción de texto?');
      if (!confirmarSinFoto) return;
    }

    setSubmittingIncident(true);
    try {
      const now = new Date();
      const incidentPayload = {
        vehiculoId: targetVeh.id,
        vehiculoNombre: targetVeh.marca ? `${targetVeh.marca} ${targetVeh.modelo || ''}` : activeShift?.vehiculoNombre || `Móvil #${targetVeh.id}`,
        patente: targetVeh.patente || 'S/P',
        conductorId: user?.id || null,
        conductorNombre: user?.fullName || user?.username || 'Conductor en Turno',
        conductorTelefono: user?.telefono || '+56 9 8765 4321',
        tipoEvento: incidentTipo,
        gravedad: incidentGravedad,
        descripcion: incidentDescripcion.trim(),
        foto: incidentFoto || null,
        fechaHoraStr: now.toLocaleString('es-CL', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }) + ' hrs',
        timestamp: Date.now(),
        resuelto: false
      };

      // 1. Enviar de forma centralizada al servidor MySQL para que el Administrador lo reciba al instante
      let serverIncident = null;
      try {
        serverIncident = await api.crearIncidente(incidentPayload);
      } catch (apiErr) {
        console.warn("Aviso al registrar incidente en backend central:", apiErr);
      }

      const newIncident = serverIncident || { ...incidentPayload, id: Date.now() };

      // 2. Respaldo local y sincronización inmediata
      let existingIncidents = [];
      try {
        const saved = localStorage.getItem('vehiculospro_incidentes_reportados');
        existingIncidents = saved ? JSON.parse(saved) : [];
      } catch (e) {}

      const updated = [newIncident, ...existingIncidents.filter(x => x.id !== newIncident.id)];
      localStorage.setItem('vehiculospro_incidentes_reportados', JSON.stringify(updated));

      window.dispatchEvent(new Event('storage'));

      setShowIncidentModal(false);
      setIncidentDescripcion('');
      setIncidentFoto(null);
      
      setToast({
        message: `🚨 ¡Aviso emitido con éxito! Se alertó al taller mecánico y administración sobre ${newIncident.patente}.`,
        type: 'success'
      });
    } catch (err) {
      console.error("Error al registrar incidente:", err);
      setToast({ message: 'Error al enviar el reporte.', type: 'error' });
    } finally {
      setSubmittingIncident(false);
    }
  };

  const hasAlerts = result?.vehicle?.alertas && result.vehicle.alertas.length > 0;

  // Historial completo unificado: inyecta dinámicamente el turno activo en curso al inicio
  const fullHistoryList = useMemo(() => {
    let list = [...driverHistory];

    if (activeShift) {
      const activeKmRec = Math.round(activeShift.kmGpsAcumulados || 0);
      const activeItem = {
        id: activeShift.backendTurnoId || activeShift.id || 'active-shift-current',
        vehiculoId: activeShift.vehiculoId,
        vehiculoNombre: activeShift.vehiculoNombre || 'Vehículo de Flota',
        patente: activeShift.patente || 'S/P',
        conductorId: activeShift.conductorId,
        conductorNombre: activeShift.conductorNombre || user?.fullName || 'Conductor',
        cerradoPor: null,
        esCierreAdministrativo: false,
        fechaInicioStr: activeShift.fechaInicioStr || new Date().toLocaleString('es-CL'),
        fechaFinStr: '🟢 En Ruta (En curso)',
        duracion: '⏱️ En curso',
        kmInicial: activeShift.kmInicial || 0,
        kmFinal: (activeShift.kmInicial || 0) + activeKmRec,
        kmRecorridos: activeKmRec,
        kmGpsExacto: activeShift.kmGpsAcumulados || 0,
        odometroAveriado: !!activeShift.odometroAveriado,
        combustibleFinal: activeShift.combustibleInicial || '100%',
        estado: 'EN_RUTA',
        notas: activeShift.notasInicial || 'Turno activo actualmente en ruta'
      };

      // Evitar duplicados si el backend ya devolvió el turno activo
      list = list.filter(item => {
        if (item.estado === 'EN_RUTA') return false;
        if (activeShift.backendTurnoId && String(item.id) === String(activeShift.backendTurnoId)) return false;
        if (activeShift.id && String(item.id) === String(activeShift.id)) return false;
        return true;
      });

      list.unshift(activeItem);
    }

    return list;
  }, [driverHistory, activeShift, user?.fullName]);

  // Estadísticas consolidadas auditables
  const historyStats = useMemo(() => {
    const distintos = new Set(fullHistoryList.map(h => h.patente).filter(p => p && p !== 'S/P')).size;
    const finalizados = fullHistoryList.filter(h => h.estado !== 'EN_RUTA').length;
    const enCurso = fullHistoryList.filter(h => h.estado === 'EN_RUTA').length;
    const totalKm = fullHistoryList.reduce((sum, h) => sum + (h.kmRecorridos || 0), 0);
    const totalGpsKm = fullHistoryList.reduce((sum, h) => sum + (h.kmGpsExacto || 0), 0);
    return { distintos, finalizados, enCurso, totalKm, totalGpsKm };
  }, [fullHistoryList]);

  // Lista filtrada para la vista actual
  const filteredHistory = useMemo(() => {
    return fullHistoryList.filter(item => {
      if (historyFilter === 'FINALIZADOS' && item.estado === 'EN_RUTA') return false;
      if (historyFilter === 'EN_RUTA' && item.estado !== 'EN_RUTA') return false;
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const matchPat = item.patente?.toLowerCase().includes(q);
        const matchNom = item.vehiculoNombre?.toLowerCase().includes(q);
        const matchFec = item.fechaInicioStr?.toLowerCase().includes(q);
        const matchNot = item.notas?.toLowerCase().includes(q);
        return matchPat || matchNom || matchFec || matchNot;
      }
      return true;
    });
  }, [fullHistoryList, historyFilter, historySearch]);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
          Control de Acceso QR 📱
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Escanea el código QR del vehículo con tu cámara o ingresa el identificador para verificar su estado en tiempo real.
        </p>
      </div>

      {/* TARJETA DE TURNO ACTIVO EN CURSO: ODÓMETRO VIRTUAL GPS EN REPARTO */}
      {activeShift && (
        <div 
          className="glass-card" 
          style={{
            marginBottom: '1.5rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.18) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.65rem', borderRadius: '12px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)' }}>
                <Car size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#34d399', fontWeight: 800 }}>
                    Tu Turno Activo en Curso
                  </span>
                  <span className="badge badge-success" style={{ animation: 'pulse 1.5s infinite', fontSize: '0.68rem' }}>
                    🟢 En Ruta / Reparto
                  </span>
                  {activeShift.odometroAveriado && (
                    <span className="badge" style={{ backgroundColor: '#f59e0b', color: '#000', fontWeight: 700, fontSize: '0.68rem' }}>
                      ⚠️ Tablero Averiado (Modo Satelital)
                    </span>
                  )}
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '2px 0 0 0' }}>
                  {activeShift.vehiculoNombre} · <span style={{ color: '#38bdf8' }}>{activeShift.patente}</span>
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Conductor: <strong>{activeShift.conductorNombre}</strong> · Turno iniciado: {activeShift.fechaInicioStr}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-warning"
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                onClick={handleOpenEndShiftModal}
              >
                <StopCircle size={17} />
                <span>Finalizar Turno (Check-out)</span>
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-danger)', color: '#fca5a5', fontSize: '0.85rem' }}
                onClick={() => setShowIncidentModal(true)}
              >
                <AlertTriangle size={17} />
                <span>Reportar Falla</span>
              </button>
            </div>
          </div>

          {/* Bloque del Odómetro Virtual GPS */}
          <div style={{ 
            background: 'rgba(5, 7, 10, 0.65)', 
            border: '1px solid rgba(56, 189, 248, 0.3)', 
            borderRadius: 'var(--radius-md)', 
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <Gauge size={14} color="#38bdf8" />
                <span>Km Inicial al Recibir</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {activeShift.kmInicial?.toLocaleString()} km
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {activeShift.odometroAveriado ? 'Tablero sin odómetro físico' : 'Lectura de partida'}
              </span>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px', fontWeight: 700 }}>
                <Navigation size={14} color="#10b981" />
                <span>Odómetro Virtual GPS (Reparto)</span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#10b981', letterSpacing: '0.02em' }}>
                +{(activeShift.kmGpsAcumulados || 0).toFixed(2)} km
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {activeShift.kmGpsAcumulados > 0 
                  ? `${Math.round(activeShift.kmGpsAcumulados * 1000)} m recorridos en reparto`
                  : 'Calculando distancia punto a punto'}
              </span>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <Radio size={14} color="#38bdf8" />
                <span>Velocidad & Antena Satelital</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
                {liveGpsStats.speed > 0 ? `${liveGpsStats.speed} km/h` : '0 km/h (Detenido)'}
              </div>
              <span style={{ fontSize: '0.72rem', color: liveGpsStats.isTracking ? '#34d399' : '#f59e0b' }}>
                {liveGpsStats.isTracking ? '🟢 GPS activo grabando ruta' : '🟡 Esperando señal satelital'}
              </span>
            </div>

            {(isAdmin || isMecanico) && (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.45rem 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontWeight: 600 }}
                  onClick={() => handleSimulateGpsAdvance(1.5)}
                  title="Simula avance de 1.5 km para pruebas de reparto en oficina o computadora"
                >
                  <Sparkles size={14} />
                  <span>Simular Reparto (+1.5 km)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem' }} className="scan-layout">
        
        {/* Left Side: Real Camera / Scanner */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Camera size={18} color="var(--primary)" />
              Lector QR con Cámara
            </h3>
            {cameraActive && (
              <span className="badge badge-success" style={{ animation: 'pulse 1.5s infinite' }}>
                Cámara Activa
              </span>
            )}
          </div>

          {/* Scanner Viewport (Camera Stream / Placeholder) */}
          <div 
            style={{ 
              minHeight: '270px', 
              backgroundColor: '#05070a', 
              border: cameraActive ? '2px solid var(--primary)' : '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* 1. Vista de Cámara en Vivo Activa (100% Nativa HTML5/Capacitor) */}
            {cameraActive && (
              <div style={{ position: 'relative', width: '100%', height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#000000' }}>
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />

                {/* Retícula de escaneo futurista tipo HUD */}
                <div style={{
                  position: 'absolute',
                  width: '200px',
                  height: '200px',
                  border: '2px solid rgba(56, 189, 248, 0.85)',
                  borderRadius: '16px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {/* Láser de barrido animado */}
                  <div style={{
                    width: '90%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #38bdf8, #10b981, transparent)',
                    boxShadow: '0 0 10px #38bdf8',
                    animation: 'qrLaser 2s ease-in-out infinite'
                  }} />
                </div>

                {/* Botón Superior Derecho: Apagar Cámara */}
                <button
                  type="button"
                  onClick={stopCamera}
                  className="btn btn-secondary btn-sm"
                  style={{ 
                    position: 'absolute', 
                    top: '10px', 
                    right: '10px', 
                    zIndex: 20, 
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    fontSize: '0.78rem',
                    padding: '4px 10px'
                  }}
                >
                  <StopCircle size={14} color="#ef4444" />
                  <span>Cerrar</span>
                </button>

                {/* Botón Superior Izquierdo: Linterna / Flash */}
                <button
                  type="button"
                  onClick={toggleTorch}
                  className="btn btn-secondary btn-sm"
                  style={{ 
                    position: 'absolute', 
                    top: '10px', 
                    left: '10px', 
                    zIndex: 20, 
                    background: torchActive ? 'rgba(234, 179, 8, 0.4)' : 'rgba(0,0,0,0.8)',
                    border: torchActive ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    padding: '4px 8px'
                  }}
                  title="Encender o apagar luz flash"
                >
                  <Zap size={13} color={torchActive ? '#eab308' : '#ffffff'} />
                  <span>{torchActive ? 'Luz ON' : 'Luz'}</span>
                </button>

                {/* Instrucción inferior */}
                <span style={{
                  position: 'absolute',
                  bottom: '10px',
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(4px)',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  color: '#ffffff',
                  fontWeight: 600,
                  pointerEvents: 'none'
                }}>
                  🎯 Apunta al código QR del móvil
                </span>
              </div>
            )}

            {/* 2. Estado Reposo / Selección de Captura */}
            {!cameraActive && (
              <div style={{ textAlign: 'center', padding: '1.5rem', width: '100%' }}>
                <QrCode size={72} style={{ opacity: 0.2, margin: '0 auto 1rem', display: 'block' }} />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
                  {/* Botón Principal: Escaneo Continuo en Vivo (Apuntar y listo, sin fotos) */}
                  <button 
                    type="button"
                    className="btn btn-primary"
                    onClick={startCamera}
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.6rem', 
                      width: '100%', 
                      maxWidth: '290px', 
                      fontWeight: 700, 
                      padding: '0.75rem 1.25rem',
                      fontSize: '0.95rem'
                    }}
                  >
                    <Video size={20} />
                    <span>📹 Escanear QR en Vivo</span>
                  </button>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0.5rem', maxWidth: '280px', lineHeight: 1.35 }}>
                    Solo apunta la cámara hacia el código QR. Se detecta automáticamente sin guardar fotos.
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '290px' }}>
                    {/* Botón Foto Respaldo */}
                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => captureCameraRef.current?.click()}
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.78rem', padding: '0.5rem 0.5rem' }}
                      title="Tomar una fotografía manual si el QR está lejos o con poca luz"
                    >
                      <Camera size={14} />
                      <span>📸 Foto Manual</span>
                    </button>

                    {/* Botón Galería */}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.78rem', padding: '0.5rem 0.5rem' }}
                      title="Subir imagen guardada en el dispositivo"
                    >
                      <Image size={14} />
                      <span>🖼️ Galería</span>
                    </button>
                  </div>

                  {/* Input con capture='environment' para abrir directamente la cámara de fotos del móvil */}
                  <input 
                    type="file" 
                    ref={captureCameraRef} 
                    accept="image/*" 
                    capture="environment"
                    style={{ display: 'none' }} 
                    onChange={handleImageFile} 
                  />

                  {/* Input estándar para selector de galería o PC */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handleImageFile} 
                  />
                </div>
              </div>
            )}

            {searching && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(5, 7, 12, 0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 30 }}>
                <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '0.75rem' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Consultando datos del vehículo...</span>
              </div>
            )}
          </div>

          {cameraError && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.28)', color: '#fca5a5', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
                <div style={{ lineHeight: 1.45 }}>{cameraError}</div>
              </div>
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() => captureCameraRef.current?.click()}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700, padding: '0.55rem 1rem', width: '100%' }}
              >
                <Camera size={16} />
                <span>📸 Tomar Foto al QR con la Cámara Móvil</span>
              </button>
            </div>
          )}

          {/* Form / Manual Inputs & Simulator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            {(isAdmin || isMecanico) && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Prueba Rápida (Solo Administrador / Taller):
                </label>
                <select 
                  className="form-input form-select"
                  onChange={(e) => {
                    setQrText(e.target.value);
                    if (e.target.value) handleScan(e.target.value);
                  }}
                  value={qrText}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="">-- Seleccionar vehículo registrado para prueba --</option>
                  {availableVehicles.map((av, idx) => (
                    <option key={idx} value={av.qrCode}>
                      {av.label} ({av.qrCode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Ingreso manual por código o patente:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej: FWKR41 o VEHICULO:1"
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
                <button className="btn btn-primary" onClick={() => handleScan()} disabled={searching} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Search size={16} />
                  <span>Consultar</span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <div 
                style={{ 
                  padding: '0.75rem', 
                  borderRadius: 'var(--radius-sm)', 
                  backgroundColor: 'rgba(239, 68, 68, 0.05)', 
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  fontSize: '0.8rem',
                  color: 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <ShieldAlert size={16} />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Scan Results */}
        <div>
          {result ? (
            <div 
              className="glass-card" 
              style={{ 
                height: '100%', 
                borderLeft: hasAlerts ? '6px solid var(--color-danger)' : '6px solid var(--color-success)',
                animation: 'slideUp 0.3s ease-out'
              }}
            >
              {/* Security Authorization Status Header */}
              <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                {result.vehicle.activo === false ? (
                  <>
                    <div style={{ display: 'inline-flex', padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-danger)', marginBottom: '0.5rem' }}>
                      <ShieldAlert size={36} />
                    </div>
                    <h2 style={{ fontSize: '1.4rem', color: 'var(--color-danger)', fontWeight: 800 }}>
                      VEHÍCULO APAGADO / FUERA DE SERVICIO 🛑
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Este vehículo fue dado de baja o apagado por el Administrador. No está autorizado para circular ni iniciar jornada.
                    </p>
                  </>
                ) : hasAlerts ? (
                  <>
                    <div style={{ display: 'inline-flex', padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', marginBottom: '0.5rem' }}>
                      <ShieldAlert size={36} />
                    </div>
                    <h2 style={{ fontSize: '1.4rem', color: 'var(--color-danger)', fontWeight: 800 }}>
                      ACCESO RESTRINGIDO ⚠️
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mantenimientos pendientes o kilometraje crítico vencido</p>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'inline-flex', padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', marginBottom: '0.5rem' }}>
                      <CheckCircle2 size={36} />
                    </div>
                    <h2 style={{ fontSize: '1.4rem', color: 'var(--color-success)', fontWeight: 800 }}>
                      ACCESO AUTORIZADO ✅
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vehículo operativo y al día con sus pautas</p>
                  </>
                )}
              </div>

              {/* Panel de Turno y Operación (Check-in / Check-out) */}
              {result.vehicle.activo === false ? (
                <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShieldAlert size={22} color="var(--color-danger)" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--color-danger)', display: 'block', marginBottom: '2px' }}>
                      🚫 Móvil Fuera de Servicio
                    </strong>
                    El Administrador tiene este vehículo inhabilitado. No está autorizado para iniciar turnos ni circular.
                  </div>
                </div>
              ) : activeShift && activeShift.vehiculoId === result.vehicle.id && activeShift.conductorId === user?.id ? (
                <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                    <div>
                      <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.88rem' }}>Móvil asignado a tu turno en curso</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>
                        Los controles de check-out, odómetro satelital y reporte de fallas están activos en el panel superior.
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}>🟢 En Ruta</span>
                </div>
              ) : activeShift && activeShift.vehiculoId === result.vehicle.id && activeShift.conductorId !== user?.id ? (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={18} color="#f59e0b" />
                      <strong style={{ color: '#f59e0b', fontSize: '0.9rem' }}>Móvil Ocupado por {activeShift.conductorNombre}</strong>
                    </div>
                    <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>En Turno</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div>⏱️ Turno iniciado: <strong>{activeShift.fechaInicioStr}</strong></div>
                    <div>🔢 Km al recibir: <strong>{activeShift.kmInicial?.toLocaleString()} km</strong></div>
                    {activeShift.kmGpsAcumulados > 0 && (
                      <div style={{ color: '#10b981', fontWeight: 600 }}>🛰️ GPS en ruta: +{activeShift.kmGpsAcumulados.toFixed(2)} km</div>
                    )}
                  </div>
                  {(isAdmin || isMecanico) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button 
                        type="button" 
                        className="btn btn-warning" 
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
                        onClick={handleOpenEndShiftModal}
                      >
                        <StopCircle size={18} />
                        🛑 Forzar Cierre Administrativo de Turno (Supervisor)
                      </button>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Tienes privilegios de supervisión para cerrar el turno si el chofer olvidó marcar o se retiró.
                      </span>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Este vehículo está siendo conducido actualmente por <strong>{activeShift.conductorNombre}</strong>. Podrás tomarlo una vez que el colega entregue el turno o supervisión lo libere.
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sparkles size={18} color="#38bdf8" />
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Vehículo Disponible en Patio / Base</strong>
                    </div>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Libre</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    ¿Vas a operar este móvil en tu turno? Realiza el Check-in rápido en 15 segundos para registrar odómetro, combustible y salir a ruta.
                  </p>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
                    onClick={() => {
                      setShiftKmInicial(result.vehicle.kilometraje || 0);
                      setIsOdometerBroken(false);
                      if (result.vehicle.propietarioId) {
                        setSelectedDriverId(result.vehicle.propietarioId);
                      } else if (user?.role === 'CONDUCTOR') {
                        setSelectedDriverId(user.id);
                      } else {
                        setSelectedDriverId('');
                      }
                      setShowStartShiftModal(true);
                    }}
                  >
                    <Car size={18} />
                    🚗 Iniciar Turno con este Móvil (Check-in)
                  </button>
                </div>
              )}

              {/* Vehicle Specifications */}
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Car size={16} color="var(--primary)" />
                Datos del Vehículo
              </h4>
              <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Marca / Modelo:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{result.vehicle.marca} {result.vehicle.modelo}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Patente:</span>
                  <strong style={{ color: 'var(--primary)', letterSpacing: '0.05em' }}>{result.vehicle.patente || 'S/P'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Estado Operativo:</span>
                  <strong style={{ color: result.vehicle.activo !== false ? 'var(--color-success)' : 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: result.vehicle.activo !== false ? '#10b981' : '#ef4444' }}></span>
                    {result.vehicle.activo !== false ? 'Encendido / Operativo' : 'Apagado / Fuera de servicio'}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Año:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{result.vehicle.anio}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Kilometraje:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{(result.vehicle.kilometraje || 0).toLocaleString()} km</strong>
                </div>
              </div>

              {/* Owner / Estado de Asignación Information */}
              {(result.owner || result.vehicle?.propietarioId || result.vehicle?.propietarioNombre) ? (
                <>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16} color="var(--primary)" />
                    Conductor / Responsable Asignado
                  </h4>
                  <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.25)', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#60a5fa' }}>
                        👤 {result.owner?.fullName || result.owner?.username || result.vehicle?.propietarioNombre || 'Conductor Asignado'}
                      </span>
                      <span className="badge badge-info" style={{ fontSize: '0.68rem', fontWeight: 700 }}>🔵 Asignado en Turno</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <Phone size={14} /> {result.owner?.phoneNumber || 'Sin teléfono registrado'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <Mail size={14} /> {result.owner?.email || 'Sin correo registrado'}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={16} color="#34d399" />
                    Estado de Asignación:
                  </span>
                  <strong style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '0.88rem' }}>
                    <CheckCircle2 size={15} />
                    🟢 Disponible (Sin Asignar)
                  </strong>
                </div>
              )}

              {/* Documentación Legal Obligatoria (Chile) */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                  <FileCheck size={16} color="var(--primary)" />
                  Documentación Legal Vehicular (Chile)
                </h4>
                <DocumentosVehiculoSection 
                  vehiculo={result.vehicle} 
                  onOpenModal={(docData) => setSelectedDoc(docData)} 
                />
              </div>

              {/* List of alerts */}
              {hasAlerts && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)' }}>
                    <AlertTriangle size={16} />
                    Observaciones Técnicas ({result.vehicle.alertas.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {result.vehicle.alertas.map((alert, i) => (
                      <div 
                        key={i} 
                        style={{ 
                          padding: '0.75rem', 
                          backgroundColor: 'rgba(239, 68, 68, 0.05)', 
                          border: '1px solid rgba(239, 68, 68, 0.15)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          color: 'var(--color-danger)'
                        }}
                      >
                        {alert}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div 
              className="glass-card" 
              style={{ 
                height: '100%', 
                minHeight: '260px',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                textAlign: 'center', 
                color: 'var(--text-secondary)',
                padding: '3rem 1.5rem',
                borderStyle: 'dashed'
              }}
            >
              <QrCode size={48} style={{ marginBottom: '1.25rem', opacity: 0.3 }} />
              <h3 style={{ fontSize: '1.15rem' }}>Esperando Escaneo</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', maxWidth: '300px' }}>
                Enciende la cámara y enfoca el código QR del vehículo, sube una foto o selecciona un vehículo para consultar su ficha técnica.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN AUDITABLE: MI HISTORIAL DE CONDUCCIÓN (MÓVILES CONDUCIDOS) */}
      <div className="glass-card" style={{ marginTop: '1.75rem', padding: '1.5rem', borderTop: '3px solid #38bdf8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <History size={22} color="var(--primary)" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Mi Bitácora de Conducción (Móviles Operados)
              </h3>
              <span className="badge badge-info" style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>
                {fullHistoryList.length} {fullHistoryList.length === 1 ? 'Turno' : 'Turnos'}
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
              Historial de vehículos que has tomado y conducido, kilometraje registrado, turnos auditados y telemetría de Odómetro GPS.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadDriverHistory}
              disabled={loadingHistory}
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              title="Sincronizar historial con el servidor"
            >
              <RefreshCw size={14} className={loadingHistory ? 'spin' : ''} />
              <span>{loadingHistory ? 'Cargando...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>

        {/* Tarjetas resumen del conductor */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
          <div style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Car size={13} color="#38bdf8" /> Móviles Distintos
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
              {historyStats.distintos}
            </div>
          </div>

          <div style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} color="#a855f7" /> Turnos Finalizados
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#a855f7', marginTop: '4px' }}>
              {historyStats.finalizados}
            </div>
          </div>

          <div style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Gauge size={13} color="#10b981" /> Km Conducidos (Total)
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              +{historyStats.totalKm.toLocaleString()} km
            </div>
          </div>

          <div style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Navigation size={13} color="#f59e0b" /> Odómetro Virtual GPS
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
              {historyStats.totalGpsKm.toFixed(1)} km
            </div>
          </div>
        </div>

        {/* Barra de Filtro y Búsqueda */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
              placeholder="Filtrar por patente, vehículo o fecha..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['TODOS', 'FINALIZADOS', 'EN_RUTA'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setHistoryFilter(f)}
                className="btn"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.75rem',
                  background: historyFilter === f ? 'var(--primary)' : 'rgba(255,255,255,0.04)',
                  color: historyFilter === f ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  fontWeight: 600
                }}
              >
                {f === 'TODOS' && `Todos (${fullHistoryList.length})`}
                {f === 'FINALIZADOS' && `🟢 Finalizados (${historyStats.finalizados})`}
                {f === 'EN_RUTA' && `🔵 En Curso (${historyStats.enCurso})`}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla / Lista de Registros */}
        {loadingHistory ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.75rem auto', color: 'var(--primary)' }} />
            <p style={{ margin: 0, fontSize: '0.88rem' }}>Cargando tu historial desde el servidor...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <History size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', opacity: 0.5 }} />
            <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', color: 'var(--text-primary)' }}>
              {historySearch 
                ? 'No se encontraron turnos con ese filtro' 
                : historyFilter === 'EN_RUTA'
                  ? 'No tienes ningún turno en curso en este momento'
                  : historyFilter === 'FINALIZADOS'
                    ? 'Aún no registras turnos finalizados'
                    : 'Aún no registras turnos de conducción'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              {historySearch 
                ? 'Prueba con otra patente o limpia el buscador para ver todos tus turnos.'
                : historyFilter === 'EN_RUTA'
                  ? 'Para iniciar un turno en curso, escanea el código QR de un vehículo disponible.'
                  : 'Escanea el código QR de cualquier móvil de la flota para iniciar tu turno y comenzar a acumular kilómetros auditados.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)' }}>
                  <th style={{ padding: '0.75rem' }}>Vehículo</th>
                  <th style={{ padding: '0.75rem' }}>Horario (Inicio ➔ Cierre)</th>
                  <th style={{ padding: '0.75rem' }}>Duración</th>
                  <th style={{ padding: '0.75rem' }}>Km Inicio</th>
                  <th style={{ padding: '0.75rem' }}>Km Entrega</th>
                  <th style={{ padding: '0.75rem' }}>Km Conducidos</th>
                  <th style={{ padding: '0.75rem' }}>Estado / Cierre</th>
                  <th style={{ padding: '0.75rem' }}>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', backgroundColor: item.estado === 'EN_RUTA' ? 'rgba(56, 189, 248, 0.08)' : undefined }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.vehiculoNombre}
                      </div>
                      <span className="badge badge-info" style={{ fontSize: '0.68rem', marginTop: '3px', letterSpacing: '0.04em' }}>
                        {item.patente}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.78rem' }}>
                      <div style={{ color: 'var(--text-primary)' }}>{item.fechaInicioStr}</div>
                      <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>➔ {item.fechaFinStr}</div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>
                      ⏱️ {item.duracion}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                      {(item.kmInicial || 0).toLocaleString()} km
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                      {(item.kmFinal || 0).toLocaleString()} km
                    </td>
                    <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: 800 }}>
                      +{item.kmRecorridos.toLocaleString()} km
                      {item.kmGpsExacto > 0 && (
                        <span className="badge badge-success" style={{ display: 'block', marginTop: '3px', fontSize: '0.62rem' }}>
                          🛰️ {Number(item.kmGpsExacto).toFixed(1)} km GPS
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {item.estado === 'EN_RUTA' ? (
                        <span className="badge badge-info">🔵 En Ruta</span>
                      ) : item.esCierreAdministrativo ? (
                        <span className="badge badge-warning" title={`Cerrado por: ${item.cerradoPor}`}>🛑 Cierre Supervisor</span>
                      ) : (
                        <span className="badge badge-success">🟢 Finalizado</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.78rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.notas}>
                      {item.notas || 'Sin novedad'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Check-in / Iniciar Turno */}
      {showStartShiftModal && result?.vehicle && (
        <div className="modal-overlay" onClick={() => setShowStartShiftModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Car size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Check-in de Turno</h3>
              </div>
              <span className="badge badge-info">{result.vehicle.patente || 'S/P'}</span>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div>🚗 <strong>{result.vehicle.marca} {result.vehicle.modelo} ({result.vehicle.anio})</strong></div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div>
                  📋 Estado en Flota:{' '}
                  <strong style={{ color: result.vehicle.propietarioNombre ? '#60a5fa' : '#34d399' }}>
                    {result.vehicle.propietarioNombre ? `🔵 Asignado a ${result.vehicle.propietarioNombre}` : '🟢 Disponible en Garaje (Sin Asignar)'}
                  </strong>
                </div>
                <div>
                  👤 Chofer que iniciará el turno:{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {(isAdmin || isMecanico) && selectedDriverId
                      ? (driversList.find(d => String(d.id) === String(selectedDriverId))?.fullName || user?.fullName || user?.username)
                      : (user?.fullName || user?.username)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Selector de conductor para Administrador / Despacho */}
            {(isAdmin || isMecanico) && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <User size={15} color="var(--primary)" />
                    <strong>Asignar Conductor que sale a Ruta:</strong>
                  </span>
                  <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>Despacho por Supervisión</span>
                </label>
                <select
                  className="form-input"
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  <option value={user?.id}>👤 Yo mismo ({user?.fullName || user?.username})</option>
                  {driversList
                    .filter(u => u.id !== user?.id)
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        🚚 {u.fullName || u.username} ({u.role || 'CONDUCTOR'}) - Tel: {u.telefono || 'S/N'}
                      </option>
                    ))}
                </select>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Como supervisor puedes iniciar el turno a nombre de cualquier chofer de la flota (ej: si no tiene smartphone o batería).
                </span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Odómetro inicial */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Odómetro del Tablero (km) *</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Último reg: {result.vehicle.kilometraje?.toLocaleString()} km</span>
                </label>
                <input 
                  type="number"
                  className="form-input"
                  value={shiftKmInicial}
                  onChange={(e) => setShiftKmInicial(e.target.value)}
                  placeholder="Ej: 45200"
                  disabled={isOdometerBroken}
                />
              </div>

              {/* Checkbox Tablero / Odómetro Averiado */}
              <div style={{ padding: '0.75rem', backgroundColor: isOdometerBroken ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isOdometerBroken ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-sm)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: isOdometerBroken ? '#f59e0b' : 'var(--text-primary)' }}>
                  <input 
                    type="checkbox"
                    checked={isOdometerBroken}
                    onChange={(e) => setIsOdometerBroken(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#f59e0b' }}
                  />
                  <span>⚠️ Tablero o Odómetro Físico Averiado</span>
                </label>
                {isOdometerBroken && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    🛰️ <strong>Modo Odómetro Virtual Activo:</strong> La app acumulará los kilómetros reales recorridos por GPS durante tu jornada y generará la orden de mantención correctiva al taller.
                  </div>
                )}
              </div>

              {/* Nivel de Combustible Inicial */}
              <div className="form-group">
                <label className="form-label">Nivel de Combustible al Recibir</label>
                <select 
                  className="form-input"
                  value={shiftCombustibleInicial}
                  onChange={(e) => setShiftCombustibleInicial(e.target.value)}
                >
                  <option value="100% (Lleno)">100% (Estanque Lleno)</option>
                  <option value="75% (3/4)">75% (3/4 Estanque)</option>
                  <option value="50% (1/2)">50% (Medio Estanque)</option>
                  <option value="25% (1/4)">25% (1/4 Estanque)</option>
                  <option value="10% (Reserva)">10% (Reserva / Cargar Urgente)</option>
                </select>
              </div>

              {/* Checklist Rápido Pre-Operacional */}
              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Inspección Pre-Uso Rápida (Seguridad)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: '0.4rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <input type="checkbox" checked={checklist.luces} onChange={(e) => setChecklist(prev => ({ ...prev, luces: e.target.checked }))} />
                    <span>💡 Luces / Señalizadores</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: '0.4rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <input type="checkbox" checked={checklist.frenos} onChange={(e) => setChecklist(prev => ({ ...prev, frenos: e.target.checked }))} />
                    <span>🛑 Frenos y Dirección</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: '0.4rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <input type="checkbox" checked={checklist.neumaticos} onChange={(e) => setChecklist(prev => ({ ...prev, neumaticos: e.target.checked }))} />
                    <span>🛞 Neumáticos y Presión</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: '0.4rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                    <input type="checkbox" checked={checklist.carroceria} onChange={(e) => setChecklist(prev => ({ ...prev, carroceria: e.target.checked }))} />
                    <span>🚗 Carrocería y Aseo</span>
                  </label>
                </div>
              </div>

              {/* Notas de entrada */}
              <div className="form-group">
                <label className="form-label">Observaciones de Recepción (Opcional)</label>
                <input 
                  type="text"
                  className="form-input"
                  placeholder="Ej: Raspón leve puerta derecha, o Sin observaciones"
                  value={shiftNotasInicial}
                  onChange={(e) => setShiftNotasInicial(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowStartShiftModal(false)}
                disabled={submittingShift}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleConfirmStartShift}
                disabled={submittingShift}
                style={{ fontWeight: 700 }}
              >
                {submittingShift ? 'Registrando...' : 'Confirmar y Salir a Ruta 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Check-out / Finalizar Turno */}
      {showEndShiftModal && activeShift && (
        <div className="modal-overlay" onClick={() => setShowEndShiftModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <StopCircle size={20} color="var(--color-warning)" />
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Entrega de Turno (Check-out)</h3>
              </div>
              <span className="badge badge-warning">{result?.vehicle?.patente || activeShift.patente || 'S/P'}</span>
            </div>

            {/* Aviso de Cierre Administrativo si quien cierra no es el chofer asignado */}
            {activeShift.conductorId !== user?.id && (
              <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="var(--color-danger)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
                  <strong>Cierre Administrativo Remoto:</strong> Estás cerrando el turno del chofer <strong>{activeShift.conductorNombre}</strong> como Supervisor. Esta acción quedará registrada en la bitácora auditable.
                </div>
              </div>
            )}

            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div>🚗 <strong>{activeShift.vehiculoNombre}</strong></div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                👤 Conductor: <strong>{activeShift.conductorNombre}</strong> · Inicio: {activeShift.fechaInicioStr}
              </div>
              <div style={{ color: 'var(--primary)', marginTop: '2px', fontWeight: 600 }}>
                🔢 Odómetro Inicial: {activeShift.kmInicial?.toLocaleString()} km
              </div>
            </div>

            {/* Asistente Inteligente Odómetro Virtual GPS */}
            <div style={{
              padding: '0.85rem 1rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(56, 189, 248, 0.1) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 700, fontSize: '0.88rem' }}>
                  <Navigation size={16} />
                  <span>Odómetro Virtual GPS: Cálculo en Reparto</span>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                  +{(activeShift.kmGpsAcumulados || 0).toFixed(2)} km GPS
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                El seguimiento satelital de tu dispositivo calculó una distancia recorrida de <strong>+{(activeShift.kmGpsAcumulados || 0).toFixed(2)} km</strong> durante tu jornada.
                {activeShift.odometroAveriado ? ' Como el tablero está averiado o no funciona, este cálculo reemplaza al odómetro físico de forma exacta.' : ' Puedes pulsar el botón para pre-llenar este kilometraje automáticamente sin necesidad de mirar el panel.'}
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  color: '#10b981',
                  borderColor: 'rgba(16, 185, 129, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                  background: 'rgba(16, 185, 129, 0.1)'
                }}
                onClick={() => setShiftKmFinal(activeShift.kmInicial + Math.round(activeShift.kmGpsAcumulados || 0))}
              >
                <Sparkles size={13} />
                <span>Aplicar Odómetro GPS ({(activeShift.kmInicial + Math.round(activeShift.kmGpsAcumulados || 0)).toLocaleString()} km)</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Odómetro final */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Odómetro Final Registrado (km) *</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mínimo: {activeShift.kmInicial} km</span>
                </label>
                <input 
                  type="number"
                  className="form-input"
                  value={shiftKmFinal}
                  onChange={(e) => setShiftKmFinal(e.target.value)}
                  placeholder={`Mayor o igual a ${activeShift.kmInicial}`}
                />
                {Number(shiftKmFinal) >= activeShift.kmInicial && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '2px', display: 'block' }}>
                    Distancia recorrida en este turno: +{(Number(shiftKmFinal) - activeShift.kmInicial).toLocaleString()} km
                  </span>
                )}
              </div>

              {/* Nivel de Combustible al Entregar */}
              <div className="form-group">
                <label className="form-label">Nivel de Combustible al Entregar</label>
                <select 
                  className="form-input"
                  value={shiftCombustibleFinal}
                  onChange={(e) => setShiftCombustibleFinal(e.target.value)}
                >
                  <option value="100% (Lleno)">100% (Estanque Lleno)</option>
                  <option value="75% (3/4)">75% (3/4 Estanque)</option>
                  <option value="50% (1/2)">50% (Medio Estanque)</option>
                  <option value="25% (1/4)">25% (1/4 Estanque)</option>
                  <option value="10% (Reserva)">10% (Reserva / Advertir a siguiente turno)</option>
                </select>
              </div>

              {/* Novedades o fallas mecánicas detectadas */}
              <div className="form-group">
                <label className="form-label">¿Detectaste alguna falla mecánica o anomalía en ruta?</label>
                <textarea 
                  className="form-input"
                  rows={2}
                  placeholder="Ej: Chillido al frenar, luz baja derecha parpadea, o Sin novedades"
                  value={shiftFallasDetectadas}
                  onChange={(e) => setShiftFallasDetectadas(e.target.value)}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Las anomalías reportadas alertarán preventivamente al taller mecánico y al supervisor.
                </span>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowEndShiftModal(false)}
                disabled={submittingShift}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-warning" 
                onClick={handleConfirmEndShift}
                disabled={submittingShift}
                style={{ fontWeight: 700 }}
              >
                {submittingShift ? 'Finalizando...' : 'Entregar Móvil y Cerrar Turno 🏁'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reporte de Falla o Accidente con Foto */}
      {showIncidentModal && (
        <div className="modal-overlay" onClick={() => setShowIncidentModal(false)} style={{ zIndex: 1200 }}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', width: '92%', maxHeight: '90vh', overflowY: 'auto', animation: 'scaleUp 0.25s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🚨</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-danger)' }}>
                  Reportar Falla o Accidente en Ruta
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowIncidentModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1rem', fontSize: '0.82rem' }}>
              <div>🚗 <strong>Móvil #{result?.vehicle?.id || activeShift?.vehiculoId}</strong>: {result?.vehicle?.marca || activeShift?.vehiculoNombre} ({result?.vehicle?.patente || activeShift?.patente})</div>
              <div>👤 Conductor emisor: <strong>{user?.fullName || user?.username || 'Conductor en Turno'}</strong></div>
              <div>📅 Fecha y hora: <strong>{new Date().toLocaleString('es-CL')}</strong></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Tipo de Evento */}
              <div className="form-group">
                <label className="form-label">Tipo de Evento o Anomalía *</label>
                <select 
                  className="form-input"
                  value={incidentTipo}
                  onChange={(e) => setIncidentTipo(e.target.value)}
                >
                  <option value="Accidente / Colisión">💥 Accidente / Colisión / Choque</option>
                  <option value="Falla Mecánica">⚙️ Falla Mecánica General</option>
                  <option value="Pérdida de Fluidos / Fuga">💧 Pérdida de Líquidos / Fuga de Fluidos (Aceite/Agua)</option>
                  <option value="Ruidos Extraños">🔊 Ruidos Extraños (Frenos / Motor / Suspensión)</option>
                  <option value="Problema Eléctrico / Sensores">⚡ Problema Eléctrico / Check Engine / Sensores</option>
                  <option value="Luces Quemadas / Tablero">💡 Luces Quemadas / Alerta de Tablero</option>
                  <option value="Neumático Pinchado / Dañado">🛞 Neumático Pinchado / Baja Presión</option>
                </select>
              </div>

              {/* Nivel de Gravedad */}
              <div className="form-group">
                <label className="form-label">Nivel de Gravedad *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {[
                    { val: 'URGENTE / ACCIDENTE', label: 'Urgente', desc: 'Ruta detenida', color: 'var(--color-danger)' },
                    { val: 'MEDIA (Falla Mecánica)', label: 'Moderada', desc: 'Requiere taller', color: 'var(--color-warning)' },
                    { val: 'LEVE (Anomalía)', label: 'Leve', desc: 'Observación', color: 'var(--color-info)' }
                  ].map((g) => (
                    <button
                      key={g.val}
                      type="button"
                      onClick={() => setIncidentGravedad(g.val)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: incidentGravedad === g.val ? `2px solid ${g.color}` : '1px solid var(--border-color)',
                        backgroundColor: incidentGravedad === g.val ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: incidentGravedad === g.val ? g.color : 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      <div>{g.label}</div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 'normal', opacity: 0.8 }}>{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Descripción */}
              <div className="form-group">
                <label className="form-label">Descripción Detallada *</label>
                <textarea 
                  className="form-input"
                  rows={3}
                  placeholder="Ej: Fuerte chirrido metálico en rueda delantera derecha al presionar freno, o choque por alcance en Av. Providencia altura 1200..."
                  value={incidentDescripcion}
                  onChange={(e) => setIncidentDescripcion(e.target.value)}
                />
              </div>

              {/* Adjuntar o Tomar Fotografía */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>📸 Evidencia Fotográfica (Daño / Falla / Accidente)</span>
                  {incidentFoto && (
                    <button 
                      type="button" 
                      onClick={() => setIncidentFoto(null)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '0.72rem', cursor: 'pointer' }}
                    >
                      Quitar Foto
                    </button>
                  )}
                </label>

                {compressingIncidentFoto ? (
                  <div style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'rgba(56, 189, 248, 0.08)', borderRadius: 'var(--radius-md)', border: '1px dashed #38bdf8' }}>
                    <div style={{ display: 'inline-block', width: '22px', height: '22px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '0.4rem' }}></div>
                    <div style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700 }}>Procesando y optimizando fotografía...</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Espere un segundo mientras se adjunta la evidencia</div>
                  </div>
                ) : incidentFoto ? (
                  <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: '180px' }}>
                    <img 
                      src={incidentFoto} 
                      alt="Foto del evento" 
                      style={{ width: '100%', height: '180px', objectFit: 'cover' }} 
                    />
                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} /> Foto lista para enviar
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <label 
                      htmlFor="incident-camera-input"
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 600, padding: '0.65rem 0.5rem', cursor: 'pointer', margin: 0, textAlign: 'center' }}
                    >
                      <Camera size={16} color="var(--primary)" />
                      <span>Tomar Foto con Cámara</span>
                    </label>
                    <label 
                      htmlFor="incident-gallery-input"
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 600, padding: '0.65rem 0.5rem', cursor: 'pointer', margin: 0, textAlign: 'center' }}
                    >
                      <Image size={16} />
                      <span>Cargar Imagen</span>
                    </label>
                  </div>
                )}

                {/* Input con cámara nativa activada por label nativo */}
                <input 
                  id="incident-camera-input"
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  style={{ display: 'none' }}
                  onChange={handleIncidentImageUpload}
                />
                {/* Input galería activado por label nativo */}
                <input 
                  id="incident-gallery-input"
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }}
                  onChange={handleIncidentImageUpload}
                />
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowIncidentModal(false)}
                disabled={submittingIncident || compressingIncidentFoto}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={handleReportIncident}
                disabled={submittingIncident || compressingIncidentFoto}
                style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {compressingIncidentFoto 
                  ? '⏳ Optimizando Foto...' 
                  : submittingIncident 
                    ? 'Transmitiendo Alerta...' 
                    : '🚀 Emitir Alerta a Taller y Jefatura'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Lightbox Modal */}
      {selectedDoc && (
        <DocumentModal 
          documento={selectedDoc} 
          onClose={() => setSelectedDoc(null)} 
          onUploadImage={handleUploadDocumentImage} 
        />
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
        .scan-layout {
          grid-template-columns: 1.1fr 1fr;
        }

        @media (max-width: 768px) {
          .scan-layout {
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

export default ScanQR;
