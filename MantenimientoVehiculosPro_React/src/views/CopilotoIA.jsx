import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  DollarSign, 
  TrendingUp, 
  Send, 
  HelpCircle,
  FileText,
  ShieldCheck,
  Zap,
  Activity,
  Key,
  Globe,
  Settings,
  X,
  Check,
  Info
} from 'lucide-react';
import Toast from '../components/Toast';
import { 
  consultCopilotoIA, 
  getGeminiApiKey, 
  saveGeminiApiKey 
} from '../services/aiCopilotService';

const PRESET_SYMPTOMS = [
  { label: 'Chirrido agudo al frenar', cat: 'Frenos' },
  { label: 'Vibración en el volante a > 80 km/h', cat: 'Dirección / Suspensión' },
  { label: 'Pérdida de potencia en subidas', cat: 'Inyección / Motor' },
  { label: 'Consumo excesivo de combustible', cat: 'Inyectores / Sensores' },
  { label: 'Humo negro o azulado en escape', cat: 'Combustión / Aceite' },
  { label: 'Tironeo al cambiar de marcha', cat: 'Transmisión / Embrague' },
  { label: 'Testigo Check Engine encendido', cat: 'Electrónica / Sensores' },
  { label: 'Arranque pesado en frío', cat: 'Batería / Alternador' },
];

