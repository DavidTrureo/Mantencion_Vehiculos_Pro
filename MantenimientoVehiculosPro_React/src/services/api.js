// Detección de entorno móvil nativo Capacitor (APK Android)
const isCapacitorNative = () => {
  return typeof window !== 'undefined' && (
    window.Capacitor !== undefined || 
    window.location.protocol === 'capacitor:' ||
    (window.location.origin === 'http://localhost' && !window.location.port)
  );
};

export const CLOUD_RUN_API_URL = 'https://vehiculospro-api-88453754134.us-east4.run.app';

export const getApiBaseUrl = () => {
  // 1. IP o dominio personalizado guardado en el dispositivo
  const custom = typeof localStorage !== 'undefined' ? localStorage.getItem('vehiculospro_api_url') : null;
  if (custom && custom.trim()) {
    if (custom.includes('192.168.') || custom.includes('localhost:8080')) {
      localStorage.removeItem('vehiculospro_api_url');
      return CLOUD_RUN_API_URL;
    }
    return custom.trim().replace(/\/+$/, '');
  }
  // 2. Variable de entorno en compilación
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  // 3. Por defecto en la nube (tanto en navegador Web como en APK móvil): Google Cloud Run
  return CLOUD_RUN_API_URL;
};

export const setCustomApiUrl = (url) => {
  if (url && url.trim()) {
    localStorage.setItem('vehiculospro_api_url', url.trim());
  } else {
    localStorage.removeItem('vehiculospro_api_url');
  }
};

// Evaluación dinámica para que todos los template literals `${BASE_URL}/api/...` funcionen en web y en APK
const BASE_URL = {
  toString: () => getApiBaseUrl()
};

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (response.status === 204) {
    return null;
  }
  
  if (!response.ok) {
    // Si el backend responde 401 o 403 y teníamos un token guardado, el token JWT expiró
    if ((response.status === 401 || response.status === 403) && localStorage.getItem('token')) {
      // Ignorar si la solicitud fue el propio login
      if (!response.url.includes('/api/auth/login')) {
        console.warn("Sesión expirada en backend (código 401/403). Limpiando credenciales obsoletas.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:expired'));
        throw new Error('Tu sesión ha expirado por seguridad (límite de 10 horas). Por favor, vuelve a iniciar sesión con tu usuario y contraseña.');
      }
    }

    let errorMessage = 'Ha ocurrido un error en la solicitud.';
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else if (typeof errorData === 'object' && errorData !== null) {
        const values = Object.values(errorData).filter(Boolean);
        if (values.length > 0) {
          errorMessage = values.join(', ');
        }
      }
    } catch (e) {
      // Si la respuesta no es JSON, intentar como texto
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch (t) {}
    }
    throw new Error(errorMessage);
  }

  // Verificar si la respuesta es JSON antes de parsear
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
};

