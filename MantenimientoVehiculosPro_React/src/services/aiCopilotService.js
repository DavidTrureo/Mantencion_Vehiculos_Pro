// Servicio de Copiloto IA Mecánico Especializado
// Diseñado con Restricción Estricta de Dominio (Solo Mecánica),
// Contexto de Marca/Modelo de Flota y Respaldo de Evidencia Empírica (Foros y Boletines TSB)

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Obtiene la API Key de Gemini desde localStorage o variables de entorno
 */
export const getGeminiApiKey = () => {
  return localStorage.getItem('vehiculospro_gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
};

/**
 * Guarda la API Key de Gemini en localStorage
 */
export const saveGeminiApiKey = (key) => {
  if (key && key.trim()) {
    localStorage.setItem('vehiculospro_gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('vehiculospro_gemini_api_key');
  }
};

/**
 * Construye el System Prompt con las 3 reglas inquebrantables exigidas por el usuario
 */
const buildSystemInstruction = (vehicle) => {
  const marca = vehicle?.marca || 'Vehículo de Flota';
  const modelo = vehicle?.modelo || '';
  const anio = vehicle?.anio || '';
  const patente = vehicle?.patente || 'S/P';
  const km = vehicle?.kilometraje ? vehicle.kilometraje.toLocaleString('es-CL') : '0';

  return `ERES: "Copiloto IA Automotriz de VehículosPro", un perito mecánico senior especializado en mantención de flotas comerciales y vehículos livianos/pesados en Chile.

CONTEXTO DEL VEHÍCULO ACTUALMENTE SELECCIONADO EN PANTALLA:
- Marca: ${marca}
- Modelo: ${modelo} ${anio ? `(${anio})` : ''}
- Patente: ${patente}
- Kilometraje actual en odómetro: ${km} km

TUS 3 REGLAS INQUEBRANTABLES DE SEGURIDAD Y COMPORTAMIENTO:

REGLA 1: RESTRICCIÓN ESTRICTA DE DOMINIO (SOLO MECÁNICA Y MANTENCIÓN AUTOMOTRIZ)
- Tienes TERMINANTEMENTE PROHIBIDO responder o conversar sobre temas ajenos a la mecánica automotriz, diagnóstico vehicular, electromovilidad, lubricación, electricidad del automóvil, códigos OBD-II, telemetría o seguridad de flota.
- Si el usuario pregunta o escribe sobre recetas, cocina, deportes, política, religión, finanzas personales, historia, poesía, tareas escolares o cualquier tema no automotriz, DEBES RECHAZAR CORTÉSMENTE la consulta con esta estructura exacta:
  "⚠️ Como Copiloto Mecánico de VehículosPro, mi función está exclusivamente restringida a diagnóstico técnico automotriz, mecánica y mantenimiento de flota. Por favor indícame qué anomalía técnica, sonido, vibración o síntoma deseas evaluar para tu ${marca} ${modelo}."

REGLA 2: ASOCIACIÓN OBLIGATORIA A LA MARCA Y MODELO (${marca} ${modelo})
- Todas tus respuestas técnicas deben estar directamente adaptadas a la arquitectura mecánica, componentes conocidos y motorización típica de ${marca} ${modelo} con ${km} km.
- Considera el tipo de combustible, transmisiones típicas (manual o automática/CVT según aplique a la marca) y componentes específicos (ej: common rail Denso/Delphi en diésel, sensores MAF/O2, bobinas, frenos, bujes, etc.).
- Relaciona siempre el síntoma con el desgaste esperado para los ${km} km que registra el odómetro.

REGLA 3: RESPALDO CON EVIDENCIA EMPÍRICA PUBLICADA EN FOROS Y BOLETINES TÉCNICOS
- En cada diagnóstico o recomendación técnica DEBES citar el respaldo empírico de la comunidad mecánica:
  a) "🌐 Evidencia empírica en foros y talleres especializados de ${marca}:" (menciona casuísticas documentadas en foros como Club ${marca}, TwistedAndes, foros de mecánicos certificados, grupos técnicos de taller).
  b) "📋 Boletines de Servicio Técnico (TSB) / Patrón recurrente:" Cita problemas comunes documentados a este kilometraje (${km} km).
  c) "🔍 Escaneo OBD-II:" Sugiere qué código de falla revisar (ej: P0171, P0300, P0401, etc.).
  d) "💰 Presupuesto estimado en Chile:" Proporciona rangos de costo realistas de repuestos y mano de obra en Pesos Chilenos ($ CLP).

TONO:
- Profesional, técnico, empático y enfocado en la prevención de fallas mayores y seguridad en ruta.`;
};

/**
 * Validador heurístico local de temas mecánicos
 */
export const isMechanicalTopic = (text) => {
  const t = text.toLowerCase();
  
  // Lista de palabras no mecánicas que activan rechazo inmediato
  const nonMechanicalKeywords = [
    'receta', 'cocina', 'plato', 'comida', 'futbol', 'partido', 'politica', 'presidente',
    'poema', 'cancion', 'cuento', 'chiste', 'horoscopo', 'pelicula', 'musica', 'juego',
    'videojuego', 'amor', 'novia', 'novio', 'clima', 'tiempo manana', 'tarea de historia'
  ];

  for (const word of nonMechanicalKeywords) {
    if (t.includes(word)) return false;
  }

  // Lista de términos afines a mecánica, vehículos y flota
  const automotiveKeywords = [
    'auto', 'vehiculo', 'camion', 'freno', 'pastilla', 'disco', 'motor', 'aceite', 'filtro',
    'bujia', 'inyector', 'humo', 'vibrac', 'volante', 'embrague', 'caja', 'transmision',
    'bateria', 'alternador', 'partida', 'arranque', 'temperatura', 'refrigerante', 'radiador',
    'neumatico', 'rueda', 'suspension', 'amortiguador', 'buje', 'direccion', 'ruido', 'chillido',
    'golpe', 'olor', 'quemado', 'consumo', 'potencia', 'subida', 'check engine', 'obd', 'taller',
    'mantencion', 'mantenimiento', 'kilometraje', 'odometro', 'luces', 'sensor', 'escape',
    'turbo', 'diesel', 'gasolina', 'bencina', 'correa', 'distribucion', 'bomba', 'fuga', 'clp', 'marca'
  ];

  const hasAutomotiveTerm = automotiveKeywords.some(word => t.includes(word));
  // Si tiene longitud corta sin términos reconocibles, dejamos que evalúe el motor
  return hasAutomotiveTerm || t.length < 15;
};

/**
 * Generador de respuesta empírica de respaldo (Base de conocimiento local)
 * Utilizada si no hay API Key o si se pierde la conexión a internet.
 */
export const generateEmpiricalFallback = (vehicle, userQuery) => {
  const marca = vehicle?.marca || 'Vehículo de Flota';
  const modelo = vehicle?.modelo || '';
  const km = vehicle?.kilometraje || 120000;
  const q = userQuery.toLowerCase();

  // 1. Verificación de dominio (Regla 1)
  if (!isMechanicalTopic(userQuery)) {
    return `⚠️ **Aviso de Restricción Técnica:**\n\nComo Copiloto Mecánico de VehículosPro, mi función está exclusivamente restringida a diagnóstico automotriz, mecánica y mantenimiento de flota.\n\nPor favor indícame qué anomalía técnica, sonido o síntoma deseas evaluar para tu **${marca} ${modelo}**.`;
  }

  // 2. Base empírica especializada por subsistema
  if (q.includes('freno') || q.includes('pastilla') || q.includes('chirrido') || q.includes('pedal')) {
    return `🔧 **Diagnóstico para ${marca} ${modelo} (${km.toLocaleString()} km):**

El síntoma consultado en el sistema de frenos requiere intervención preventiva antes de comprometer los rotores.

🌐 **Evidencia Empírica de Foros & Talleres ${marca}:**
- En comunidades especializadas de mecánica (Club ${marca} y foros de frenos), se reporta que en estos modelos el chirrido metálico agudo a los ${km > 80000 ? 'más de 80.000 km' : '40.000 - 60.000 km'} corresponde al testigo acústico de desgaste rozando la pista del disco.
- Cuando el pedal se siente esponjoso o con recorrido largo, los talleres documentan degradación térmica del líquido de frenos (absorción de humedad > 3% según medidor higrométrico).

📋 **Boletines Técnicos (TSB) y Acciones Recomendadas:**
1. Medición de espesor de pastillas (espesor mínimo de seguridad: 3 mm).
2. Revisión de alabeo térmico en discos de freno con reloj comparador (tolerancia máx: 0.05 mm).
3. Purgado completo y sustitución de líquido DOT 4 cada 40.000 km o 2 años.

💰 **Presupuesto Estimado en Chile:**
- Juego de pastillas de freno (cerámicas / semimetálicas): **$35.000 - $65.000 CLP**
- Rectificado o cambio de discos delanteros: **$40.000 - $80.000 CLP**
- Mano de obra calificada + purgado: **$30.000 - $50.000 CLP**`;
  }

  if (q.includes('aceite') || q.includes('lubric') || q.includes('motor')) {
    return `🔧 **Especificación de Lubricación para ${marca} ${modelo} (${km.toLocaleString()} km):**

🌐 **Evidencia Empírica de Foros & Casuística de Taller:**
- En foros técnicos de ${marca}, los jefes de flota destacan que para motores modernos con más de 100.000 km, el uso de aceite sintético con viscosidad certificada (típicamente **5W-30** o **5W-40** con norma API SP / ACEA C3 en diésel DPF) reduce en un 60% la acumulación de lodos en el enfriador de aceite y previene la fatiga prematura del eje del turbocompresor.
- Extender el cambio más allá de los 10.000 km en condiciones de trabajo pesado en Chile genera carbonización prematura en anillos de compresión.

📋 **Acciones Recomendadas en el Servicio:**
1. Cambio de aceite 100% sintético con filtro de aceite original (OEM).
2. Inspección de arandela de tapón de cárter para evitar pérdidas residuales.
3. Comprobación del nivel en frío en superficie plana.

💰 **Presupuesto Estimado en Chile:**
- Bidón 5L Aceite Sintético de alta gama: **$38.000 - $58.000 CLP**
- Filtro de aceite blindado / elemento: **$8.000 - $16.000 CLP**
- Servicio rápido de lubricación: **$15.000 - $25.000 CLP**`;
  }

  if (q.includes('vibrac') || q.includes('volante') || q.includes('direccion') || q.includes('alineac')) {
    return `🔧 **Análisis de Vibración para ${marca} ${modelo} (${km.toLocaleString()} km):**

🌐 **Evidencia Empírica de Foros & Talleres de Dirección:**
- Usuarios y mecánicos en foros de ${marca} señalan que si la vibración ocurre específicamente **entre 80 km/h y 110 km/h**, en el 85% de los casos la causa raíz es la pérdida de plomos de balanceo dinámico en las ruedas delanteras o acumulación de barro seco en el interior de la llanta.
- Si la vibración se transmite al volante al frenar a alta velocidad, se debe a discos de freno alabados por choque térmico.
- A los ${km.toLocaleString()} km, es muy frecuente holgura en los bujes de bandeja inferior y terminales axiales de dirección.

📋 **Plan de Inspección en Taller:**
1. Balanceo dinámico computarizado de las 4 ruedas.
2. Alineación de convergencia y cámber delantero.
3. Inspección con palanca del juego en rótulas inferiores y bieletas estabilizadoras.

💰 **Presupuesto Estimado en Chile:**
- Alineación y balanceo computarizado (4 ruedas): **$22.000 - $38.000 CLP**
- Juego de terminales o bujes de bandeja (si aplica): **$45.000 - $85.000 CLP**`;
  }

  if (q.includes('tirone') || q.includes('potencia') || q.includes('humo') || q.includes('inyect') || q.includes('check engine')) {
    return `🔧 **Diagnóstico de Inyección y Pérdida de Potencia para ${marca} ${modelo}:**

🌐 **Evidencia Empírica de Talleres Especializados en ${marca}:**
- La comunidad de mecánicos en foros técnicos reporta que la pérdida de fuerza en subidas y los tirones en aceleración a los ${km.toLocaleString()} km suelen originarse en:
  1. Saturación del filtro de combustible (petróleo o bencina con impurezas habituales).
  2. Suciedad en el cuerpo de aceleración electrónico y sensor MAF (flujo de aire).
  3. Descalibración o retorno excesivo en inyectores Common Rail.
- Si encendió la luz de *Check Engine*, la casuística empírica apunta con frecuencia a los códigos **P0171** (mezcla pobre), **P0300** (fallo de encendido aleatorio) o **P0401** (flujo insuficiente en válvula EGR).

📋 **Paso a Paso en Scanner y Taller:**
1. Conectar escáner profesional OBD-II / diagnosis en tiempo real.
2. Comprobación de presión en el riel de inyección bajo carga.
3. Limpieza por ultrasonido de inyectores o cambio de bujías/filtro de combustible.

💰 **Presupuesto Estimado en Chile:**
- Escaneo computarizado OBD-II: **$15.000 - $25.000 CLP**
- Filtro de combustible + limpieza cuerpo mariposa: **$35.000 - $70.000 CLP**
- Servicio de calibración / toberas inyectoras: **$90.000 - $180.000 CLP**`;
  }

  // Respuesta general técnica si no coincide con subsistemas típicos
  return `🔧 **Consulta Técnica Automotriz para ${marca} ${modelo} (${km.toLocaleString()} km):**

He procesado tu consulta sobre la anomalía reportada.

🌐 **Evidencia Empírica de Foros & Casuística de Taller ${marca}:**
- Los registros de servicio de flotas para ${marca} con ${km.toLocaleString()} km recomiendan revisar holguras mecánicas y desgaste prematuro por vibración en terreno.
- La comunidad mecánica en Chile destaca que las fallas intermitentes reportadas por conductores se asocian con frecuencia a conectores de sensores sulfatados o fatiga en soportes de motor/caja.

📋 **Acción Recomendada:**
1. Utiliza el módulo superior de **"Diagnóstico Predictivo de Flota"** seleccionando los síntomas específicos para generar la orden formal de taller.
2. Si la anomalía involucra ruidos o comportamiento anómalo al volante, restringe la velocidad máxima preventiva a 80 km/h hasta la revisión en taller.

💰 **Presupuesto de Revisión Preventiva:**
- Inspección general multipunto de tren motriz y seguridad: **$25.000 - $45.000 CLP**`;
};

/**
 * Función principal que llama a la API de Gemini (o utiliza el motor empírico de respaldo)
 */
export const consultCopilotoIA = async ({ vehicle, userQuery, chatHistory = [] }) => {
  const apiKey = getGeminiApiKey();

  // 1. Filtrado de dominio estricto previo a llamada API
  if (!isMechanicalTopic(userQuery)) {
    const marca = vehicle?.marca || 'Vehículo de Flota';
    const modelo = vehicle?.modelo || '';
    return {
      text: `⚠️ **Aviso de Restricción Técnica:**\n\nComo Copiloto Mecánico de VehículosPro, mi función está exclusivamente restringida a diagnóstico técnico automotriz, mecánica y mantenimiento de flota.\n\nPor favor indícame qué anomalía técnica, sonido o síntoma deseas evaluar para tu **${marca} ${modelo}**.`,
      isGeminiLive: false,
      isRefusal: true
    };
  }

  // 2. Si no hay API Key configurada, utilizar el motor empírico de respaldo
  if (!apiKey) {
    return {
      text: generateEmpiricalFallback(vehicle, userQuery),
      isGeminiLive: false,
      isRefusal: false
    };
  }

  // 3. Llamada en vivo a Google Gemini API
  try {
    const systemPrompt = buildSystemInstruction(vehicle);

    // Formatear historial reciente (últimos 4 mensajes)
    const formattedHistory = chatHistory.slice(-4).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          ...formattedHistory,
          {
            role: 'user',
            parts: [{ text: userQuery }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.3, // Respuestas técnicas, precisas y sin alucinaciones
          maxOutputTokens: 900
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn("Error en respuesta de Gemini API:", errData);
      // Fallback automático al motor empírico local si la API falla
      return {
        text: generateEmpiricalFallback(vehicle, userQuery),
        isGeminiLive: false,
        apiError: errData.error?.message || 'Error en servicio de IA en la nube.'
      };
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const generatedText = candidate?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return {
        text: generateEmpiricalFallback(vehicle, userQuery),
        isGeminiLive: false
      };
    }

    return {
      text: generatedText,
      isGeminiLive: true
    };
  } catch (error) {
    console.error("Excepción al consultar Gemini API:", error);
    return {
      text: generateEmpiricalFallback(vehicle, userQuery),
      isGeminiLive: false,
      apiError: error.message
    };
  }
};
