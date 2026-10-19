import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Navigation, 
  MapPin, 
  Car, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  History, 
  Compass, 
  RotateCcw,
  Sparkles,
  ArrowRight,
  Radio,
  Smartphone,
  Cpu,
  Key,
  Copy,
  Check,
  Battery,
  Gauge,
  Satellite,
  Zap,
  RefreshCw,
  Square,
  Layers,
  ZoomIn,
  ZoomOut,
  ClipboardList,
  Clock,
  Fuel,
  CheckCircle,
  FileText,
  ShieldCheck,
  ShieldAlert,
  User,
  Pause
} from 'lucide-react';
import Toast from '../components/Toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateDrivingRoute, calculateHaversineDistanceKm, CHILE_PRESET_LOCATIONS } from '../services/routingService';

// Capas de mapas con nombres de calles de alta nitidez en español
const MAP_STYLES = {
  GOOGLE_STREETS: {
    id: 'GOOGLE_STREETS',
    name: 'Calles Google (Nítido)',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20
  },
  OSM_STREETS: {
    id: 'OSM_STREETS',
    name: 'Calles OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  SATELLITE_HYBRID: {
    id: 'SATELLITE_HYBRID',
    name: 'Satélite con Calles',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Earth / Maps',
    maxZoom: 20
  },
  DARK_VOYAGER: {
    id: 'DARK_VOYAGER',
    name: 'Modo Oscuro',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }
};

// Coordenadas base en comunas de Santiago con calles y avenidas reconocidas
const FLEET_STATIONS = [
  { name: 'Pudahuel - Av. San Pablo / Américo Vespucio', coords: [-33.4350, -70.7650] },
  { name: 'Santiago Centro - Av. Libertador Bernardo O\'Higgins (Alameda)', coords: [-33.4445, -70.6550] },
  { name: 'Providencia - Av. Providencia / Tobalaba', coords: [-33.4190, -70.6050] },
  { name: 'San Miguel - Gran Avenida José Miguel Carrera', coords: [-33.4900, -70.6550] },
  { name: 'Quilicura - Av. Manuel Antonio Matta', coords: [-33.3600, -70.7300] },
  { name: 'Maipú - Av. Pajaritos / 5 de Abril', coords: [-33.5100, -70.7550] }
];

const PREDEFINED_ROUTES = [
  {
    id: 'R1',
    name: 'Pudahuel Logística ➔ Puerto San Antonio',
    origin: [-33.4350, -70.7650],
    dest: [-33.5928, -71.6127],
    distanceKm: 112,
    estimatedHours: '1h 35m',
    via: 'Autopista del Sol (Ruta 78)'
  },
  {
    id: 'R2',
    name: 'Quilicura ➔ Rancagua Parque Industrial',
    origin: [-33.3600, -70.7300],
    dest: [-34.1701, -70.7407],
    distanceKm: 95,
    estimatedHours: '1h 20m',
    via: 'Ruta 5 Sur'
  },
  {
    id: 'R3',
    name: 'Santiago Alameda ➔ Valparaíso Puerto',
    origin: [-33.4445, -70.6550],
    dest: [-33.0472, -71.6127],
    distanceKm: 121,
    estimatedHours: '1h 40m',
    via: 'Ruta 68'
  },
  {
    id: 'R4',
    name: 'Circuito Reparto Urbano Gran Santiago',
    origin: [-33.4350, -70.7650],
    dest: [-33.4900, -70.6550],
    distanceKm: 46,
    estimatedHours: '1h 10m',
    via: 'Av. Américo Vespucio Express'
  },
  {
    id: 'R5',
    name: 'Hub Santiago ➔ Los Andes Cordillera',
    origin: [-33.4445, -70.6550],
    dest: [-32.8339, -70.5983],
    distanceKm: 138,
    estimatedHours: '2h 05m',
    via: 'Autopista Los Libertadores'
  }
];

