/**
 * Servicio de Geocodificación y Ruteo GPS en tiempo real para Chile
 * Utiliza OpenStreetMap Nominatim y OSRM (Open Source Routing Machine)
 */

export const CHILE_PRESET_LOCATIONS = [
  { id: 'casa_matriz', name: '🏢 Casa Matriz (Santiago Centro - Alameda 1302)', address: 'Alameda 1302, Santiago, Chile', lat: -33.4445, lng: -70.6550 },
  { id: 'bodega_renca', name: '🏭 Bodega Central Renca (Av. Las Esteras 2501)', address: 'Av Las Esteras 2501, Renca, Chile', lat: -33.3650, lng: -70.7350 },
  { id: 'cd_pudahuel', name: '📦 Centro Logístico Enea (Pudahuel)', address: 'Av Americo Vespucio 1001, Pudahuel, Chile', lat: -33.4280, lng: -70.7820 },
  { id: 'san_bernardo', name: '🚛 Terminal Sur San Bernardo (Nos)', address: 'Panamericana Sur km 23, San Bernardo, Chile', lat: -33.6050, lng: -70.7150 },
  { id: 'providencia', name: '🏙️ Sucursal Providencia (Av. Providencia 1234)', address: 'Av Providencia 1234, Providencia, Chile', lat: -33.4290, lng: -70.6211 },
  { id: 'las_condes', name: '🏢 Torre Apoquindo (Las Condes)', address: 'Av Apoquindo 4500, Las Condes, Chile', lat: -33.4140, lng: -70.5820 }
];

/**
 * Fórmula de Haversine para distancia en línea recta en km
 */
export const calculateHaversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Geocodifica una dirección en Chile (Calle, Número, Comuna) mediante Nominatim OSM
 */
export const geocodeAddress = async (addressQuery) => {
  if (!addressQuery || !addressQuery.trim()) {
    throw new Error('Debe ingresar una dirección.');
  }

  // Si ya es un preset de ubicación
  const preset = CHILE_PRESET_LOCATIONS.find(p => 
    p.name.toLowerCase().includes(addressQuery.toLowerCase()) || 
    addressQuery.toLowerCase().includes(p.id)
  );
  if (preset) {
    return {
      lat: preset.lat,
      lng: preset.lng,
      displayName: preset.name
    };
  }

  // Asegurar contexto chileno si no lo tiene
  let query = addressQuery.trim();
  if (!query.toLowerCase().includes('chile')) {
    query = `${query}, Chile`;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=cl&limit=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Error en servidor de geocodificación (${res.status})`);
    }

    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    } else {
      // Intento secundario más amplio si no encontró con número exacto
      const queryParts = query.split(',');
      if (queryParts.length > 1) {
        const fallbackQuery = `${queryParts[queryParts.length - 2].trim()}, Chile`;
        const resFallback = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&countrycodes=cl&limit=1`);
        const dataFallback = await resFallback.json();
        if (dataFallback && dataFallback.length > 0) {
          return {
            lat: parseFloat(dataFallback[0].lat),
            lng: parseFloat(dataFallback[0].lon),
            displayName: `${addressQuery} (${dataFallback[0].display_name})`
          };
        }
      }
      throw new Error(`No se encontró la dirección "${addressQuery}". Intente agregando la comuna (Ej: Av. Providencia 1234, Providencia).`);
    }
  } catch (err) {
    console.warn("Fallo al geocodificar dirección con OSM:", err);
    throw err;
  }
};

/**
 * Calcula la ruta de conducción real calle por calle con OSRM
 */
export const calculateDrivingRoute = async (origin, dest, isRoundTrip = false) => {
  // 1. Obtener coordenadas de origen y destino si vienen como texto
  let origCoords = origin;
  let destCoords = dest;

  let origName = origin.displayName || origin.name || (typeof origin === 'string' ? origin : 'Origen');
  let destName = dest.displayName || dest.name || (typeof dest === 'string' ? dest : 'Destino');

  if (typeof origin === 'string' || (!origin.lat && origin.address)) {
    const geo = await geocodeAddress(origin.address || origin);
    origCoords = { lat: geo.lat, lng: geo.lng };
    origName = geo.displayName;
  }

  if (typeof dest === 'string' || (!dest.lat && dest.address)) {
    const geo = await geocodeAddress(dest.address || dest);
    destCoords = { lat: geo.lat, lng: geo.lng };
    destName = geo.displayName;
  }

  // 2. Consultar OSRM
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origCoords.lng},${origCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson`;
    const res = await fetch(osrmUrl);
    
    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const bestRoute = data.routes[0];
        
        let distanceKm = parseFloat((bestRoute.distance / 1000).toFixed(1));
        let durationMin = Math.round(bestRoute.duration / 60);

        if (isRoundTrip) {
          distanceKm = parseFloat((distanceKm * 2).toFixed(1));
          durationMin = durationMin * 2;
        }

        // Convertir geometry [lon, lat] -> Leaflet [lat, lon]
        const leafletCoords = bestRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        const hours = Math.floor(durationMin / 60);
        const mins = durationMin % 60;
        const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

        return {
          success: true,
          distanceKm,
          durationMin,
          durationText,
          coordinates: leafletCoords,
          originCoords: [origCoords.lat, origCoords.lng],
          destCoords: [destCoords.lat, destCoords.lng],
          originName: origName,
          destName: destName,
          summary: bestRoute.legs[0]?.summary || 'Ruta Urbana Optimizada',
          isVerifiedGps: true
        };
      }
    }
  } catch (err) {
    console.warn("Fallo de OSRM, recurriendo a cálculo con factor de curvatura vial:", err);
  }

  // 3. Fallback vial: Haversine + factor de curvatura urbano de 1.32
  const directDistance = calculateHaversineDistanceKm(origCoords.lat, origCoords.lng, destCoords.lat, destCoords.lng);
  let distanceKm = parseFloat((directDistance * 1.32).toFixed(1));
  let durationMin = Math.round(distanceKm * 2.2); // Promedio 30 km/h en ciudad

  if (isRoundTrip) {
    distanceKm = parseFloat((distanceKm * 2).toFixed(1));
    durationMin = durationMin * 2;
  }

  return {
    success: true,
    distanceKm: Math.max(1, distanceKm),
    durationMin,
    durationText: `${durationMin} min`,
    coordinates: [[origCoords.lat, origCoords.lng], [destCoords.lat, destCoords.lng]],
    originCoords: [origCoords.lat, origCoords.lng],
    destCoords: [destCoords.lat, destCoords.lng],
    originName: origName,
    destName: destName,
    summary: 'Distancia Vial Estimada',
    isVerifiedGps: false
  };
};