const CopilotoIA = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [symptomText, setSymptomText] = useState('');
  const [selectedPresets, setSelectedPresets] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [toast, setToast] = useState(null);

  // Chatbot state
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: '¡Hola! Soy tu Copiloto IA Mecánico de VehículosPro. Mi función está restringida exclusivamente a diagnóstico automotriz, mecánica y mantenimiento de flota, respaldado con evidencia empírica de foros y boletines técnicos de la marca. ¿Qué anomalía, sonido o síntoma deseas evaluar?'
    }
  ]);
  const [inputChat, setInputChat] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState(getGeminiApiKey());
  const [isLiveConnected, setIsLiveConnected] = useState(!!getGeminiApiKey());

  const handleSaveApiKey = (e) => {
    e.preventDefault();
    saveGeminiApiKey(geminiKeyInput);
    setIsLiveConnected(!!geminiKeyInput.trim());
    setShowKeyModal(false);
    setToast({
      message: geminiKeyInput.trim() 
        ? '¡API Key de Google Gemini guardada! El Copiloto responderá con IA generativa en vivo.' 
        : 'API Key removida. El Copiloto operará con el motor empírico local.',
      type: 'success'
    });
  };

  useEffect(() => {
    const loadFleet = async () => {
      try {
        const list = await api.getTodosLosVehiculos();
        setVehicles(list);
        if (list.length > 0) {
          setSelectedVehicleId(list[0].id);
        }
      } catch (e) {
        console.error("Error al cargar flota para IA:", e);
      }
    };
    loadFleet();
  }, []);

  const activeVehicle = vehicles.find(v => v.id === Number(selectedVehicleId)) || null;

  const togglePreset = (label) => {
    setSelectedPresets(prev => 
      prev.includes(label) ? prev.filter(p => p !== label) : [...prev, label]
    );
  };

  // Motor de Análisis Predictivo IA
  const handleAnalyzeDiagnosis = () => {
    if (!activeVehicle) {
      setToast({ message: 'Seleccione un vehículo para evaluar.', type: 'warning' });
      return;
    }

    const fullSymptoms = [...selectedPresets, symptomText.trim()].filter(Boolean).join('. ');
    if (!fullSymptoms) {
      setToast({ message: 'Indique al menos un síntoma o seleccione una anomalía.', type: 'warning' });
      return;
    }

    setAnalyzing(true);
    setDiagnosticResult(null);

    // Simulación de inferencia predictiva basada en odometría y síntomas
    setTimeout(() => {
      const km = activeVehicle.kilometraje || 0;
      let diagnosis = {
        vehiculo: `${activeVehicle.marca} ${activeVehicle.modelo} (${activeVehicle.patente || 'S/P'})`,
        odometro: km,
        severidad: 'MODERADA', // CRITICA | MODERADA | PREVENTIVA
        fallaProbable: '',
        explicacion: '',
        piezasSugeridas: [],
        costoEstimadoCLP: '',
        ahorroPreventivoCLP: '',
        accionesTaller: []
      };

      const symLower = fullSymptoms.toLowerCase();

      if (symLower.includes('fren') || symLower.includes('chirrido')) {
        diagnosis.severidad = km > 100000 ? 'CRITICA' : 'MODERADA';
        diagnosis.fallaProbable = 'Desgaste crítico en pastillas de freno y alabeo térmico de discos delanteros';
        diagnosis.explicacion = `Dado que el vehículo tiene ${km.toLocaleString()} km, las pastillas han alcanzado su ciclo límite de fricción. El chirrido metálico indica que el sensor acústico de desgaste está rozando el disco. Si no se interviene de inmediato, rayará los rotores duplicando el costo de reparación.`;
        diagnosis.piezasSugeridas = ['Juego de pastillas de freno cerámicas', 'Rectificado o cambio de discos ventilados', 'Líquido de frenos DOT 4'];
        diagnosis.costoEstimadoCLP = '$75.000 - $130.000 CLP';
        diagnosis.ahorroPreventivoCLP = '$380.000 CLP (al evitar rotura de cáliper y rectificación mayor)';
        diagnosis.accionesTaller = [
          'Medir espesor de pastillas con micrómetro (límite mínimo legal: 3mm)',
          'Verificar desbalanceo axial de discos con reloj comparador',
          'Purgar y reemplazar líquido de frenos con prueba de humedad'
        ];
      } else if (symLower.includes('vibrac') || symLower.includes('volante')) {
        diagnosis.severidad = 'MODERADA';
        diagnosis.fallaProbable = 'Desbalanceo dinámico de neumáticos y holgura en bujes o terminales de dirección';
        diagnosis.explicacion = `A velocidades superiores a 80 km/h, la vibración sostenida en la columna de dirección genera fatiga prematura en la cremallera y terminales de dirección. Requiere alineación y balanceo computarizado de 4 ruedas.`;
        diagnosis.piezasSugeridas = ['Balanceo dinámico 4 ruedas', 'Alineación computarizada delantera/trasera', 'Bujes de horquilla'];
        diagnosis.costoEstimadoCLP = '$35.000 - $65.000 CLP';
        diagnosis.ahorroPreventivoCLP = '$280.000 CLP (evita desgaste irregular de 2 neumáticos nuevos)';
        diagnosis.accionesTaller = [
          'Revisar juego en rótulas y terminales de barra estabilizadora',
          'Balancear llantas y verificar deformaciones en banda de rodadura',
          'Alinear convergencia según especificaciones de fábrica'
        ];
      } else if (symLower.includes('potencia') || symLower.includes('humo') || symLower.includes('combustible')) {
        diagnosis.severidad = 'CRITICA';
        diagnosis.fallaProbable = 'Obstrucción en circuito de inyección o saturación de filtro de aire/combustible';
        diagnosis.explicacion = `Con ${km.toLocaleString()} km, la mezcla aire/combustible está descompensada. Esto genera acumulación de carbonilla en válvulas y riesgo de daño al sensor de oxígeno y convertidor catalítico.`;
        diagnosis.piezasSugeridas = ['Limpieza por ultrasonido de inyectores', 'Filtro de combustible', 'Filtro de aire de alto flujo', 'Bujías de iridio'];
        diagnosis.costoEstimadoCLP = '$90.000 - $160.000 CLP';
        diagnosis.ahorroPreventivoCLP = '$650.000 CLP (evita reemplazo de convertidor catalítico)';
        diagnosis.accionesTaller = [
          'Escanear códigos de falla OBD-II (revisar códigos P0171 / P0300)',
          'Probar presión de riel de combustible en ralentí y carga',
          'Reemplazar bujías y filtros de admisión'
        ];
      } else {
        diagnosis.severidad = 'PREVENTIVA';
        diagnosis.fallaProbable = 'Desgaste acumulativo por kilometraje operacional y mantención preventiva periódica';
        diagnosis.explicacion = `El reporte técnico coincide con el intervalo de inspección programada para vehículos de flota con ${km.toLocaleString()} km. Se recomienda una revisión general de 25 puntos de seguridad antes de asignar nuevas rutas.`;
        diagnosis.piezasSugeridas = ['Revisión general de fluidos', 'Inspección de tren delantero', 'Batería y estado de carga'];
        diagnosis.costoEstimadoCLP = '$45.000 - $85.000 CLP';
        diagnosis.ahorroPreventivoCLP = '$450.000 CLP en paradas no programadas en carretera';
        diagnosis.accionesTaller = [
          'Revisión visual de fugas en cárter y caja de cambios',
          'Comprobación de voltaje en alternador (> 13.8V en carga)',
          'Inspección de estado de mangueras y correas de accesorios'
        ];
      }

      setDiagnosticResult(diagnosis);
      setAnalyzing(false);
      setToast({ message: 'Diagnóstico predictivo de IA generado exitosamente.', type: 'success' });
    }, 1200);
  };

  // Chat con el copiloto
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!inputChat.trim() || isChatLoading) return;

    const userText = inputChat.trim();
    const newHistory = [...chatMessages, { sender: 'user', text: userText }];
    setChatMessages(newHistory);
    setInputChat('');
    setIsChatLoading(true);

    try {
      const response = await consultCopilotoIA({
        vehicle: activeVehicle,
        userQuery: userText,
        chatHistory: chatMessages
      });

      setChatMessages([
        ...newHistory,
        {
          sender: 'ai',
          text: response.text,
          isGeminiLive: response.isGeminiLive,
          isRefusal: response.isRefusal
        }
      ]);
    } catch (err) {
      console.error("Error en consulta de chat IA:", err);
      setChatMessages([
        ...newHistory,
        {
          sender: 'ai',
          text: 'Ocurrió un inconveniente al procesar la consulta técnica. Por favor reintenta tu pregunta sobre el vehículo.'
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles size={28} color="#a855f7" />
            Copiloto IA: Diagnóstico Predictivo de Flota
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Inteligencia Artificial aplicada para predecir fallas mecánicas, estimar presupuestos de reparación y optimizar costos de flota
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Zap size={14} />
            Motor IA v2.4 Activo
          </span>
        </div>
      </div>

      {/* Grid Principal: Formulario de Diagnóstico IA + Chatbot */}
      <div className="responsive-grid copiloto-main-grid" style={{ marginBottom: '2rem' }}>
        
        {/* Columna Izquierda: Asistente de Diagnóstico */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} color="#a855f7" />
              Análisis Predictivo de Fallas Mecánicas
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Basado en Odómetro y Telemetría</span>
          </div>

          {/* 1. Seleccionar Vehículo */}
          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Vehículo de la Flota a Evaluar</label>
              {activeVehicle && (
                <span 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
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
                  🏷️ Patente: {activeVehicle.patente || 'Sin Patente'}
                </span>
              )}
            </div>
            <select
              className="form-input form-select"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              style={{ fontWeight: 600 }}
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  🚗 {v.marca} {v.modelo} · [{v.patente || 'Sin Patente'}] [{(v.kilometraje ?? 0).toLocaleString()} km] · Conductor: {v.propietarioNombre || 'Sin asignar'}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Síntomas Frecuentes Rápidos */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
              Seleccionar Síntomas o Anomalías Observadas:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {PRESET_SYMPTOMS.map((p, idx) => {
                const isSelected = selectedPresets.includes(p.label);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => togglePreset(p.label)}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #a855f7' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.02)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Descripción Libre del Chofer / Taller */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Notas Adicionales del Conductor o Taller (Opcional)</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Ejemplo: El vehículo emite un silbido al acelerar y el pedal de embrague vibra al soltarlo..."
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Botón de Ejecución de IA */}
          <button
            className="btn btn-primary"
            onClick={handleAnalyzeDiagnosis}
            disabled={analyzing}
            style={{
              padding: '0.85rem',
              background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
              border: 'none',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {analyzing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>Analizando Odometría y Patrones Mecánicos con IA...</span>
              </div>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Generar Diagnóstico Predictivo con IA</span>
              </>
            )}
          </button>
        </div>

        {/* Columna Derecha: Chat Copiloto IA de Flota */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: 0, overflow: 'hidden' }}>
          
          {/* Header del Chat */}
          <div style={{ padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <Bot size={20} color="#a855f7" />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Copiloto Mecánico IA</span>
                  {activeVehicle && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                      {activeVehicle.marca} {activeVehicle.modelo}
                    </span>
                  )}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                  {isLiveConnected ? (
                    <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
                      ✨ Gemini 1.5 Flash (En vivo)
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <Globe size={11} />
                      Motor Empírico Local (Foros & TSB)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowKeyModal(true)}
              className="btn btn-secondary"
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderRadius: 'var(--radius-sm)'
              }}
              title="Configurar Google Gemini API Key"
            >
              <Key size={13} color="#a855f7" />
              <span>{isLiveConnected ? 'API Key Conectada' : 'Configurar API'}</span>
            </button>
          </div>

          {/* Mensajes del Chat */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {chatMessages.map((msg, idx) => {
              const isAi = msg.sender === 'ai';
              return (
                <div 
                  key={idx} 
                  style={{ 
                    alignSelf: isAi ? 'flex-start' : 'flex-end',
                    maxWidth: isAi ? '92%' : '80%',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isAi ? 'rgba(255,255,255,0.03)' : 'rgba(59, 130, 246, 0.25)',
                    border: isAi ? '1px solid var(--border-color)' : '1px solid rgba(59, 130, 246, 0.4)',
                    fontSize: '0.84rem',
                    lineHeight: '1.5',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  {isAi && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: '#c084fc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Bot size={13} />
                        Copiloto Mecánico
                      </span>
                      {msg.isRefusal ? (
                        <span style={{ fontSize: '0.65rem', color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.15)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          ⚠️ Filtro de Dominio
                        </span>
                      ) : msg.isGeminiLive ? (
                        <span style={{ fontSize: '0.65rem', color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.15)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                          ✨ Gemini 1.5 Live
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.65rem', color: '#a78bfa', backgroundColor: 'rgba(167, 139, 250, 0.12)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(167, 139, 250, 0.25)' }}>
                          🌐 Base Foros & TSB
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {/* Spinner de Carga de IA */}
            {isChatLoading && (
              <div 
                style={{ 
                  alignSelf: 'flex-start',
                  maxWidth: '85%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(168, 85, 247, 0.08)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(168, 85, 247, 0.3)', borderTopColor: '#c084fc', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span>Consultando foros mecánicos, TSBs y especificaciones técnicas de la marca...</span>
              </div>
            )}
          </div>

          {/* Formulario Input Chat */}
          <form onSubmit={handleSendChat} style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <input
              type="text"
              className="form-input"
              placeholder={`Pregunta sobre ruidos, frenos, motor o mantención de tu ${activeVehicle ? activeVehicle.marca : 'vehículo'}...`}
              value={inputChat}
              onChange={(e) => setInputChat(e.target.value)}
              disabled={isChatLoading}
              style={{ margin: 0, fontSize: '0.85rem' }}
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isChatLoading || !inputChat.trim()}
              style={{ padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Resultado del Diagnóstico Predictivo (Informe Técnico de IA) */}
      {diagnosticResult && (
        <div className="glass-card" style={{ border: '2px solid rgba(168, 85, 247, 0.4)', boxShadow: '0 0 25px rgba(168, 85, 247, 0.15)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className={`badge ${diagnosticResult.severidad === 'CRITICA' ? 'badge-danger' : diagnosticResult.severidad === 'MODERADA' ? 'badge-warning' : 'badge-success'}`}>
                  Nivel de Severidad: {diagnosticResult.severidad}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Evaluado con odómetro a {diagnosticResult.odometro.toLocaleString()} km
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
                {diagnosticResult.fallaProbable}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Vehículo: <strong>{diagnosticResult.vehiculo}</strong>
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => navigate(`/mantenimientos?vehiculoId=${selectedVehicleId}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Wrench size={16} />
              <span>Crear Orden de Mantención Preventiva</span>
            </button>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            {diagnosticResult.explicacion}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Presupuesto Estimado */}
            <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', marginBottom: '0.25rem' }}>
                COSTO ESTIMADO TALLER (CLP)
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                {diagnosticResult.costoEstimadoCLP}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Incluye repuestos OEM + mano de obra
              </div>
            </div>

            {/* Ahorro Preventivo */}
            <div style={{ padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#60a5fa', marginBottom: '0.25rem' }}>
                AHORRO ESTIMADO POR PREVENCIÓN
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#60a5fa' }}>
                {diagnosticResult.ahorroPreventivoCLP}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Al evitar avería mayor o remolque en ruta
              </div>
            </div>
          </div>

          {/* Acciones para el mecánico */}
          <div className="form-grid-2" style={{ gap: '1.5rem' }}>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} color="#10b981" />
                Plan de Acción Recomendado para el Taller Mecánico:
              </h4>
              <ul style={{ paddingLeft: '1.25rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {diagnosticResult.accionesTaller.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wrench size={16} color="var(--primary)" />
                Repuestos o Servicios Sugeridos:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {diagnosticResult.piezasSugeridas.map((p, i) => (
                  <span key={i} className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.06)', padding: '0.35rem 0.65rem' }}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración de API Key (Google Gemini) */}
      {showKeyModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => setShowKeyModal(false)}
        >
          <div 
            className="glass-card"
            style={{
              maxWidth: '520px',
              width: '100%',
              backgroundColor: '#111827',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(168, 85, 247, 0.2)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.75rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={18} color="#c084fc" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Configuración de Copiloto IA</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Google Gemini 1.5 Flash + Guardrails de Mecánica</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowKeyModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.5rem', borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                <strong style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <ShieldCheck size={14} /> 3 Reglas Inquebrantables del Copiloto:
                </strong>
                <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <li><strong>Solo Mecánica:</strong> Rechaza cualquier tema ajeno a mecánica o flota.</li>
                  <li><strong>Asociado a la Marca:</strong> Diagnóstico específico al vehículo seleccionado.</li>
                  <li><strong>Evidencia Empírica:</strong> Cita foros especializados, TSBs y costos en $ CLP.</li>
                </ol>
              </div>

              <p style={{ margin: 0 }}>
                Puedes usar el <strong>Motor Empírico Local</strong> sin costo ni API Key, o ingresar una clave gratuita de <strong>Google Gemini</strong> para razonamiento generativo avanzado en tiempo real:
              </p>
            </div>

            <form onSubmit={handleSaveApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Gemini API Key (Google AI Studio)</span>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ color: '#a855f7', textDecoration: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                  >
                    Obtener API Key gratuita ↗
                  </a>
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="AIzaSy..."
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                {geminiKeyInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setGeminiKeyInput('');
                      saveGeminiApiKey('');
                      setIsLiveConnected(false);
                      setShowKeyModal(false);
                      setToast({ message: 'Clave removida. Usando motor empírico local.', type: 'info' });
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', color: '#ef4444' }}
                  >
                    Borrar Clave
                  </button>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #9333ea, #3b82f6)',
                      border: 'none',
                      fontWeight: 700
                    }}
                  >
                    Guardar Configuración
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style>{`
        .copiloto-main-grid {
          grid-template-columns: 1.4fr 1fr;
        }

        @media (max-width: 900px) {
          .copiloto-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CopilotoIA;