const RutasGPS = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('DESPACHO'); // DESPACHO | EN_VIVO | JORNADA | HARDWARE
  const [mapStyle, setMapStyle] = useState('GOOGLE_STREETS'); // Default a Google Streets con nombres de calles en español
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(PREDEFINED_ROUTES[0]);
  const [customDistance, setCustomDistance] = useState('');
  const [customOrigin, setCustomOrigin] = useState('');
  const [customDest, setCustomDest] = useState('');
  const [routeMode, setRouteMode] = useState('PREDEFINED'); // 'PREDEFINED' | 'CUSTOM' | 'LIBRE'
  const [liveTramitesKm, setLiveTramitesKm] = useState(0);
  const lastPosRef = useRef(null);
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [verifiedRouteInfo, setVerifiedRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [tripHistory, setTripHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [copiedText, setCopiedText] = useState('');

  // Estados de Telemetría en Vivo
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [isSimulatingLive, setIsSimulatingLive] = useState(false);
  const [liveTelemetry, setLiveTelemetry] = useState({
    speed: 0,
    heading: 0,
    lat: -33.4445,
    lng: -70.6550,
    satellites: 14,
    battery: 98,
    odometer: 0,
    status: 'DETENIDO'
  });

  // Estados de Bitácora de Jornada (Turnos de Conductores)
  const [activeShift, setActiveShift] = useState(null);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [shiftKmInicial, setShiftKmInicial] = useState('');
  const [shiftCombustibleInicial, setShiftCombustibleInicial] = useState('100% (Lleno)');
  const [shiftNotasInicial, setShiftNotasInicial] = useState('');
  const [shiftKmFinal, setShiftKmFinal] = useState('');
  const [shiftCombustibleFinal, setShiftCombustibleFinal] = useState('75% (3/4)');
  const [shiftNotasFinal, setShiftNotasFinal] = useState('');
  const [processingShift, setProcessingShift] = useState(false);
  const [isOdometerBroken, setIsOdometerBroken] = useState(false);
  const isAdmin = user?.role === 'ADMIN';
  const isMecanico = user?.role === 'MECANICO';
  const [driversList, setDriversList] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const currentTileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const customWaypointsLayerRef = useRef(null);
  const liveTrailPolylineRef = useRef(null);
  const simulationIntervalRef = useRef(null);
  const geoWatchIdRef = useRef(null);

  // Cargar flota de vehículos y datos de jornadas
  const loadFleet = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const list = await api.getTodosLosVehiculos();
      setVehicles(list);
      if (list.length > 0) {
        setSelectedVehicleId(prev => prev || list[0].id);
        setLiveTelemetry(prev => ({ ...prev, odometer: list[0].kilometraje || 0 }));
        setShiftKmInicial(prev => prev || list[0].kilometraje || '');
      }

      try {
        const users = await api.getUsuarios();
        if (Array.isArray(users)) {
          setDriversList(users);
        }
      } catch (uErr) {
        console.warn("Aviso al cargar usuarios en RutasGPS:", uErr);
      }
    } catch (e) {
      console.error("Error al cargar vehículos para GPS:", e);
      if (!isSilent) setToast({ message: 'No se pudo conectar con el servicio de flota.', type: 'error' });
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  const loadBackendShiftHistory = useCallback(async () => {
    try {
      let serverTurnos = [];
      if (user?.role === 'CONDUCTOR' && user?.id) {
        serverTurnos = await api.getHistorialTurnosConductor(user.id);
      } else {
        serverTurnos = await api.getTurnosRecientes();
      }

      if (Array.isArray(serverTurnos) && serverTurnos.length > 0) {
        const mapped = serverTurnos.map(t => {
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
            conductorNombre: t.conductorNombre || 'Conductor',
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
            notas: t.observaciones || 'Sin novedad'
          };
        });

        let localHist = [];
        try {
          const saved = localStorage.getItem('vehiculospro_historial_jornadas');
          if (saved) localHist = JSON.parse(saved);
        } catch (e) {}

        const seen = new Set();
        const merged = [];
        for (const item of [...mapped, ...localHist]) {
          const key = `${item.id}-${item.patente}`;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(item);
          }
        }
        setShiftHistory(merged);
      }
    } catch (e) {
      console.warn("Aviso al cargar historial de turnos desde MySQL:", e);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    loadFleet();
    loadBackendShiftHistory();

    // Polling automático protegido cada 15 segundos (solo con pestaña en primer plano)
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadFleet(true);
      }
    }, 15000);

    const handleStorageChange = () => {
      loadFleet(true);
      loadBackendShiftHistory();
    };
    window.addEventListener('storage', handleStorageChange);

    // Historial de viajes
    const savedTrips = localStorage.getItem('vehiculospro_trip_history');
    if (savedTrips) {
      try {
        setTripHistory(JSON.parse(savedTrips));
      } catch (e) {}
    }

    // Jornada activa guardada
    const savedActiveShift = localStorage.getItem('vehiculospro_jornada_activa');
    if (savedActiveShift) {
      try {
        setActiveShift(JSON.parse(savedActiveShift));
      } catch (e) {}
    }

    // Historial de jornadas guardado
    const savedShiftHist = localStorage.getItem('vehiculospro_historial_jornadas');
    if (savedShiftHist) {
      try {
        setShiftHistory(JSON.parse(savedShiftHist));
      } catch (e) {}
    }

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageChange);
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      if (geoWatchIdRef.current) navigator.geolocation.clearWatch(geoWatchIdRef.current);
    };
  }, [loadFleet, loadBackendShiftHistory]);

  // Inicializar mapa de Leaflet con zoom a nivel de calles (zoom 14)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-33.4445, -70.6550],
      zoom: 14,
      zoomControl: true
    });

    const initialConfig = MAP_STYLES.GOOGLE_STREETS;
    const tileLayer = L.tileLayer(initialConfig.url, {
      attribution: initialConfig.attribution,
      maxZoom: initialConfig.maxZoom
    }).addTo(map);

    currentTileLayerRef.current = tileLayer;
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Cambio dinámico de Capas
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const cfg = MAP_STYLES[mapStyle] || MAP_STYLES.GOOGLE_STREETS;
    currentTileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      subdomains: cfg.subdomains || 'abc',
      maxZoom: cfg.maxZoom
    }).addTo(map);
  }, [mapStyle]);

  // Actualizar marcadores de la flota en el mapa
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    const liveMap = api.getTelemetriaFlota();

    vehicles.forEach((veh, index) => {
      const baseStation = FLEET_STATIONS[index % FLEET_STATIONS.length];
      const hasLive = liveMap[veh.id];
      const lat = hasLive ? hasLive.lat : (veh.latitud || baseStation.coords[0]);
      const lng = hasLive ? hasLive.lng : (veh.longitud || baseStation.coords[1]);

      const hasAlerts = veh.alertas && veh.alertas.length > 0;
      const markerColor = hasLive?.estado === 'EN_RUTA' ? '#0284c7' : (hasAlerts ? '#ef4444' : '#10b981');
      const statusText = hasLive?.estado === 'EN_RUTA' ? `En Movimiento (${hasLive.velocidad} km/h)` : (hasAlerts ? '¡Mantenimiento Pendiente!' : 'En Regla');

      const customIcon = L.divIcon({
        className: 'custom-fleet-pin',
        html: `
          <div style="
            background: #0f172a;
            border: 2px solid ${markerColor};
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
            border-radius: 8px;
            padding: 4px 8px;
            display: flex;
            align-items: center;
            gap: 5px;
            color: #ffffff;
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            transform: translate(-50%, -50%);
          ">
            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${markerColor};"></span>
            <span>${veh.patente || `ID:${veh.id}`}</span>
          </div>
        `,
        iconSize: [85, 28],
        iconAnchor: [42, 14]
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; color: #1e293b; min-width: 220px;">
          <h4 style="margin: 0 0 4px; font-weight: 700; color: #0f172a;">${veh.marca} ${veh.modelo}</h4>
          <div style="margin-bottom: 6px; font-size: 11px; color: #64748b;">
            Patente: <strong>${veh.patente || 'S/P'}</strong> | Año: ${veh.anio}
          </div>
          <div style="padding: 6px 8px; background: #f1f5f9; border-radius: 6px; margin-bottom: 8px; font-size: 12px;">
            <div>Odómetro: <strong>${(veh.kilometraje ?? 0).toLocaleString()} km</strong></div>
            <div>Ubicación: <strong>${baseStation.name}</strong></div>
            <div>Conductor: <strong style="color: #2563eb;">${veh.propietarioNombre || (activeShift && activeShift.vehiculoId === veh.id ? activeShift.conductorNombre : 'Sin asignar')}</strong></div>
          </div>
          <div style="font-size: 11px; font-weight: 600; color: ${markerColor};">
            Estado: ${statusText}
          </div>
        </div>
      `);

      marker.on('click', () => {
        map.flyTo([lat, lng], 16, { duration: 1.2 });
        setSelectedVehicleId(veh.id);
      });

      markersLayer.addLayer(marker);
    });
  }, [vehicles, liveTelemetry, activeShift]);

  const activeVehicle = vehicles.find(v => v.id === Number(selectedVehicleId)) || null;
  const isCustom = routeMode === 'CUSTOM';
  const isLibre = routeMode === 'LIBRE';
  const currentDistanceKm = isLibre 
    ? Number(liveTramitesKm.toFixed(1)) 
    : (isCustom ? Number(customDistance || 0) : selectedRoute.distanceKm);
  const projectedKm = activeVehicle ? (activeVehicle.kilometraje + currentDistanceKm) : 0;

  // Regla de Negocio: Validar si el vehículo tiene conductor asignado responsable
  const hasAssignedDriver = !!(
    activeVehicle?.propietarioId || 
    (selectedDriverId && selectedDriverId !== 'NONE') || 
    (activeShift && activeShift.vehiculoId === activeVehicle?.id)
  );

  // Actualizar km inicial al cambiar de vehículo
  useEffect(() => {
    if (activeVehicle && !activeShift) {
      setShiftKmInicial(activeVehicle.kilometraje || '');
    }
  }, [selectedVehicleId, activeVehicle, activeShift]);

  // Enfocar vehículo en nivel de calle (Zoom 16)
  const handleZoomToStreetLevel = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeVehicle) {
      const idx = vehicles.findIndex(v => v.id === activeVehicle.id);
      const baseStation = FLEET_STATIONS[idx >= 0 ? idx % FLEET_STATIONS.length : 0];
      const lat = activeVehicle.latitud || baseStation.coords[0];
      const lng = activeVehicle.longitud || baseStation.coords[1];
      map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
      setToast({ message: `Mostrando calles y avenidas de ${activeVehicle.marca} (${activeVehicle.patente}) a nivel de detalle.`, type: 'info' });
    } else {
      map.flyTo([-33.4445, -70.6550], 16, { animate: true, duration: 1.2 });
    }
  };

  const handleZoomOverview = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([-33.4489, -70.6693], 10, { animate: true, duration: 1.2 });
  };

  // Análisis predictivo
  const checkPredictiveImpact = () => {
    if (!activeVehicle || currentDistanceKm <= 0) return null;

    const kmProyectado = activeVehicle.kilometraje + currentDistanceKm;
    const proxAceite = Math.ceil(activeVehicle.kilometraje / 10000) * 10000;
    const proxFrenos = Math.ceil(activeVehicle.kilometraje / 20000) * 20000;

    if (kmProyectado >= proxAceite) {
      return {
        tipo: 'Cambio de Aceite y Filtros',
        kmLimite: proxAceite,
        excesoKm: kmProyectado - proxAceite,
        urgencia: 'CRITICA'
      };
    } else if (kmProyectado >= proxFrenos) {
      return {
        tipo: 'Inspección de Frenos y Balatas',
        kmLimite: proxFrenos,
        excesoKm: kmProyectado - proxFrenos,
        urgencia: 'CRITICA'
      };
    } else if (proxAceite - kmProyectado <= 500) {
      return {
        tipo: 'Cambio de Aceite Preventivo',
        kmLimite: proxAceite,
        kmRestantes: proxAceite - kmProyectado,
        urgencia: 'ADVERTENCIA'
      };
    }
    return null;
  };

  const predictiveImpact = checkPredictiveImpact();

  // Dibujar ruta seleccionada
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
    if (customWaypointsLayerRef.current) {
      map.removeLayer(customWaypointsLayerRef.current);
      customWaypointsLayerRef.current = null;
    }

    if (!isCustom && selectedRoute) {
      const latlngs = [selectedRoute.origin, selectedRoute.dest];
      routePolylineRef.current = L.polyline(latlngs, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round'
      }).addTo(map);

      map.fitBounds(routePolylineRef.current.getBounds(), { padding: [50, 50] });
    }
  }, [selectedRoute, isCustom]);

  // Dibujar rastro telemetría en vivo
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeVehicle) return;

    const history = api.getHistorialTelemetria(activeVehicle.id);
    if (history.length > 1) {
      if (liveTrailPolylineRef.current) {
        map.removeLayer(liveTrailPolylineRef.current);
      }
      const coords = history.map(h => [h.lat, h.lng]);
      liveTrailPolylineRef.current = L.polyline(coords, {
        color: '#0284c7',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round'
      }).addTo(map);
    }
  }, [liveTelemetry, activeVehicle]);

  // Despacho de Ruta y Actualización de Odómetro
  const handleDispatchTrip = async () => {
    if (!activeVehicle) {
      setToast({ message: 'Por favor seleccione un vehículo de la flota.', type: 'warning' });
      return;
    }

    // Regla de Negocio Estricta: Solo se puede despachar y actualizar odómetro si tiene un conductor asignado
    const assignedDriverName = activeVehicle.propietarioNombre || 
      (selectedDriverId && selectedDriverId !== 'NONE' ? driversList.find(d => String(d.id) === String(selectedDriverId))?.fullName : null) ||
      (activeShift && activeShift.vehiculoId === activeVehicle.id ? activeShift.conductorNombre : null);

    const assignedDriverId = activeVehicle.propietarioId || (selectedDriverId && selectedDriverId !== 'NONE' ? Number(selectedDriverId) : null);

    if (!hasAssignedDriver || !assignedDriverName || assignedDriverName === 'Sin asignar') {
      setToast({ 
        message: '🚫 Bloqueo de seguridad: No se puede despachar ni actualizar el odómetro de un vehículo sin un conductor asignado responsable.', 
        type: 'error' 
      });
      return;
    }

    if (currentDistanceKm <= 0) {
      if (isLibre) {
        setToast({ message: 'En modo Trámites Varios debe iniciar el rastreo GPS y registrar movimiento antes de actualizar el odómetro.', type: 'warning' });
      } else {
        setToast({ message: 'La distancia debe ser mayor a 0 km.', type: 'warning' });
      }
      return;
    }

    setDispatching(true);
    try {
      const nuevoOdometro = activeVehicle.kilometraje + currentDistanceKm;

      const updatedPayload = {
        marca: activeVehicle.marca,
        modelo: activeVehicle.modelo,
        anio: activeVehicle.anio,
        patente: activeVehicle.patente,
        kilometraje: nuevoOdometro,
        propietarioId: assignedDriverId
      };

      await api.actualizarVehiculo(activeVehicle.id, updatedPayload);

      setVehicles(prev => prev.map(v => v.id === activeVehicle.id ? { 
        ...v, 
        kilometraje: nuevoOdometro,
        propietarioId: assignedDriverId,
        propietarioNombre: assignedDriverName
      } : v));

      const routeTitle = isLibre 
        ? 'Trámites Varios / Conducción Libre (GPS Real)' 
        : (isCustom ? `${customOrigin} ➔ ${customDest}` : selectedRoute.name);

      const newRecord = {
        id: Date.now(),
        fecha: new Date().toLocaleString('es-CL'),
        vehiculo: `${activeVehicle.marca} ${activeVehicle.modelo}`,
        patente: activeVehicle.patente,
        conductor: assignedDriverName,
        ruta: routeTitle,
        distanciaKm: currentDistanceKm,
        odometroNuevo: nuevoOdometro,
        impacto: predictiveImpact
      };

      const updatedHistory = [newRecord, ...tripHistory.slice(0, 19)];
      setTripHistory(updatedHistory);
      localStorage.setItem('vehiculospro_trip_history', JSON.stringify(updatedHistory));

      if (isLibre) {
        setLiveTramitesKm(0);
      }

      setToast({
        message: `¡${isLibre ? 'Trámites finalizados' : 'Ruta despachada'} con éxito! Conductor: ${assignedDriverName}. Odómetro actualizado a ${nuevoOdometro.toLocaleString()} km.`,
        type: 'success'
      });
    } catch (e) {
      console.error("Error al despachar viaje:", e);
      setToast({ message: 'Error al actualizar odómetro del vehículo en el servidor.', type: 'error' });
    } finally {
      setDispatching(false);
    }
  };

  // --- CÁLCULO DE RUTA GPS VERÍDICA MEDIANTE NOMINATIM Y OSRM ---
  const handleCalculateCustomGpsRoute = async () => {
    if (!customOrigin || !customOrigin.trim()) {
      setToast({ message: 'Ingrese una dirección o comuna de origen (Ej: Alameda 1302, Santiago).', type: 'warning' });
      return;
    }
    if (!customDest || !customDest.trim()) {
      setToast({ message: 'Ingrese una dirección o comuna de destino (Ej: Av. Vitacura 5000, Vitacura).', type: 'warning' });
      return;
    }

    setCalculatingRoute(true);
    try {
      const result = await calculateDrivingRoute(customOrigin, customDest, isRoundTrip);
      
      setCustomDistance(result.distanceKm);
      setVerifiedRouteInfo(result);

      // Dibujar ruta real calle por calle en el mapa Leaflet
      const map = mapInstanceRef.current;
      if (map) {
        if (routePolylineRef.current) {
          map.removeLayer(routePolylineRef.current);
        }
        if (customWaypointsLayerRef.current) {
          map.removeLayer(customWaypointsLayerRef.current);
        }

        routePolylineRef.current = L.polyline(result.coordinates, {
          color: '#10b981',
          weight: 6,
          opacity: 0.9,
          lineCap: 'round'
        }).addTo(map);

        const waypointsGroup = L.layerGroup();
        const startIcon = L.divIcon({
          className: 'custom-gps-pin',
          html: `<div style="background: #10b981; color: white; padding: 3px 8px; border-radius: 10px; font-weight: 800; font-size: 11px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 4px; white-space: nowrap;">🟢 Origen</div>`,
          iconSize: [60, 24],
          iconAnchor: [30, 12]
        });
        const destIcon = L.divIcon({
          className: 'custom-gps-pin',
          html: `<div style="background: #ef4444; color: white; padding: 3px 8px; border-radius: 10px; font-weight: 800; font-size: 11px; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 4px; white-space: nowrap;">🔴 Destino</div>`,
          iconSize: [60, 24],
          iconAnchor: [30, 12]
        });

        L.marker(result.originCoords, { icon: startIcon }).addTo(waypointsGroup);
        L.marker(result.destCoords, { icon: destIcon }).addTo(waypointsGroup);
        waypointsGroup.addTo(map);
        customWaypointsLayerRef.current = waypointsGroup;

        map.fitBounds(routePolylineRef.current.getBounds(), { padding: [50, 50] });
      }

      setToast({
        message: `¡Ruta calculada con satélite GPS! ${result.distanceKm} km reales por carretera (${result.durationText}).`,
        type: 'success'
      });
    } catch (e) {
      console.error("Error al calcular ruta GPS:", e);
      setToast({ message: e.message || 'No se pudo geocodificar la dirección. Intente agregando la comuna.', type: 'error' });
    } finally {
      setCalculatingRoute(false);
    }
  };

  // --- BITÁCORA DE JORNADA (INICIO Y CIERRE DE TURNO) ---
  const handleStartShift = async () => {
    if (!activeVehicle) {
      setToast({ message: 'Por favor seleccione un vehículo para iniciar la jornada.', type: 'warning' });
      return;
    }

    if (activeVehicle.activo === false) {
      setToast({ 
        message: `El vehículo ${activeVehicle.patente} se encuentra APAGADO / FUERA DE SERVICIO por el Administrador. No es posible iniciar jornada.`, 
        type: 'error' 
      });
      return;
    }

    const km = Number(shiftKmInicial);
    if (isNaN(km) || km < 0) {
      setToast({ message: 'Por favor ingrese un kilometraje inicial válido.', type: 'warning' });
      return;
    }

    const targetDriver = (isAdmin || isMecanico) && selectedDriverId
      ? (driversList.find(d => String(d.id) === String(selectedDriverId)) || user)
      : user;

    const esDespachoAdmin = (isAdmin || isMecanico) && targetDriver.id !== user?.id;

    setProcessingShift(true);
    try {
      // 1. Registrar turno formal en la base de datos MySQL (Backend API)
      let backendTurno = null;
      try {
        backendTurno = await api.iniciarTurno({
          vehiculoId: activeVehicle.id,
          conductorId: targetDriver.id,
          iniciadorId: user?.id,
          kmInicio: km,
          tipoSalida: isOdometerBroken ? 'REPARTO_DINAMICO_GPS' : 'ESTANDAR',
          observaciones: shiftNotasInicial || (
            esDespachoAdmin 
              ? `[DESPACHO ADMINISTRATIVO]: Despachado por ${user?.fullName || user?.username} a ${targetDriver.fullName || targetDriver.username}.`
              : (isOdometerBroken ? 'Odómetro físico averiado (cálculo virtual GPS)' : 'Sin observaciones al inicio')
          )
        });
      } catch (tErr) {
        console.warn("Aviso al registrar turno en base de datos central:", tErr);
      }

      // 2. Asignar oficialmente al conductor en la base de datos MySQL mediante la API
      try {
        await api.actualizarVehiculo(activeVehicle.id, {
          ...activeVehicle,
          propietarioId: targetDriver.id,
          kilometraje: km
        });
        setVehicles(prev => prev.map(v => v.id === activeVehicle.id ? { 
          ...v, 
          propietarioId: targetDriver.id, 
          propietarioNombre: targetDriver.fullName || targetDriver.username 
        } : v));
      } catch (errApi) {
        console.warn("Aviso al sincronizar en backend:", errApi);
      }

      const newShift = {
        id: backendTurno?.id || Date.now(),
        backendTurnoId: backendTurno?.id || null,
        vehiculoId: activeVehicle.id,
        vehiculoNombre: `${activeVehicle.marca} ${activeVehicle.modelo}`,
        patente: activeVehicle.patente || 'S/P',
        conductorId: targetDriver.id,
        conductorNombre: targetDriver.fullName || targetDriver.username || 'Conductor',
        iniciadoPor: user?.fullName || user?.username || 'Torre de Control',
        esDespachoAdministrativo: esDespachoAdmin,
        kmInicial: km,
        kmGpsAcumulados: 0,
        puntosGpsCount: 0,
        velocidadActual: 0,
        combustibleInicial: shiftCombustibleInicial,
        notasInicial: shiftNotasInicial || (
          esDespachoAdmin 
            ? `[DESPACHO ADMINISTRATIVO]: Despachado por ${user?.fullName || user?.username} a ${targetDriver.fullName || targetDriver.username}.`
            : (isOdometerBroken ? 'Odómetro físico averiado (cálculo virtual GPS)' : 'Sin observaciones al inicio')
        ),
        odometroAveriado: isOdometerBroken,
        inicioTimestamp: new Date().toISOString(),
        fechaInicioStr: new Date().toLocaleString('es-CL')
      };

      setActiveShift(newShift);
      localStorage.setItem('vehiculospro_jornada_activa', JSON.stringify(newShift));
      setShiftKmFinal(km);
      setToast({
        message: esDespachoAdmin
          ? `🚀 ¡Despacho exitoso! Vehículo ${activeVehicle.patente} asignado a ${targetDriver.fullName || targetDriver.username} por Supervisión.`
          : `¡Jornada iniciada con éxito! Vehículo ${activeVehicle.patente} asignado a ${targetDriver.fullName || targetDriver.username}. ${isOdometerBroken ? '(Modo Odómetro Virtual GPS activo)' : ''}`,
        type: 'success'
      });
    } finally {
      setProcessingShift(false);
    }
  };

  const handleEndShift = async () => {
    if (!activeShift) return;

    const kmFin = Number(shiftKmFinal);
    if (isNaN(kmFin) || kmFin < activeShift.kmInicial) {
      setToast({
        message: `El kilometraje final (${kmFin || 0} km) no puede ser menor al inicial (${activeShift.kmInicial} km).`,
        type: 'warning'
      });
      return;
    }

    const esCierreAdmin = (isAdmin || isMecanico) && activeShift.conductorId !== user?.id;

    setProcessingShift(true);
    try {
      const targetVeh = vehicles.find(v => v.id === activeShift.vehiculoId);
      if (targetVeh) {
        // Actualizar odómetro oficial en la API y MySQL
        await api.actualizarVehiculo(targetVeh.id, {
          marca: targetVeh.marca,
          modelo: targetVeh.modelo,
          anio: targetVeh.anio,
          patente: targetVeh.patente,
          kilometraje: kmFin,
          propietarioId: targetVeh.propietarioId
        });

        // Actualizar lista en pantalla
        setVehicles(prev => prev.map(v => v.id === targetVeh.id ? { ...v, kilometraje: kmFin } : v));
      }

      const kmRecorridos = kmFin - activeShift.kmInicial;
      const duracionMin = Math.max(1, Math.round((Date.now() - new Date(activeShift.inicioTimestamp).getTime()) / 60000));
      const horas = Math.floor(duracionMin / 60);
      const minutos = duracionMin % 60;
      const duracionTexto = horas > 0 ? `${horas}h ${minutos}m` : `${minutos} min`;

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
            ? `[CIERRE FORZADO ADMINISTRATIVO]: Cerrado por ${user?.fullName || user?.username} (Supervisor/Torre de Control).`
            : (activeShift.odometroAveriado ? 'Odómetro virtual acumulado por GPS/Rutas' : activeShift.notasInicial)
        )
      };

      // Persistir cierre en base de datos MySQL (Backend API)
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

      const updatedHistory = [completedRecord, ...shiftHistory.slice(0, 29)];
      setShiftHistory(updatedHistory);
      localStorage.setItem('vehiculospro_historial_jornadas', JSON.stringify(updatedHistory));
      localStorage.removeItem('vehiculospro_jornada_activa');
      setActiveShift(null);
      setShiftNotasFinal('');
      loadBackendShiftHistory();


      setToast({
        message: esCierreAdmin
          ? `🛑 Jornada de ${activeShift.conductorNombre} cerrada administrativamente por Supervisión (+${kmRecorridos} km). Ficha actualizada.`
          : `¡Jornada finalizada! Se recorrieron +${kmRecorridos} km (${duracionTexto}). Ficha del vehículo actualizada.`,
        type: 'success'
      });
    } catch (e) {
      console.error("Error al finalizar jornada:", e);
      setToast({ message: 'Error al sincronizar odómetro final en el servidor.', type: 'error' });
    } finally {
      setProcessingShift(false);
    }
  };

  // Transmisión GPS real
  const toggleRealGpsTracking = () => {
    if (isLiveTracking) {
      if (geoWatchIdRef.current) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
      setIsLiveTracking(false);
      setLiveTelemetry(prev => ({ ...prev, status: 'DETENIDO', speed: 0 }));
      setToast({ message: 'Transmisión GPS en vivo detenida.', type: 'info' });
      return;
    }

    if (!('geolocation' in navigator)) {
      setToast({ message: 'Este dispositivo no soporta geolocalización GPS.', type: 'error' });
      return;
    }

    if (!activeVehicle) {
      setToast({ message: 'Seleccione un vehículo para transmitir su GPS.', type: 'warning' });
      return;
    }

    setIsLiveTracking(true);
    setToast({ message: 'Conectando con satélites GPS del dispositivo...', type: 'info' });

    let lastPos = null;

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        const currentSpeedKmh = speed ? Math.round(speed * 3.6) : (lastPos ? 45 : 0);
        
        if (lastPos) {
          const deltaKm = calculateHaversineDistanceKm(lastPos.latitude, lastPos.longitude, latitude, longitude);
          if (deltaKm >= 0.008 && deltaKm < 3.0) {
            setLiveTramitesKm(prev => Number((prev + deltaKm).toFixed(2)));
          }
        }
        lastPos = { latitude, longitude };

        const teleData = {
          vehiculoId: activeVehicle.id,
          patente: activeVehicle.patente,
          lat: latitude,
          lng: longitude,
          velocidad: currentSpeedKmh,
          rumbo: heading || 180,
          odometro: activeVehicle.kilometraje,
          bateria: 95,
          satelites: 15
        };

        await api.enviarTelemetriaGps(teleData);

        setLiveTelemetry({
          speed: currentSpeedKmh,
          heading: heading || 180,
          lat: latitude,
          lng: longitude,
          satellites: 15,
          battery: 95,
          odometer: activeVehicle.kilometraje,
          status: currentSpeedKmh > 5 ? 'EN_RUTA' : 'RALENTÍ'
        });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([latitude, longitude]);
        }
      },
      (err) => {
        console.warn("Error GPS real:", err);
        setToast({ message: `Aviso GPS: ${err.message}. Puedes probar la 'Simulación en Carretera'.`, type: 'warning' });
        setIsLiveTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  };

  // Simulación de conducción en carretera
  const toggleHighwaySimulation = () => {
    if (isSimulatingLive) {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
        simulationIntervalRef.current = null;
      }
      setIsSimulatingLive(false);
      setLiveTelemetry(prev => ({ ...prev, status: 'DETENIDO', speed: 0 }));
      setToast({ message: 'Simulación de telemetría detenida.', type: 'info' });
      return;
    }

    if (!activeVehicle) {
      setToast({ message: 'Seleccione un vehículo para simular su recorrido.', type: 'warning' });
      return;
    }

    setIsSimulatingLive(true);
    setToast({ message: 'Iniciando simulación de viaje en vivo a 82 km/h...', type: 'success' });

    const waypoints = [
      [-33.4445, -70.6550], // Alameda
      [-33.4500, -70.6850], // Estación Central
      [-33.4720, -70.7420], // Pajaritos / Vespucio
      [-33.5150, -70.8200], // Padre Hurtado
      [-33.5500, -70.9200], // Peñaflor
      [-33.5928, -71.6127]  // San Antonio
    ];

    let wpIndex = 0;
    let currentKm = activeVehicle.kilometraje;

    simulationIntervalRef.current = setInterval(async () => {
      wpIndex = (wpIndex + 1) % waypoints.length;
      const targetPoint = waypoints[wpIndex];
      const jitterLat = targetPoint[0] + (Math.random() - 0.5) * 0.002;
      const jitterLng = targetPoint[1] + (Math.random() - 0.5) * 0.002;
      const instantSpeed = Math.floor(75 + Math.random() * 15);
      currentKm += 1;

      const teleData = {
        vehiculoId: activeVehicle.id,
        patente: activeVehicle.patente,
        lat: jitterLat,
        lng: jitterLng,
        velocidad: instantSpeed,
        rumbo: 245,
        odometro: currentKm,
        bateria: 92,
        satelites: 14
      };

      await api.enviarTelemetriaGps(teleData);

      setLiveTelemetry({
        speed: instantSpeed,
        heading: 245,
        lat: jitterLat,
        lng: jitterLng,
        satellites: 14,
        battery: 92,
        odometer: currentKm,
        status: 'EN_RUTA'
      });

      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo([jitterLat, jitterLng]);
      }
    }, 2500);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* Header Corporativo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              MÓDULO DE TELEMETRÍA Y LOGÍSTICA
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Calles en Español • Sin Costo de API Key
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            Monitoreo GPS y Despacho Automatizado
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
            Ubicación exacta del móvil, bitácora de turnos de choferes y control de odómetro en tiempo real.
          </p>
        </div>

        {/* Selector de Pestañas */}
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)', gap: '4px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('DESPACHO')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'DESPACHO' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'DESPACHO' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Navigation size={16} />
            <span>Despacho y Rutas</span>
          </button>

          <button
            onClick={() => setActiveTab('EN_VIVO')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'EN_VIVO' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
              color: activeTab === 'EN_VIVO' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Radio size={16} color={isLiveTracking || isSimulatingLive ? '#4ade80' : 'currentColor'} />
            <span>Telemetría en Vivo</span>
            {(isLiveTracking || isSimulatingLive) && (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', animation: 'pulse 1s infinite' }} />
            )}
          </button>

          {/* NUEVA PESTAÑA: BITÁCORA DE JORNADA */}
          <button
            onClick={() => setActiveTab('JORNADA')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'JORNADA' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: activeTab === 'JORNADA' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <ClipboardList size={16} color={activeShift ? '#4ade80' : 'currentColor'} />
            <span>Bitácora de Jornada</span>
            {activeShift && (
              <span style={{ fontSize: '0.62rem', background: '#22c55e', color: '#090d16', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
                TURNO ACTIVO
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('HARDWARE')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'HARDWARE' ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeTab === 'HARDWARE' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <Cpu size={16} />
            <span>Dispositivos GPS & API</span>
          </button>
        </div>
      </div>

      {/* MAPA PRINCIPAL INTERACTIVO CON BARRA DE CALLES Y CAPAS */}
      <div className="glass-card" style={{ padding: '0.75rem', position: 'relative' }}>
        
        {/* Barra superior de control del mapa */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.5rem 0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          
          {/* Selector de Estilo de Mapa */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Layers size={14} color="var(--primary)" />
              Capa de Mapa:
            </span>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '6px' }}>
              {Object.values(MAP_STYLES).map(style => (
                <button
                  key={style.id}
                  onClick={() => setMapStyle(style.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: mapStyle === style.id ? 700 : 500,
                    background: mapStyle === style.id ? 'var(--primary)' : 'transparent',
                    color: mapStyle === style.id ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          {/* Botones de Zoom para ver Calles de Cerca */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handleZoomToStreetLevel}
              className="btn btn-secondary"
              style={{
                fontSize: '0.8rem',
                padding: '5px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                borderColor: 'rgba(59, 130, 246, 0.3)'
              }}
              title="Acercar al máximo para ver nombres de todas las calles y pasajes"
            >
              <ZoomIn size={14} />
              <span>Ver Calles (Zoom Calle)</span>
            </button>

            <button
              onClick={handleZoomOverview}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
              title="Vista general de toda la flota"
            >
              <ZoomOut size={14} />
              <span>Vista General</span>
            </button>

            <button
              onClick={() => {
                loadFleet(false);
                setToast({ message: 'Flota y conductores sincronizados con el servidor.', type: 'info' });
              }}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}
              title="Sincronizar choferes y turnos de la flota en tiempo real"
            >
              <RefreshCw size={14} />
              <span>Sincronizar Flota</span>
            </button>
          </div>
        </div>

        {/* Contenedor del Mapa Leaflet */}
        <div 
          ref={mapContainerRef} 
          style={{ 
            height: '440px', 
            width: '100%', 
            borderRadius: 'var(--radius-md)', 
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            position: 'relative',
            zIndex: 1
          }} 
        />

        {/* Leyenda inferior */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.5rem 0', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>🟢 Flota al Día</span>
            <span style={{ color: '#ef4444', fontWeight: 600 }}>🔴 Mantención Requerida</span>
            <span style={{ color: '#0284c7', fontWeight: 600 }}>🔵 En Movimiento</span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>
            💡 <em>Ubicación exacta: Haz clic en cualquier vehículo para situarte en su esquina o calle.</em>
          </span>
        </div>
      </div>

      {/* PESTAÑA 1: DESPACHO Y RUTAS PREDICTIVAS */}
      {activeTab === 'DESPACHO' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '1.5rem' }} className="responsive-grid">
          {/* Panel Izquierdo: Selección de Vehículo y Ruta */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Car size={18} color="var(--primary)" />
              1. Seleccionar Vehículo de la Flota
            </h3>

            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando vehículos...</div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Vehículo a despachar:
                </label>
                <select
                  className="input-field"
                  value={selectedVehicleId}
                  onChange={(e) => {
                    setSelectedVehicleId(e.target.value);
                    const v = vehicles.find(veh => veh.id === Number(e.target.value));
                    if (v && mapInstanceRef.current) {
                      const idx = vehicles.findIndex(veh => veh.id === v.id);
                      const baseStation = FLEET_STATIONS[idx >= 0 ? idx % FLEET_STATIONS.length : 0];
                      mapInstanceRef.current.flyTo([v.latitud || baseStation.coords[0], v.longitud || baseStation.coords[1]], 16);
                    }
                  }}
                  style={{ width: '100%', fontWeight: 600 }}
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.activo !== false ? '🚗' : '🛑'} {v.marca} {v.modelo} ({v.patente || 'S/P'}) {v.activo === false ? '[APAGADO / FUERA DE SERVICIO]' : ''} - Odómetro: {(v.kilometraje || 0).toLocaleString()} km
                    </option>
                  ))}
                </select>

                {activeVehicle && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Conductor Asignado:</span>
                      <strong style={{ color: (activeVehicle.propietarioNombre || (activeShift && activeShift.vehiculoId === activeVehicle.id)) ? 'var(--primary)' : 'var(--text-muted)' }}>
                        👤 {activeVehicle.propietarioNombre || (activeShift && activeShift.vehiculoId === activeVehicle.id ? activeShift.conductorNombre : 'Sin asignar')}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Kilometraje en Tablero:</span>
                      <strong style={{ color: 'var(--primary)' }}>{(activeVehicle.kilometraje || 0).toLocaleString()} km</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Navigation size={18} color="#10b981" />
              2. Configurar Ruta de Despacho
            </h3>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn ${routeMode === 'PREDEFINED' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, minWidth: '110px', fontSize: '0.78rem', padding: '0.5rem 0.6rem', whiteSpace: 'nowrap' }}
                onClick={() => setRouteMode('PREDEFINED')}
              >
                🚚 Rutas Predefinidas
              </button>
              <button
                type="button"
                className={`btn ${routeMode === 'CUSTOM' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, minWidth: '110px', fontSize: '0.78rem', padding: '0.5rem 0.6rem', whiteSpace: 'nowrap' }}
                onClick={() => setRouteMode('CUSTOM')}
              >
                📍 Ruta Personalizada
              </button>
              <button
                type="button"
                className={`btn ${routeMode === 'LIBRE' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, minWidth: '110px', fontSize: '0.78rem', padding: '0.5rem 0.6rem', whiteSpace: 'nowrap' }}
                onClick={() => setRouteMode('LIBRE')}
              >
                🚗 Trámites Varios / Libre
              </button>
            </div>

            {routeMode === 'PREDEFINED' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {PREDEFINED_ROUTES.map(route => {
                  const isSelected = selectedRoute.id === route.id;
                  return (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRoute(route)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255,255,255,0.02)',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? '#ffffff' : 'var(--text-secondary)' }}>
                          {route.name}
                        </span>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem' }}>
                          +{route.distanceKm} km
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span>Vía: {route.via}</span>
                        <span>⏱️ {route.estimatedHours}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {routeMode === 'CUSTOM' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Origen */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} color="#10b981" />
                      Origen (Calle, Número, Comuna):
                    </label>
                  </div>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: Alameda 1302, Santiago (o seleccione un punto rápido)"
                    value={customOrigin}
                    onChange={(e) => {
                      setCustomOrigin(e.target.value);
                      setVerifiedRouteInfo(null);
                    }}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                  {/* Puntos de origen rápidos de flota */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {CHILE_PRESET_LOCATIONS.slice(0, 3).map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setCustomOrigin(preset.address);
                          setVerifiedRouteInfo(null);
                        }}
                        style={{
                          background: customOrigin === preset.address ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: customOrigin === preset.address ? '1px solid #10b981' : '1px solid var(--border-color)',
                          color: customOrigin === preset.address ? '#10b981' : 'var(--text-muted)',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          cursor: 'pointer'
                        }}
                      >
                        {preset.name.split('(')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Destino */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <MapPin size={14} color="#ef4444" style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
                    Destino Real (Calle, Número, Comuna en Chile):
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ej: Av. Vitacura 5000, Vitacura (o Plaza de Maipú)"
                    value={customDest}
                    onChange={(e) => {
                      setCustomDest(e.target.value);
                      setVerifiedRouteInfo(null);
                    }}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                  {/* Comunas / Puntos rápidos de entrega */}
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {[
                      'Av. Providencia 1234, Providencia',
                      'Av. Apoquindo 4500, Las Condes',
                      'Gran Avenida 6000, San Miguel',
                      'Plaza de Maipú, Maipú',
                      'Mall Plaza Vespucio, La Florida'
                    ].map(destExample => (
                      <button
                        key={destExample}
                        type="button"
                        onClick={() => {
                          setCustomDest(destExample);
                          setVerifiedRouteInfo(null);
                        }}
                        style={{
                          background: customDest === destExample ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          border: customDest === destExample ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                          color: customDest === destExample ? 'var(--primary)' : 'var(--text-muted)',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          cursor: 'pointer'
                        }}
                      >
                        {destExample.split(',')[1]?.trim() || destExample}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipo de recorrido: Solo Ida o Ida y Vuelta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input 
                      type="checkbox"
                      checked={isRoundTrip}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setIsRoundTrip(checked);
                        if (customDistance && !isNaN(Number(customDistance))) {
                          const factor = checked ? 2 : 0.5;
                          setCustomDistance(parseFloat((Number(customDistance) * factor).toFixed(1)));
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>🔄 Recorrido de Ida y Vuelta (Retorno a Base)</span>
                  </label>
                  <span style={{ fontSize: '0.7rem', color: isRoundTrip ? 'var(--color-success)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {isRoundTrip ? 'Distancia x2' : 'Solo Ida'}
                  </span>
                </div>

                {/* Botón de cálculo GPS verídico */}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCalculateCustomGpsRoute}
                  disabled={calculatingRoute}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {calculatingRoute ? (
                    <>
                      <div style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span>Calculando ruta vial con satélite GPS...</span>
                    </>
                  ) : (
                    <>
                      <Satellite size={16} />
                      <span>🛰️ Calcular Ruta y Distancia Real (GPS)</span>
                    </>
                  )}
                </button>

                {/* Resultado Verificado de Distancia GPS */}
                {verifiedRouteInfo && (
                  <div style={{ 
                    padding: '0.85rem 1rem', 
                    borderRadius: '8px', 
                    background: 'rgba(16, 185, 129, 0.08)', 
                    border: '1px solid rgba(16, 185, 129, 0.3)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle size={14} />
                        Ruta Vial Verificada por GPS
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {isRoundTrip ? 'Ida y Vuelta' : 'Solo Ida'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Distancia exacta por calles:</span>
                      <strong style={{ fontSize: '1.25rem', color: '#10b981' }}>
                        {customDistance} <span style={{ fontSize: '0.8rem' }}>km</span>
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>Tiempo estimado de conducción:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>⏱️ {verifiedRouteInfo.durationText}</strong>
                    </div>

                    {verifiedRouteInfo.summary && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.35rem' }}>
                        🛣️ Vía principal: <span style={{ color: 'var(--text-secondary)' }}>{verifiedRouteInfo.summary}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Campo de ajuste de kilómetros */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kilómetros a sumar al odómetro (ajustable):</label>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    className="input-field"
                    placeholder="Se calcula automáticamente con el botón verde"
                    value={customDistance}
                    onChange={(e) => setCustomDistance(e.target.value)}
                    style={{ width: '100%', fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}
                  />
                </div>
              </div>
            )}

            {routeMode === 'LIBRE' && (
              <div style={{
                padding: '1.25rem',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.06)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Car size={20} color="#38bdf8" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                        Conducción Libre / Trámites Varios (GPS Real)
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Vueltas urbanas, diligencias bancarias, compra de insumos sin ruta prefijada
                      </span>
                    </div>
                  </div>
                  <span className={`badge ${isLiveTracking ? 'badge-success' : 'badge-info'}`}>
                    {isLiveTracking ? '🛰️ GPS Satelital Activo' : 'GPS en Espera'}
                  </span>
                </div>

                {/* Gran Medidor Digital de Distancia */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.75rem',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '1rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  textAlign: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                      Km Recorridos en Trámites
                    </span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>
                      {liveTramitesKm.toFixed(2)} <span style={{ fontSize: '0.9rem', color: '#93c5fd' }}>km</span>
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                      Velocidad GPS Instantánea
                    </span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
                      {liveTelemetry.speed} <span style={{ fontSize: '0.9rem', color: '#6ee7b7' }}>km/h</span>
                    </span>
                  </div>
                </div>

                {/* Controles del Rastreador GPS */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`btn ${isLiveTracking ? 'btn-danger' : 'btn-primary'}`}
                    onClick={toggleRealGpsTracking}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}
                  >
                    {isLiveTracking ? (
                      <>
                        <Pause size={16} />
                        <span>Pausar Rastreo GPS</span>
                      </>
                    ) : (
                      <>
                        <Radio size={16} />
                        <span>Iniciar Rastreo GPS en Celular</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setLiveTramitesKm(0)}
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                    title="Reiniciar contador de trámites"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>

                {/* Ajuste manual por si el chofer lo requiere */}
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Ajuste fino de kilómetros (opcional si requiere corregir odómetro):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-field"
                    placeholder="0.0"
                    value={liveTramitesKm || ''}
                    onChange={(e) => setLiveTramitesKm(Math.max(0, parseFloat(e.target.value) || 0))}
                    style={{ width: '100%', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}
                  />
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                  💡 <em>A medida que el conductor se desplace físicamente con el celular por la ciudad, el sensor satelital del teléfono calculará automáticamente la distancia recorrida en tiempo real mediante la fórmula Haversine sin necesidad de cargar una ruta en el mapa.</em>
                </div>
              </div>
            )}
          </div>

          {/* Panel Derecho: Proyección y Despacho */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#38bdf8" />
                3. Proyección Predictiva de Odómetro
              </h3>

              <div className="form-grid-2" style={{ marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Odómetro Actual</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                    {(activeVehicle?.kilometraje || 0).toLocaleString()} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>km</span>
                  </span>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#60a5fa', display: 'block', textTransform: 'uppercase' }}>Odómetro Proyectado</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
                    {projectedKm.toLocaleString()} <span style={{ fontSize: '0.9rem', color: '#93c5fd' }}>km</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', display: 'block', marginTop: '2px' }}>
                    (+{currentDistanceKm} km en esta ruta)
                  </span>
                </div>
              </div>

              {predictiveImpact && (
                <div 
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '10px',
                    background: predictiveImpact.urgencia === 'CRITICA' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                    border: predictiveImpact.urgencia === 'CRITICA' ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.85rem',
                    marginBottom: '1.5rem'
                  }}
                >
                  <AlertTriangle size={24} color={predictiveImpact.urgencia === 'CRITICA' ? '#ef4444' : '#f59e0b'} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '0.875rem' }}>
                    <strong style={{ display: 'block', color: predictiveImpact.urgencia === 'CRITICA' ? '#fca5a5' : '#fcd34d', marginBottom: '4px' }}>
                      {predictiveImpact.urgencia === 'CRITICA' ? '¡Límite de Mantenimiento Superado en Ruta!' : '¡Aviso Preventivo de Odómetro!'}
                    </strong>
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Esta ruta hará que el vehículo alcance <strong>{projectedKm.toLocaleString()} km</strong>, sobrepasando el umbral de <strong>{predictiveImpact.tipo}</strong> ({predictiveImpact.kmLimite.toLocaleString()} km). Se recomienda agendar servicio antes de despachar.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!hasAssignedDriver && activeVehicle && (
              <div 
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}
              >
                <ShieldAlert size={22} color="#ef4444" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.82rem', color: '#fca5a5', lineHeight: 1.4 }}>
                  <strong>Despacho y Odómetro Bloqueado:</strong> Este vehículo no tiene un conductor asignado. Por trazabilidad y normativa, solo se puede despachar y actualizar odómetro si ya cuenta con un conductor asignado.
                </div>
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              onClick={handleDispatchTrip}
              disabled={dispatching || !activeVehicle || currentDistanceKm <= 0 || !hasAssignedDriver}
            >
              {dispatching ? (
                <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  <Play size={18} />
                  <span>Despachar y Actualizar Odómetro Automáticamente</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: TELEMETRÍA EN VIVO */}
      {activeTab === 'EN_VIVO' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }} className="responsive-grid">
          
          {/* HUD de Telemetría */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gauge size={20} color="#38bdf8" />
                HUD de Telemetría en Tiempo Real
              </h3>
              <span className={`badge ${liveTelemetry.status === 'EN_RUTA' ? 'badge-success' : 'badge-warning'}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                {liveTelemetry.status}
              </span>
            </div>

            <div 
              style={{ 
                background: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.12) 0%, rgba(15, 23, 42, 0.6) 80%)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block' }}>
                Velocidad Instantánea
              </span>
              <div style={{ fontSize: '4.5rem', fontWeight: 900, color: '#ffffff', lineHeight: 1, margin: '0.5rem 0' }}>
                {liveTelemetry.speed}
                <span style={{ fontSize: '1.25rem', fontWeight: 500, color: '#38bdf8', marginLeft: '6px' }}>km/h</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>🧭 Rumbo: <strong>{liveTelemetry.heading}° (Oeste)</strong></span>
                <span>🛣️ Odómetro: <strong>{liveTelemetry.odometer.toLocaleString()} km</strong></span>
              </div>
            </div>

            <div className="telemetry-tri-grid">
              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <Satellite size={18} color="#38bdf8" style={{ margin: '0 auto 4px' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Satélites GPS</span>
                <strong style={{ fontSize: '1.1rem' }}>{liveTelemetry.satellites}</strong>
              </div>

              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <Battery size={18} color="#10b981" style={{ margin: '0 auto 4px' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Batería GPS</span>
                <strong style={{ fontSize: '1.1rem', color: '#10b981' }}>{liveTelemetry.battery}%</strong>
              </div>

              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <MapPin size={18} color="#f59e0b" style={{ margin: '0 auto 4px' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Latitud / Longitud</span>
                <strong style={{ fontSize: '0.75rem', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {liveTelemetry.lat.toFixed(4)}, {liveTelemetry.lng.toFixed(4)}
                </strong>
              </div>
            </div>
          </div>

          {/* Panel de Controles */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Radio size={18} color="#10b981" />
              Controles de Transmisión
            </h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Transmite las coordenadas reales de tu dispositivo o simula un viaje en carretera para ver el movimiento en las calles.
            </p>

            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Smartphone size={18} color="#38bdf8" />
                <strong style={{ fontSize: '0.9rem' }}>Transmisión desde Celular / GPS Real</strong>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Utiliza la antena GPS física de este dispositivo para transmitir la ubicación real en la calle.
              </p>
              <button
                className={`btn ${isLiveTracking ? 'btn-danger' : 'btn-primary'}`}
                style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                onClick={toggleRealGpsTracking}
                disabled={isSimulatingLive}
              >
                {isLiveTracking ? (
                  <>
                    <Square size={16} />
                    <span>Detener Transmisión GPS Real</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>Iniciar Transmisión GPS Real</span>
                  </>
                )}
              </button>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Zap size={18} color="#f59e0b" />
                <strong style={{ fontSize: '0.9rem' }}>Simulador de Conducción en Carretera (Demo)</strong>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Simula el viaje del vehículo a 82 km/h por la autopista, trazando el rastro y sumando odómetro.
              </p>
              <button
                className={`btn ${isSimulatingLive ? 'btn-danger' : 'btn-secondary'}`}
                style={{ width: '100%', padding: '0.65rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', background: isSimulatingLive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.15)', borderColor: isSimulatingLive ? '#ef4444' : '#38bdf8', color: '#fff' }}
                onClick={toggleHighwaySimulation}
                disabled={isLiveTracking}
              >
                {isSimulatingLive ? (
                  <>
                    <Square size={16} />
                    <span>Detener Simulación</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>Simular Viaje en Vivo a 82 km/h</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => {
                if (activeVehicle) {
                  api.limpiarHistorialTelemetria(activeVehicle.id);
                  if (liveTrailPolylineRef.current && mapInstanceRef.current) {
                    mapInstanceRef.current.removeLayer(liveTrailPolylineRef.current);
                  }
                  setToast({ message: 'Rastro de telemetría reiniciado.', type: 'info' });
                }
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', alignSelf: 'center' }}
            >
              <RotateCcw size={14} />
              <span>Limpiar rastro del vehículo seleccionado</span>
            </button>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: BITÁCORA DE JORNADA (INICIO Y CIERRE DE TURNO) */}
      {activeTab === 'JORNADA' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.5rem' }} className="responsive-grid">
            
            {/* Formulario de Inicio o Cierre de Jornada */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {!activeShift ? (
                /* ESTADO 1: INICIAR JORNADA */
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderRadius: '10px' }}>
                      <Clock size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                        Registro de Inicio de Turno
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        El conductor ingresa el odómetro del tablero al encender el móvil.
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        Vehículo a Operar:
                      </label>
                      <select
                        className="input-field"
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        style={{ width: '100%', fontWeight: 600 }}
                      >
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.activo !== false ? '🚗' : '🛑'} {v.marca} {v.modelo} ({v.patente || 'S/P'}) {v.activo === false ? '[APAGADO / FUERA DE SERVICIO]' : ''} - {v.propietarioNombre || 'Sin chofer'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Selector de Conductor si es Administrador o Mecánico */}
                    {(isAdmin || isMecanico) && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          👤 Conductor Asignado a la Ruta:
                        </label>
                        <select
                          className="input-field"
                          value={selectedDriverId}
                          onChange={(e) => setSelectedDriverId(e.target.value)}
                          style={{ width: '100%', fontWeight: 600 }}
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
                      </div>
                    )}

                    {/* Toggle Odómetro Averiado / Pegado */}
                    <div style={{ padding: '0.65rem 0.85rem', background: isOdometerBroken ? 'rgba(245, 158, 11, 0.12)' : 'rgba(255,255,255,0.02)', borderRadius: '8px', border: isOdometerBroken ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={18} color={isOdometerBroken ? '#f59e0b' : 'var(--text-muted)'} />
                        <div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', color: isOdometerBroken ? '#fcd34d' : 'var(--text-primary)' }}>
                            ¿Odómetro o velocímetro pegado / averiado?
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Activa el cálculo virtual por satélite GPS y rutas automáticas.
                          </span>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isOdometerBroken} 
                        onChange={(e) => setIsOdometerBroken(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                      />
                    </div>

                    <div className="form-grid-2">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          Kilometraje Inicial en Tablero (km):
                        </label>
                        <input
                          type="number"
                          className="input-field"
                          placeholder="Ej: 120000"
                          value={shiftKmInicial}
                          onChange={(e) => setShiftKmInicial(e.target.value)}
                          style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          Combustible:
                        </label>
                        <select
                          className="input-field"
                          value={shiftCombustibleInicial}
                          onChange={(e) => setShiftCombustibleInicial(e.target.value)}
                          style={{ width: '100%' }}
                        >
                          <option value="100% (Lleno)">⛽ 100% (Lleno)</option>
                          <option value="75% (3/4)">⛽ 75% (3/4)</option>
                          <option value="50% (1/2)">⛽ 50% (1/2)</option>
                          <option value="25% (1/4)">⛽ 25% (1/4)</option>
                          <option value="Reserva">⚠️ Reserva</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        Observaciones de Inspección Pre-viaje:
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Ej: Neumáticos con buena presión, luces operativas, sin fugas"
                        value={shiftNotasInicial}
                        onChange={(e) => setShiftNotasInicial(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>

                    {/* Alerta si el vehículo seleccionado está apagado */}
                    {activeVehicle && activeVehicle.activo === false && (
                      <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--color-danger)', fontSize: '0.82rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                        <span><strong>Móvil Fuera de Servicio:</strong> Este vehículo fue apagado por la administración. No se puede iniciar jornada hasta que sea reactivado.</span>
                      </div>
                    )}

                    <button
                      className="btn btn-primary"
                      disabled={activeVehicle?.activo === false}
                      style={{
                        padding: '0.85rem',
                        background: activeVehicle?.activo === false ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #10b981, #059669)',
                        borderColor: activeVehicle?.activo === false ? 'var(--border-color)' : '#10b981',
                        color: activeVehicle?.activo === false ? 'var(--text-muted)' : '#fff',
                        cursor: activeVehicle?.activo === false ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '0.95rem',
                        fontWeight: 700
                      }}
                      onClick={handleStartShift}
                    >
                      <Play size={18} />
                      <span>{activeVehicle?.activo === false ? 'Vehículo Apagado (Bloqueado)' : 'Iniciar Jornada Laboral'}</span>
                    </button>
                  </div>
                </>
              ) : (
                /* ESTADO 2: JORNADA EN CURSO -> FORMULARIO DE CIERRE */
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ padding: '0.65rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', borderRadius: '10px' }}>
                        <Clock size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                          Cierre de Jornada y Entrega de Móvil
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Ingresa el odómetro final para cerrar el turno y guardar en el historial.
                        </span>
                      </div>
                    </div>
                    <span className="badge badge-success" style={{ animation: 'pulse 1.5s infinite' }}>
                      TURNO EN CURSO
                    </span>
                  </div>

                  {/* Aviso de Cierre Administrativo si quien cierra no es el chofer asignado */}
                  {activeShift.conductorId !== user?.id && (
                    <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldAlert size={18} color="var(--color-danger)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem', color: '#fca5a5' }}>
                        <strong>Cierre Administrativo Remoto:</strong> El turno pertenece al chofer <strong>{activeShift.conductorNombre}</strong>. Como Supervisor tienes la facultad de cerrarlo y liberar el vehículo ahora.
                      </span>
                    </div>
                  )}

                  {/* Resumen del Turno Activo */}
                  <div style={{ padding: '0.85rem 1rem', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '0.85rem' }}>
                    <div className="form-grid-2" style={{ marginBottom: '6px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Vehículo:</span>{' '}
                        <strong>{activeShift.vehiculoNombre} ({activeShift.patente})</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Conductor:</span>{' '}
                        <strong>{activeShift.conductorNombre}</strong>
                      </div>
                    </div>
                    <div className="form-grid-2">
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Hora de Inicio:</span>{' '}
                        <strong style={{ color: '#38bdf8' }}>{activeShift.fechaInicioStr}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Km Inicial:</span>{' '}
                        <strong style={{ color: '#10b981' }}>{activeShift.kmInicial?.toLocaleString()} km</strong>
                        {activeShift.kmGpsAcumulados > 0 && (
                          <span style={{ color: '#34d399', marginLeft: '6px', fontWeight: 700 }}>
                            (+{activeShift.kmGpsAcumulados.toFixed(2)} km GPS)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Formulario de Cierre */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Asistente Odómetro Virtual para tablero pegado o cálculo GPS de reparto */}
                    {(activeShift.odometroAveriado || isOdometerBroken || activeShift.kmGpsAcumulados > 0) && (
                      <div style={{ padding: '0.85rem 1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fcd34d', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>
                          <AlertTriangle size={16} />
                          <span>Asistente de Odómetro Virtual por Satélite</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                          {activeShift.kmGpsAcumulados > 0 
                            ? `El GPS del vehículo acumuló +${activeShift.kmGpsAcumulados.toFixed(2)} km en reparto. Puedes aplicarlo directamente:`
                            : 'Como el odómetro físico no avanza o no fue anotado, pulsa una opción para sumar los kilómetros calculados:'}
                        </span>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {activeShift.kmGpsAcumulados > 0 && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', fontWeight: 700 }}
                              onClick={() => setShiftKmFinal(activeShift.kmInicial + Math.round(activeShift.kmGpsAcumulados))}
                            >
                              🛰️ Usar GPS Real Reparto (+{activeShift.kmGpsAcumulados.toFixed(2)} km)
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => setShiftKmFinal(activeShift.kmInicial + 46)}
                          >
                            +46 km (Reparto Santiago)
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => setShiftKmFinal(activeShift.kmInicial + 95)}
                          >
                            +95 km (Ruta Rancagua)
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={() => setShiftKmFinal(activeShift.kmInicial + 112)}
                          >
                            +112 km (Ruta San Antonio)
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}
                            onClick={() => {
                              const duracionMin = Math.max(1, Math.round((Date.now() - new Date(activeShift.inicioTimestamp).getTime()) / 60000));
                              const estimacionKm = Math.max(20, Math.round((duracionMin / 60) * 32));
                              setShiftKmFinal(activeShift.kmInicial + estimacionKm);
                            }}
                          >
                            ⏱️ Estimar por Horas de Turno (~32 km/h)
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="form-grid-2">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          Kilometraje Final en Tablero (km):
                        </label>
                        <input
                          type="number"
                          className="input-field"
                          placeholder={`Debe ser >= ${activeShift.kmInicial}`}
                          value={shiftKmFinal}
                          onChange={(e) => setShiftKmFinal(e.target.value)}
                          style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                          Combustible Final:
                        </label>
                        <select
                          className="input-field"
                          value={shiftCombustibleFinal}
                          onChange={(e) => setShiftCombustibleFinal(e.target.value)}
                          style={{ width: '100%' }}
                        >
                          <option value="100% (Lleno)">⛽ 100% (Lleno)</option>
                          <option value="75% (3/4)">⛽ 75% (3/4)</option>
                          <option value="50% (1/2)">⛽ 50% (1/2)</option>
                          <option value="25% (1/4)">⛽ 25% (1/4)</option>
                          <option value="Reserva">⚠️ Reserva</option>
                        </select>
                      </div>
                    </div>

                    {/* Cálculo en vivo de kilómetros trabajados */}
                    {shiftKmFinal && Number(shiftKmFinal) >= activeShift.kmInicial && (
                      <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Kilómetros recorridos en este turno:</span>
                        <strong style={{ fontSize: '1.25rem', color: '#34d399' }}>
                          +{(Number(shiftKmFinal) - activeShift.kmInicial).toLocaleString()} km
                        </strong>
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                        Observaciones al Cierre (Novedades de la ruta):
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Ej: Entregas completadas, vehículo lavado y estacionado en bodega"
                        value={shiftNotasFinal}
                        onChange={(e) => setShiftNotasFinal(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>

                    <button
                      className="btn btn-primary"
                      style={{
                        padding: '0.85rem',
                        background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                        borderColor: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontSize: '0.95rem',
                        fontWeight: 700
                      }}
                      onClick={handleEndShift}
                      disabled={processingShift}
                    >
                      {processingShift ? (
                        <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <>
                          <CheckCircle size={18} />
                          <span>Finalizar Jornada y Actualizar Odómetro</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Panel Informativo de Valor para el Empleador */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} color="#10b981" />
                  Control de Jornada Móvil (Para Celular)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1rem' }}>
                  El chofer puede abrir esta pantalla directamente desde su teléfono al inicio y término de su turno. Elimina las planillas de papel y garantiza que el odómetro del sistema coincida con el odómetro real del auto.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                    <span style={{ color: 'var(--text-secondary)' }}><strong>Sincronización Automática:</strong> Al cerrar el turno, el odómetro de la ficha del vehículo en MySQL se actualiza de inmediato.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                    <span style={{ color: 'var(--text-secondary)' }}><strong>Alertas de Mantención Preventiva:</strong> Si el kilometraje final supera el intervalo de cambio de aceite o pastillas, el sistema avisa al jefe de taller.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#10b981', fontWeight: 800 }}>✓</span>
                    <span style={{ color: 'var(--text-secondary)' }}><strong>Auditoría de Combustible:</strong> Registro del nivel de estanque para detectar consumos anormales.</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Estadísticas de Jornadas */}
              <div className="form-grid-2" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Turnos Registrados</span>
                  <strong style={{ fontSize: '1.4rem' }}>{shiftHistory.length}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Km Auditados</span>
                  <strong style={{ fontSize: '1.4rem', color: '#38bdf8' }}>
                    {shiftHistory.reduce((sum, s) => sum + (s.kmRecorridos || 0), 0).toLocaleString()} km
                  </strong>
                </div>
              </div>
            </div>

          </div>

          {/* Tabla de Historial de Jornadas de la Flota */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--primary)" />
                {user?.role === 'CONDUCTOR' 
                  ? 'Mi Libro de Ruta y Bitácora Personal de Conducción' 
                  : 'Libro de Ruta y Bitácora de Turnos Auditados (Flota)'}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                  {shiftHistory.length} {shiftHistory.length === 1 ? 'Turno' : 'Turnos'}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={loadBackendShiftHistory}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCw size={13} /> Sincronizar
                </button>
              </div>
            </div>

            {shiftHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Aún no hay turnos cerrados en la bitácora. Completa una jornada arriba para generar el registro auditable.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>Vehículo</th>
                      <th style={{ padding: '0.75rem' }}>Conductor</th>
                      <th style={{ padding: '0.75rem' }}>Horario (Inicio ➔ Fin)</th>
                      <th style={{ padding: '0.75rem' }}>Duración</th>
                      <th style={{ padding: '0.75rem' }}>Km Inicio</th>
                      <th style={{ padding: '0.75rem' }}>Km Final</th>
                      <th style={{ padding: '0.75rem' }}>Km Trabajados</th>
                      <th style={{ padding: '0.75rem' }}>Combustible</th>
                      <th style={{ padding: '0.75rem' }}>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftHistory.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                          {s.vehiculoNombre}{' '}
                          <span className="badge" style={{ fontSize: '0.65rem', marginLeft: '4px' }}>
                            {s.patente}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>👤 {s.conductorNombre}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                          <div>{s.fechaInicioStr}</div>
                          <div style={{ color: 'var(--text-muted)' }}>➔ {s.fechaFinStr}</div>
                        </td>
                        <td style={{ padding: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>⏱️ {s.duracion}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{(s.kmInicial || 0).toLocaleString()} km</td>
                        <td style={{ padding: '0.75rem', fontWeight: 700 }}>{(s.kmFinal || 0).toLocaleString()} km</td>
                        <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                          +{s.kmRecorridos.toLocaleString()} km
                          {s.odometroAveriado && (
                            <span className="badge badge-warning" style={{ display: 'block', marginTop: '3px', fontSize: '0.62rem' }}>
                              🛰️ Virtual GPS
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.75rem' }}>
                          <Fuel size={12} style={{ display: 'inline', marginRight: '3px' }} />
                          {s.combustibleFinal || s.combustibleInicial}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.notas || 'Sin novedad'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* PESTAÑA 4: CONEXIÓN DISPOSITIVOS GPS FÍSICOS & API KEY */}
      {activeTab === 'HARDWARE' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="responsive-grid">
          
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={18} color="#38bdf8" />
              ¿Tiene costo ver los vehículos o requiere API Key?
            </h3>

            <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: 700, fontSize: '0.9rem', marginBottom: '6px' }}>
                <CheckCircle2 size={18} />
                Costo Actual: $0 CLP (100% Gratuito)
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                El mapa está integrado con capas de calles en español de alta resolución. No tiene límite de consultas, no requiere ingresar tarjeta de crédito y no genera cobros mensuales por visualización.
              </p>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>
                ¿Y si quiero usar Google Maps o Mapbox con API Key propia?
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
                Google Maps entrega <strong>$200 USD mensuales de crédito gratuito</strong> (~28.000 cargas al mes gratis). Si deseas usar una API Key propia en el futuro, puedes pegarla aquí:
              </p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej: AIzaSyA... (Opcional)"
                  style={{ flex: 1, fontSize: '0.85rem' }}
                  onChange={(e) => localStorage.setItem('custom_maps_api_key', e.target.value)}
                />
                <button 
                  className="btn btn-secondary" 
                  style={{ fontSize: '0.8rem', padding: '0 12px' }}
                  onClick={() => setToast({ message: 'Clave guardada localmente.', type: 'success' })}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} color="#10b981" />
              Dispositivos GPS Recomendados para Vehículos
            </h3>

            <div style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>1. Teltonika FMB003 / FMT100 (OBD-II)</strong>
                <span className="badge badge-success">Recomendado</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                Instalación en 10 segundos: se enchufa directo bajo el volante. Lee odómetro y velocidad real de la computadora del auto.
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Precio: <strong>~$30.000 - $45.000 CLP</strong> (Sin cortar cables)
              </div>
            </div>

            <div style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>2. Sinotrack ST-902 (OBD-II Económico)</strong>
                <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>Económico</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                Plug & Play con chip 4G/2G. Excelente relación calidad/precio para flotas de reparto y furgones.
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Precio: <strong>~$18.000 - $25.000 CLP</strong>
              </div>
            </div>

            <div style={{ padding: '0.85rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>3. Coban TK303G / Teltonika FMB920 (Fijo)</strong>
                <span className="badge badge-warning">Con Corta-Motor</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 6px' }}>
                Conexión oculta dentro del tablero con relé de seguridad para apagar el motor en caso de robo.
              </p>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Precio: <strong>~$25.000 - $40.000 CLP</strong> (+ instalación)
              </div>
            </div>

            <div style={{ marginTop: '0.5rem', padding: '0.85rem', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
                COMANDOS SMS DE CONFIGURACIÓN (CHILE)
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px' }}>
                  <code>APN Entel: bam.entelpcs.cl</code>
                  <button onClick={() => copyToClipboard('APN,bam.entelpcs.cl,entelpcs,entelpcs#', 'APN_ENTEL')} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}>
                    {copiedText === 'APN_ENTEL' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px' }}>
                  <code>Reporte c/ 30s: 8040000 30</code>
                  <button onClick={() => copyToClipboard('8040000 30', 'INTERVALO')} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer' }}>
                    {copiedText === 'INTERVALO' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Historial de Despachos Recientes (siempre visible) */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} color="var(--primary)" />
          Registro Histórico de Recorridos y Despachos de Flota
        </h3>

        {tripHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Aún no se han despachado recorridos en esta sesión. Seleccione un vehículo y una ruta arriba para calcular y actualizar su odómetro automáticamente.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Fecha/Hora</th>
                  <th style={{ padding: '0.75rem' }}>Vehículo</th>
                  <th style={{ padding: '0.75rem' }}>Patente</th>
                  <th style={{ padding: '0.75rem' }}>Conductor</th>
                  <th style={{ padding: '0.75rem' }}>Ruta Realizada</th>
                  <th style={{ padding: '0.75rem' }}>Distancia</th>
                  <th style={{ padding: '0.75rem' }}>Odómetro Resultante</th>
                  <th style={{ padding: '0.75rem' }}>Impacto Predictivo</th>
                </tr>
              </thead>
              <tbody>
                {tripHistory.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{t.fecha}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{t.vehiculo}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', letterSpacing: '0.05em' }}>
                        {t.patente || 'S/P'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>👤 {t.conductor}</td>
                    <td style={{ padding: '0.75rem' }}>{t.ruta}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>+{t.distanciaKm} km</td>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>{t.odometroNuevo.toLocaleString()} km</td>
                    <td style={{ padding: '0.75rem' }}>
                      {t.impacto ? (
                        <span className={`badge ${t.impacto.urgencia === 'CRITICA' ? 'badge-danger' : 'badge-warning'}`}>
                          Requiere {t.impacto.tipo}
                        </span>
                      ) : (
                        <span className="badge badge-success">Flota Óptima</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        .telemetry-tri-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        @media (max-width: 640px) {
          .telemetry-tri-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .telemetry-tri-grid > div:last-child {
            grid-column: span 2;
          }
        }
      `}</style>
    </div>
  );
};

export default RutasGPS;