export const api = {
  // Auth
  login: async (username, password) => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(res);
  },

  checkUsername: async (username) => {
    const res = await fetch(`${BASE_URL}/api/auth/check-username`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return handleResponse(res);
  },

  // Usuarios
  getUsuarios: async () => {
    const res = await fetch(`${BASE_URL}/api/usuarios`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getUsuarioById: async (id) => {
    const res = await fetch(`${BASE_URL}/api/usuarios/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  crearUsuario: async (creatorId, userData) => {
    const query = creatorId ? `?creatorId=${creatorId}` : '';
    const res = await fetch(`${BASE_URL}/api/usuarios${query}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  actualizarUsuario: async (id, editorId, userData) => {
    const validEditorId = (editorId && editorId !== 'undefined') ? editorId : (id || 1);
    const res = await fetch(`${BASE_URL}/api/usuarios/${id}?editorId=${validEditorId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  toggleUsuarioStatus: async (id, editorId) => {
    const validEditorId = (editorId && editorId !== 'undefined') ? editorId : (id || 1);
    const res = await fetch(`${BASE_URL}/api/usuarios/${id}/toggle-status?editorId=${validEditorId}`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  actualizarFotoPerfil: async (id, url) => {
    const res = await fetch(`${BASE_URL}/api/usuarios/${id}/profile-image?url=${encodeURIComponent(url)}`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Vehículos
  getTodosLosVehiculos: async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/vehiculos`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await handleResponse(res);
        if (Array.isArray(data)) {
          if (data.length === 0) return [];
          // Enriquecer con los nombres de usuario y choferes si es posible
          try {
            const users = await api.getUsuarios();
            const userMap = {};
            if (Array.isArray(users)) {
              users.forEach(u => {
                userMap[u.id] = u.fullName || u.username;
              });
            }
            return data.map(v => ({
              ...v,
              propietarioNombre: v.propietarioNombre || (v.propietarioId ? userMap[v.propietarioId] : null)
            }));
          } catch (uErr) {
            return data;
          }
        }
      }
    } catch (e) {
      console.warn("Aviso al consultar /api/vehiculos global:", e);
    }

    try {
      const users = await api.getUsuarios();
      const all = [];
      if (Array.isArray(users)) {
        for (const u of users) {
          try {
            const list = await api.getVehiculosPorUsuario(u.id);
            if (Array.isArray(list)) {
              all.push(...list.map(v => ({ 
                ...v, 
                propietarioId: u.id, 
                propietarioNombre: u.fullName || u.username 
              })));
            }
          } catch (err) {}
        }
      }
      return all;
    } catch (err) {
      console.warn("Aviso al consultar vehículos por usuario:", err);
      return [];
    }
  },

  getVehiculosPorUsuario: async (usuarioId) => {
    const res = await fetch(`${BASE_URL}/api/vehiculos/usuario/${usuarioId}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getVehiculoById: async (vehiculoId) => {
    const res = await fetch(`${BASE_URL}/api/vehiculos/${vehiculoId}`, {
      headers: getHeaders(),
    });
    const data = await handleResponse(res);
    if (data && data.propietarioId && !data.propietarioNombre) {
      try {
        const owner = await api.getUsuarioById(data.propietarioId);
        data.propietarioNombre = owner.fullName || owner.username;
      } catch (e) {}
    }
    return data;
  },

  crearVehiculo: async (usuarioId, vehiculoData) => {
    const res = await fetch(`${BASE_URL}/api/vehiculos/usuario/${usuarioId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(vehiculoData),
    });
    return handleResponse(res);
  },

  actualizarVehiculo: async (vehiculoId, vehiculoData) => {
    const res = await fetch(`${BASE_URL}/api/vehiculos/${vehiculoId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(vehiculoData),
    });
    return handleResponse(res);
  },

  eliminarVehiculo: async (vehiculoId) => {
    const res = await fetch(`${BASE_URL}/api/vehiculos/${vehiculoId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  toggleVehiculoActivo: async (vehiculoId) => {
    const res = await fetch(`${BASE_URL}/api/vehiculos/${vehiculoId}/toggle-activo`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getMarcasNhtsa: async () => {
    const res = await fetch(`${BASE_URL}/vehiculos/makes`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getModelosNhtsa: async (marca) => {
    const res = await fetch(`${BASE_URL}/vehiculos/models?make=${encodeURIComponent(marca)}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Mantenimientos
  getMantenimientosPorVehiculo: async (vehiculoId) => {
    const res = await fetch(`${BASE_URL}/mantenimientos/vehiculo/${vehiculoId}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getMantenimientoById: async (id) => {
    const res = await fetch(`${BASE_URL}/mantenimientos/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  crearMantenimiento: async (vehiculoId, mantenimientoData) => {
    const res = await fetch(`${BASE_URL}/mantenimientos/vehiculo/${vehiculoId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(mantenimientoData),
    });
    return handleResponse(res);
  },

  actualizarMantenimiento: async (id, mantenimientoData) => {
    const res = await fetch(`${BASE_URL}/mantenimientos/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(mantenimientoData),
    });
    return handleResponse(res);
  },

  eliminarMantenimiento: async (id) => {
    const res = await fetch(`${BASE_URL}/mantenimientos/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Recomendaciones
  getRecomendaciones: async () => {
    const res = await fetch(`${BASE_URL}/recomendaciones`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getRecomendacionPorTipo: async (tipo) => {
    const res = await fetch(`${BASE_URL}/recomendaciones/tipo/${encodeURIComponent(tipo)}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  actualizarFcmToken: async (id, token) => {
    const res = await fetch(`${BASE_URL}/api/usuarios/${id}/fcm-token?token=${encodeURIComponent(token)}`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Telemetría GPS en Vivo
  enviarTelemetriaGps: async (data) => {
    try {
      // 1. Guardar en el almacén de telemetría en vivo
      const existingLive = JSON.parse(localStorage.getItem('fleet_telemetry_live') || '{}');
      const updatedItem = {
        vehiculoId: data.vehiculoId,
        patente: data.patente,
        lat: data.lat,
        lng: data.lng,
        velocidad: Math.round(data.velocidad || 0),
        rumbo: Math.round(data.rumbo || 0),
        odometro: data.odometro,
        bateria: data.bateria || 98,
        satelites: data.satelites || 12,
        estado: (data.velocidad > 5) ? 'EN_RUTA' : (data.velocidad > 0 ? 'LENTO' : 'DETENIDO'),
        timestamp: new Date().toISOString()
      };
      existingLive[data.vehiculoId] = updatedItem;
      localStorage.setItem('fleet_telemetry_live', JSON.stringify(existingLive));

      // 2. Guardar punto en el historial de trayectoria (últimos 100 puntos)
      const histKey = `fleet_telemetry_hist_${data.vehiculoId}`;
      const hist = JSON.parse(localStorage.getItem(histKey) || '[]');
      hist.push({
        lat: data.lat,
        lng: data.lng,
        velocidad: Math.round(data.velocidad || 0),
        timestamp: new Date().toISOString()
      });
      if (hist.length > 100) hist.shift();
      localStorage.setItem(histKey, JSON.stringify(hist));

      return { success: true, telemetry: updatedItem };
    } catch (e) {
      console.error('Error procesando telemetría GPS:', e);
      return { success: false, error: e.message };
    }
  },

  getTelemetriaFlota: () => {
    try {
      return JSON.parse(localStorage.getItem('fleet_telemetry_live') || '{}');
    } catch (e) {
      return {};
    }
  },

  getHistorialTelemetria: (vehiculoId) => {
    try {
      return JSON.parse(localStorage.getItem(`fleet_telemetry_hist_${vehiculoId}`) || '[]');
    } catch (e) {
      return [];
    }
  },

  limpiarHistorialTelemetria: (vehiculoId) => {
    try {
      localStorage.removeItem(`fleet_telemetry_hist_${vehiculoId}`);
      const existingLive = JSON.parse(localStorage.getItem('fleet_telemetry_live') || '{}');
      delete existingLive[vehiculoId];
      localStorage.setItem('fleet_telemetry_live', JSON.stringify(existingLive));
      return true;
    } catch (e) {
      return false;
    }
  },

  // Turnos y Jornadas (Persistencia en MySQL)
  iniciarTurno: async (turnoData) => {
    const res = await fetch(`${BASE_URL}/api/turnos/iniciar`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(turnoData),
    });
    return handleResponse(res);
  },

  finalizarTurno: async (turnoId, finalData) => {
    const res = await fetch(`${BASE_URL}/api/turnos/${turnoId}/finalizar`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(finalData),
    });
    return handleResponse(res);
  },

  getTurnoActivoVehiculo: async (vehiculoId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/turnos/activo/vehiculo/${vehiculoId}`, {
        headers: getHeaders(),
      });
      if (res.status === 204) return null;
      return handleResponse(res);
    } catch (e) {
      return null;
    }
  },

  getTurnoActivoConductor: async (conductorId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/turnos/activo/conductor/${conductorId}`, {
        headers: getHeaders(),
      });
      if (res.status === 204) return null;
      return handleResponse(res);
    } catch (e) {
      return null;
    }
  },

  getTurnosActivos: async () => {
    const res = await fetch(`${BASE_URL}/api/turnos/activos`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getHistorialTurnosVehiculo: async (vehiculoId) => {
    const res = await fetch(`${BASE_URL}/api/turnos/historial/vehiculo/${vehiculoId}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getHistorialTurnosConductor: async (conductorId) => {
    const res = await fetch(`${BASE_URL}/api/turnos/historial/conductor/${conductorId}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  getTurnosRecientes: async () => {
    const res = await fetch(`${BASE_URL}/api/turnos/recientes`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Incidentes y Reportes de Fallas en Ruta (Persistencia Central en MySQL)
  getIncidentes: async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/incidentes`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    } catch (e) {
      console.warn("Aviso al consultar incidentes en servidor:", e);
      const saved = localStorage.getItem('vehiculospro_incidentes_reportados');
      return saved ? JSON.parse(saved) : [];
    }
  },

  crearIncidente: async (incidenteData) => {
    // Si viene con id temporal de frontend, se extrae para que MySQL use AUTO_INCREMENT sin error de entidad desasociada
    const { id, ...dataToSend } = incidenteData || {};
    const res = await fetch(`${BASE_URL}/api/incidentes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(dataToSend),
    });
    return handleResponse(res);
  },

  resolverIncidente: async (incidenteId, resueltoPor = '') => {
    const url = `${BASE_URL}/api/incidentes/${incidenteId}/resolver` + (resueltoPor ? `?resueltoPor=${encodeURIComponent(resueltoPor)}` : '');
    const res = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Subida de evidencias y documentos a almacenamiento en la nube (Firebase Storage)
  subirArchivo: async (fileOrBlob, filename = 'evidencia.webp') => {
    const formData = new FormData();
    if (fileOrBlob instanceof Blob && !(fileOrBlob instanceof File)) {
      formData.append('file', fileOrBlob, filename);
    } else if (fileOrBlob instanceof File) {
      formData.append('file', fileOrBlob, filename || fileOrBlob.name);
    } else {
      formData.append('file', fileOrBlob, filename);
    }
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${BASE_URL}/api/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(res);
  }
};


