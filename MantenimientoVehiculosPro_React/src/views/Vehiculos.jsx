import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Car, 
  Plus, 
  Trash2, 
  Edit3, 
  QrCode, 
  Wrench, 
  X, 
  UserCheck, 
  AlertTriangle,
  FileText,
  FileCheck,
  Eye,
  UploadCloud,
  ShieldCheck,
  Power,
  Sparkles,
  Printer,
  Download,
  CheckCircle2,
  Search
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Toast from '../components/Toast';
import DocumentModal from '../components/DocumentModal';
import { evaluarDocumento, evaluarEstadoDocumentacionVehiculo, cleanDocVal } from '../components/DocumentosVehiculoSection';
import { autoEscanearDocumento } from '../services/documentParser';
import QRCode from 'qrcode';

const Vehiculos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectParam = searchParams.get('select');

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState({ id: 'ALL', fullName: 'Toda la Flota Corporativa' });
  const [toast, setToast] = useState(null);
  
  // Filtro de Asignación y Búsqueda de Flota
  const [assignmentFilter, setAssignmentFilter] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'ASSIGNED'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' or 'edit'
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [modalTab, setModalTab] = useState('general'); // 'general' | 'documentos'
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  // Form states - General
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formAnio, setFormAnio] = useState(new Date().getFullYear());
  const [formKilometraje, setFormKilometraje] = useState(0);
  const [formPatente, setFormPatente] = useState('');
  const [formOwnerId, setFormOwnerId] = useState('');
  const [formActivo, setFormActivo] = useState(true);

  // Form states - Documentos Legales Chilenos
  // 0. Padrón del Vehículo (Registro Civil)
  const [formPadronFolio, setFormPadronFolio] = useState('');
  const [formPadronVin, setFormPadronVin] = useState('');
  const [formPadronMotor, setFormPadronMotor] = useState('');
  const [formPadronFechaEmision, setFormPadronFechaEmision] = useState('');
  const [formPadronImagen, setFormPadronImagen] = useState('');
  const [ocrScanningDoc, setOcrScanningDoc] = useState(null); // 'PADRON' | 'PRT' | 'SOAP' | 'PERMISO' | null

  // 1. PRT
  const [formRevisionTecnicaVencimiento, setFormRevisionTecnicaVencimiento] = useState('');
  const [formRevisionTecnicaNumero, setFormRevisionTecnicaNumero] = useState('');
  const [formRevisionTecnicaImagen, setFormRevisionTecnicaImagen] = useState('');

  // 2. SOAP
  const [formSoapAseguradora, setFormSoapAseguradora] = useState('');
  const [formSoapVencimiento, setFormSoapVencimiento] = useState('');
  const [formSoapPoliza, setFormSoapPoliza] = useState('');
  const [formSoapImagen, setFormSoapImagen] = useState('');

  // 3. Permiso de Circulación
  const [formPermisoCirculacionMunicipalidad, setFormPermisoCirculacionMunicipalidad] = useState('');
  const [formPermisoCirculacionVencimiento, setFormPermisoCirculacionVencimiento] = useState('');
  const [formPermisoCirculacionFolio, setFormPermisoCirculacionFolio] = useState('');
  const [formPermisoCirculacionImagen, setFormPermisoCirculacionImagen] = useState('');
  
  // NHTSA Data states
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // QR Modal states
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrVehicle, setQrVehicle] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Generar código QR localmente con margen reglamentario (Quiet Zone de 4 módulos)
  useEffect(() => {
    if (!qrVehicle) {
      setQrDataUrl('');
      return;
    }
    const qrData = qrVehicle.qrCode || `VEHICULO:${qrVehicle.id}`;
    QRCode.toDataURL(qrData, {
      width: 480,
      margin: 4, // 4 módulos completos de margen blanco reglamentario según ISO/IEC 18004
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error("Error al generar código QR local con qrcode:", err);
    });
  }, [qrVehicle]);

  const isAdmin = user?.role === 'ADMIN';
  const isMecanico = user?.role === 'MECANICO';

  // 1. Cargar lista de usuarios (si es Admin o Mecánico)
  useEffect(() => {
    const fetchUsers = async () => {
      if (isAdmin || isMecanico) {
        try {
          const list = await api.getUsuarios();
          setUsers(list);
          setSelectedUser({ id: 'ALL', fullName: 'Toda la Flota Corporativa' });
        } catch (e) {
          console.error("Error al cargar usuarios:", e);
        }
      } else {
        setSelectedUser(user);
      }
    };
    fetchUsers();
  }, [isAdmin, isMecanico, user]);

  // 2. Cargar vehículos de la flota o del usuario seleccionado (con soporte de auto-refresco en vivo)
  const fetchVehicles = useCallback(async (isSilent = false) => {
    if (!selectedUser) return;
    if (!isSilent) setLoading(true);
    try {
      let list = [];
      if (selectedUser.id === 'ALL') {
        list = await api.getTodosLosVehiculos();
      } else {
        list = await api.getVehiculosPorUsuario(selectedUser.id);
      }
      setVehicles(list);
    } catch (e) {
      console.error("Error al cargar vehículos:", e);
      if (!isSilent) setToast({ message: 'Error al recuperar vehículos.', type: 'error' });
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [selectedUser]);

  useEffect(() => {
    fetchVehicles(false);

    // Auto-sincronización periódica cada 6 segundos para reflejar salidas a ruta y retornos desde teléfonos en vivo
    const pollTimer = setInterval(() => {
      fetchVehicles(true);
    }, 6000);

    const handleFocusSync = () => {
      fetchVehicles(true);
    };
    window.addEventListener('focus', handleFocusSync);
    document.addEventListener('visibilitychange', handleFocusSync);

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener('focus', handleFocusSync);
      document.removeEventListener('visibilitychange', handleFocusSync);
    };
  }, [fetchVehicles]);

  // Cargar marcas NHTSA
  useEffect(() => {
    const fetchMakes = async () => {
      try {
        const list = await api.getMarcasNhtsa();
        setMarcas(list);
      } catch (e) {
        console.error("Error al cargar marcas NHTSA:", e);
      }
    };
    fetchMakes();
  }, []);

  // Cargar modelos NHTSA cuando cambia la marca seleccionada
  useEffect(() => {
    const fetchModels = async () => {
      if (!formMarca) {
        setModelos([]);
        return;
      }
      setLoadingModels(true);
      try {
        const list = await api.getModelosNhtsa(formMarca);
        setModelos(list);
      } catch (e) {
        console.error("Error al cargar modelos:", e);
        setModelos([]);
      } finally {
        setLoadingModels(false);
      }
    };
    fetchModels();
  }, [formMarca]);

  // Helper para leer imágenes y documentos PDF en base64 con extracción OCR inteligente
  const handleDocImageUploadWithOCR = (tipoDoc, imageSetter) => (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result;

      // Si es una imagen común, previsualizarla inmediatamente
      if (!isPdf) {
        imageSetter(dataUrl);
      }

      setOcrScanningDoc(tipoDoc);
      setToast({ 
        message: `🔍 Analizando y leyendo ${tipoDoc}${isPdf ? ' (PDF)' : ''}...`, 
        type: 'info' 
      });

      try {
        const extracted = await autoEscanearDocumento(tipoDoc, dataUrl);

        // Si el archivo fue un PDF y generó vista renderizada en canvas, usamos esa imagen
        if (extracted.renderedImage) {
          imageSetter(extracted.renderedImage);
        } else if (isPdf) {
          imageSetter(dataUrl);
        }

        const campos = [];

        if (tipoDoc === 'PADRON') {
          if (extracted.padronFolio) { setFormPadronFolio(extracted.padronFolio); campos.push(`Folio (${extracted.padronFolio})`); }
          if (extracted.padronVin) { setFormPadronVin(extracted.padronVin); campos.push(`VIN (${extracted.padronVin})`); }
          if (extracted.padronMotor) { setFormPadronMotor(extracted.padronMotor); campos.push(`Motor (${extracted.padronMotor})`); }
          if (extracted.padronFechaEmision) { setFormPadronFechaEmision(extracted.padronFechaEmision); campos.push(`Emisión (${extracted.padronFechaEmision})`); }
          if (extracted.patente && !formPatente) { setFormPatente(extracted.patente); campos.push(`Patente (${extracted.patente})`); }
          if (extracted.anio && !formAnio) { setFormAnio(extracted.anio); campos.push(`Año (${extracted.anio})`); }
        } else if (tipoDoc === 'PRT') {
          if (extracted.revisionTecnicaNumero) { setFormRevisionTecnicaNumero(extracted.revisionTecnicaNumero); campos.push(`Certificado (${extracted.revisionTecnicaNumero})`); }
          if (extracted.revisionTecnicaVencimiento) { setFormRevisionTecnicaVencimiento(extracted.revisionTecnicaVencimiento); campos.push(`Vence (${extracted.revisionTecnicaVencimiento})`); }
        } else if (tipoDoc === 'SOAP') {
          if (extracted.soapAseguradora) { setFormSoapAseguradora(extracted.soapAseguradora); campos.push(`Aseguradora (${extracted.soapAseguradora})`); }
          if (extracted.soapPoliza) { setFormSoapPoliza(extracted.soapPoliza); campos.push(`Póliza (${extracted.soapPoliza})`); }
          if (extracted.soapVencimiento) { setFormSoapVencimiento(extracted.soapVencimiento); campos.push(`Vence (${extracted.soapVencimiento})`); }
        } else if (tipoDoc === 'PERMISO') {
          if (extracted.permisoCirculacionMunicipalidad) { setFormPermisoCirculacionMunicipalidad(extracted.permisoCirculacionMunicipalidad); campos.push(`Muni (${extracted.permisoCirculacionMunicipalidad})`); }
          if (extracted.permisoCirculacionFolio) { setFormPermisoCirculacionFolio(extracted.permisoCirculacionFolio); campos.push(`Folio (${extracted.permisoCirculacionFolio})`); }
          if (extracted.permisoCirculacionVencimiento) { setFormPermisoCirculacionVencimiento(extracted.permisoCirculacionVencimiento); campos.push(`Vence (${extracted.permisoCirculacionVencimiento})`); }
        }

        if (campos.length > 0) {
          setToast({ 
            message: `✨ ¡Lectura ${isPdf ? 'PDF / ' : ''}OCR exitosa! Se extrajeron: ${campos.join(', ')}.`, 
            type: 'success' 
          });
        } else {
          setToast({ message: `Documento ${isPdf ? 'PDF ' : ''}cargado correctamente.`, type: 'info' });
        }
      } catch (err) {
        console.error("Error al procesar OCR/PDF:", err);
        if (isPdf) {
          imageSetter(dataUrl);
        }
        setToast({ message: 'Documento cargado correctamente.', type: 'info' });
      } finally {
        setOcrScanningDoc(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Abrir visor de documento desde la tarjeta
  const handleViewDocFromCard = (v, tipo) => {
    if (tipo === 'PADRON') {
      const padronValido = Boolean(
        cleanDocVal(v.padronFolio) || 
        cleanDocVal(v.padronImagen) || 
        cleanDocVal(v.padronVin)
      );
      setSelectedDoc({
        titulo: 'Certificado de Inscripción de Vehículos Motorizados (Padrón)',
        tipo: 'PADRON',
        patente: v.patente,
        fechaVencimiento: cleanDocVal(v.padronFechaEmision) ? `Emitido: ${cleanDocVal(v.padronFechaEmision)}` : 'Documento Permanente',
        numero: cleanDocVal(v.padronFolio) || cleanDocVal(v.padronVin) || 'Sin registrar',
        numeroLabel: 'Folio / N° Chasis (VIN)',
        emisor: 'Registro Civil e Identificación de Chile',
        emisorLabel: 'Entidad Emisora',
        imagen: cleanDocVal(v.padronImagen),
        estado: padronValido ? 'vigente' : 'sin_registrar',
        detallesExtra: [
          { label: 'N° Chasis / VIN', valor: cleanDocVal(v.padronVin) },
          { label: 'N° Motor', valor: cleanDocVal(v.padronMotor) },
          { label: 'Fecha Emisión', valor: cleanDocVal(v.padronFechaEmision) }
        ].filter(d => d.valor)
      });
    } else if (tipo === 'PRT') {
      const st = evaluarDocumento(v.revisionTecnicaVencimiento);
      setSelectedDoc({
        titulo: 'Certificado de Revisión Técnica (PRT)',
        tipo: 'PRT',
        patente: v.patente,
        fechaVencimiento: cleanDocVal(v.revisionTecnicaVencimiento) || 'Sin registrar',
        numero: cleanDocVal(v.revisionTecnicaNumero) || 'Sin registrar',
        numeroLabel: 'N° Certificado / Planta',
        emisor: cleanDocVal(v.revisionTecnicaNumero) ? `Planta ${cleanDocVal(v.revisionTecnicaNumero)}` : 'Planta Homologada',
        emisorLabel: 'Planta PRT',
        imagen: cleanDocVal(v.revisionTecnicaImagen),
        estado: st.estado,
        diasRestantes: st.dias
      });
    } else if (tipo === 'SOAP') {
      const st = evaluarDocumento(v.soapVencimiento);
      setSelectedDoc({
        titulo: 'Seguro Obligatorio (SOAP)',
        tipo: 'SOAP',
        patente: v.patente,
        fechaVencimiento: cleanDocVal(v.soapVencimiento) || 'Sin registrar',
        numero: cleanDocVal(v.soapPoliza) || 'Sin registrar',
        numeroLabel: 'N° de Póliza',
        emisor: cleanDocVal(v.soapAseguradora) || 'Compañía Aseguradora',
        emisorLabel: 'Compañía Aseguradora',
        imagen: cleanDocVal(v.soapImagen),
        estado: st.estado,
        diasRestantes: st.dias
      });
    } else if (tipo === 'PERMISO') {
      const st = evaluarDocumento(v.permisoCirculacionVencimiento);
      setSelectedDoc({
        titulo: 'Permiso de Circulación',
        tipo: 'PERMISO',
        patente: v.patente,
        fechaVencimiento: cleanDocVal(v.permisoCirculacionVencimiento) || 'Sin registrar',
        numero: cleanDocVal(v.permisoCirculacionFolio) || 'Sin registrar',
        numeroLabel: 'Folio / Comprobante de Pago',
        emisor: cleanDocVal(v.permisoCirculacionMunicipalidad) || 'Municipalidad Emisora',
        emisorLabel: 'Municipalidad Emisora',
        imagen: cleanDocVal(v.permisoCirculacionImagen),
        estado: st.estado,
        diasRestantes: st.dias
      });
    }
  };

  // Abrir Modal de creación (Solo Administrador)
  const handleOpenCreateModal = () => {
    if (!isAdmin) {
      setToast({ message: 'Acceso denegado: Solo los administradores tienen permisos para registrar nuevos vehículos.', type: 'error' });
      return;
    }
    setModalType('create');
    setEditingVehicleId(null);
    setModalTab('general');
    setFormMarca('');
    setFormModelo('');
    setFormAnio(new Date().getFullYear());
    setFormKilometraje(0);
    setFormPatente('');
    setFormOwnerId(selectedUser?.id !== 'ALL' ? selectedUser?.id : (users[0]?.id || user?.id || 1));
    setFormActivo(true);

    // Reset Documentos
    setFormPadronFolio('');
    setFormPadronVin('');
    setFormPadronMotor('');
    setFormPadronFechaEmision('');
    setFormPadronImagen('');

    setFormRevisionTecnicaVencimiento('');
    setFormRevisionTecnicaNumero('');
    setFormRevisionTecnicaImagen('');
    setFormSoapAseguradora('');
    setFormSoapVencimiento('');
    setFormSoapPoliza('');
    setFormSoapImagen('');
    setFormPermisoCirculacionMunicipalidad('');
    setFormPermisoCirculacionVencimiento('');
    setFormPermisoCirculacionFolio('');
    setFormPermisoCirculacionImagen('');

    setShowModal(true);
  };

  // Abrir Modal de edición (Solo Administrador)
  const handleOpenEditModal = (vehicle) => {
    if (!isAdmin) {
      setToast({ message: 'Acceso denegado: Solo los administradores tienen permisos para editar información de vehículos.', type: 'error' });
      return;
    }
    setModalType('edit');
    setEditingVehicleId(vehicle.id);
    setModalTab('general');
    setFormMarca(vehicle.marca);
    setFormModelo(vehicle.modelo);
    setFormAnio(vehicle.anio);
    setFormKilometraje(vehicle.kilometraje);
    setFormPatente(vehicle.patente || '');
    setFormOwnerId(vehicle.propietarioId || (users[0]?.id || user?.id || 1));
    setFormActivo(vehicle.activo !== false);

    // Populate Documentos
    setFormPadronFolio(vehicle.padronFolio || '');
    setFormPadronVin(vehicle.padronVin || '');
    setFormPadronMotor(vehicle.padronMotor || '');
    setFormPadronFechaEmision(vehicle.padronFechaEmision || '');
    setFormPadronImagen(vehicle.padronImagen || '');

    setFormRevisionTecnicaVencimiento(vehicle.revisionTecnicaVencimiento || '');
    setFormRevisionTecnicaNumero(vehicle.revisionTecnicaNumero || '');
    setFormRevisionTecnicaImagen(vehicle.revisionTecnicaImagen || '');
    setFormSoapAseguradora(vehicle.soapAseguradora || '');
    setFormSoapVencimiento(vehicle.soapVencimiento || '');
    setFormSoapPoliza(vehicle.soapPoliza || '');
    setFormSoapImagen(vehicle.soapImagen || '');
    setFormPermisoCirculacionMunicipalidad(vehicle.permisoCirculacionMunicipalidad || '');
    setFormPermisoCirculacionVencimiento(vehicle.permisoCirculacionVencimiento || '');
    setFormPermisoCirculacionFolio(vehicle.permisoCirculacionFolio || '');
    setFormPermisoCirculacionImagen(vehicle.permisoCirculacionImagen || '');

    setShowModal(true);
  };

  // Guardar Vehículo (Crear o Editar - Solo Administrador)
  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setToast({ message: 'Acceso denegado: Solo los administradores tienen permisos para registrar o editar vehículos.', type: 'error' });
      return;
    }
    if (!formMarca || !formModelo || !formAnio || !formPatente) {
      setToast({ message: 'Todos los campos generales son obligatorios.', type: 'error' });
      return;
    }

    if (formAnio < 1900 || formAnio > new Date().getFullYear() + 1) {
      setToast({ message: 'Ingrese un año válido.', type: 'error' });
      return;
    }

    if (formKilometraje < 0) {
      setToast({ message: 'El kilometraje no puede ser negativo.', type: 'error' });
      return;
    }

    const targetOwnerId = (selectedUser?.id !== 'ALL' ? selectedUser?.id : formOwnerId) || user?.id || 1;

    const payload = {
      marca: formMarca,
      modelo: formModelo,
      anio: parseInt(formAnio),
      kilometraje: parseInt(formKilometraje),
      patente: formPatente.toUpperCase().trim(),
      propietarioId: targetOwnerId,
      activo: formActivo,

      // Documentación Legal Chilena
      // 0. Padrón del Vehículo
      padronFolio: formPadronFolio || null,
      padronVin: formPadronVin || null,
      padronMotor: formPadronMotor || null,
      padronFechaEmision: formPadronFechaEmision || null,
      padronImagen: formPadronImagen || null,

      // 1. PRT
      revisionTecnicaVencimiento: formRevisionTecnicaVencimiento || null,
      revisionTecnicaNumero: formRevisionTecnicaNumero || null,
      revisionTecnicaImagen: formRevisionTecnicaImagen || null,

      // 2. SOAP
      soapAseguradora: formSoapAseguradora || null,
      soapVencimiento: formSoapVencimiento || null,
      soapPoliza: formSoapPoliza || null,
      soapImagen: formSoapImagen || null,

      // 3. Permiso de Circulación
      permisoCirculacionMunicipalidad: formPermisoCirculacionMunicipalidad || null,
      permisoCirculacionVencimiento: formPermisoCirculacionVencimiento || null,
      permisoCirculacionFolio: formPermisoCirculacionFolio || null,
      permisoCirculacionImagen: formPermisoCirculacionImagen || null
    };

    try {
      if (modalType === 'create') {
        const createdVeh = await api.crearVehiculo(targetOwnerId, payload);
        setShowModal(false);
        await fetchVehicles();
        if (createdVeh && (createdVeh.id || createdVeh.patente)) {
          setQrVehicle(createdVeh);
          setShowQrModal(true);
          setToast({ 
            message: `¡Vehículo ${createdVeh.patente || ''} creado con éxito! Puedes imprimir su credencial QR ahora.`, 
            type: 'success' 
          });
        } else {
          setToast({ message: 'Vehículo registrado exitosamente en la flota.', type: 'success' });
        }
      } else {
        await api.actualizarVehiculo(editingVehicleId, payload);
        setShowModal(false);
        fetchVehicles();
        setToast({ message: 'Vehículo y documentación legal actualizados exitosamente.', type: 'success' });
      }
    } catch (e) {
      console.error("Error al guardar vehículo:", e);
      setToast({ message: e.message || 'Error al guardar el vehículo.', type: 'error' });
    }
  };

  // Eliminar Vehículo
  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este vehículo? Se borrarán todos sus registros de mantenimiento.')) {
      return;
    }

    try {
      await api.eliminarVehiculo(id);
      setToast({ message: 'Vehículo eliminado correctamente.', type: 'success' });
      fetchVehicles();
    } catch (e) {
      console.error("Error al eliminar vehículo:", e);
      setToast({ message: 'No se pudo eliminar el vehículo.', type: 'error' });
    }
  };

  // Encender / Apagar Vehículo (Activar o Desactivar operatividad - Solo Administrador)
  const handleToggleVehicleActivo = async (vehicle) => {
    if (!isAdmin) {
      setToast({ message: 'Acceso denegado: Solo los administradores tienen permisos para cambiar el estado operativo de los vehículos.', type: 'error' });
      return;
    }
    const isActivo = vehicle.activo !== false;
    const accion = isActivo ? 'apagar / dar de baja temporalmente' : 'encender / habilitar';
    if (!window.confirm(`¿Desea ${accion} el móvil ${vehicle.marca} ${vehicle.modelo} (${vehicle.patente})?`)) {
      return;
    }

    try {
      await api.toggleVehiculoActivo(vehicle.id);
      setToast({ 
        message: `Vehículo ${vehicle.patente} ${isActivo ? 'apagado (fuera de servicio)' : 'encendido (operativo)'} exitosamente.`, 
        type: 'success' 
      });
      fetchVehicles();
    } catch (e) {
      console.error("Error al cambiar estado de operatividad del vehículo:", e);
      setToast({ message: 'Error al cambiar estado del vehículo.', type: 'error' });
    }
  };

  // Ver QR Modal
  const handleOpenQrModal = (vehicle) => {
    setQrVehicle(vehicle);
    setShowQrModal(true);
  };

  // Imprimir Ficha / Credencial QR
  // Imprimir Ficha / Credencial QR sin riesgo de bloqueo de popups
  const handlePrintQr = () => {
    if (!qrVehicle) return;
    const qrData = qrVehicle.qrCode || `VEHICULO:${qrVehicle.id}`;
    const qrImgUrl = qrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=4&data=${encodeURIComponent(qrData)}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Credencial QR - ${qrVehicle.patente || qrVehicle.modelo}</title>
        <style>
          @page { size: auto; margin: 10mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #0f172a;
            margin: 0;
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .badge-card {
            width: 320px;
            border: 2px dashed #94a3b8;
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            background: #ffffff;
            page-break-inside: avoid;
          }
          .header-title {
            font-size: 13px;
            font-weight: 800;
            color: #2563eb;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .header-subtitle {
            font-size: 10px;
            color: #64748b;
            margin-bottom: 14px;
          }
          .patente-box {
            display: inline-block;
            background: #ffffff;
            border: 3px solid #0f172a;
            border-radius: 6px;
            padding: 6px 20px;
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 2px;
            color: #0f172a;
            margin-bottom: 8px;
          }
          .veh-info {
            font-size: 13px;
            font-weight: 700;
            color: #334155;
            margin-bottom: 14px;
          }
          .qr-img {
            width: 200px;
            height: 200px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 8px;
            background: #ffffff;
            margin-bottom: 12px;
            display: block;
            margin-left: auto;
            margin-right: auto;
          }
          .code-label {
            font-size: 11px;
            font-family: monospace;
            background: #f1f5f9;
            padding: 4px 10px;
            border-radius: 4px;
            color: #475569;
            display: inline-block;
            margin-bottom: 12px;
          }
          .footer-note {
            font-size: 9.5px;
            color: #64748b;
            line-height: 1.4;
            border-top: 1px solid #f1f5f9;
            padding-top: 10px;
          }
          .cut-instructions {
            margin-top: 14px;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="badge-card">
          <div class="header-title">🚗 VehículosPro Fleet</div>
          <div class="header-subtitle">Credencial de Identificación y Acceso Operativo</div>
          
          <div class="patente-box">${qrVehicle.patente || 'SIN PATENTE'}</div>
          <div class="veh-info">${qrVehicle.marca} ${qrVehicle.modelo} (${qrVehicle.anio})</div>
          
          <img src="${qrImgUrl}" alt="Código QR" class="qr-img" />
          
          <div>
            <span class="code-label">${qrData}</span>
          </div>
          
          <div class="footer-note">
            Escanee este código con la app para iniciar turno, consultar vigencia de Padrón (CIVM), PRT, SOAP o registrar mantención técnica.
          </div>
        </div>
        <div class="cut-instructions">✂️ Recortar por la línea punteada para plastificar o adherir al parabrisas / parasol.</div>
      </body>
      </html>
    `;

    // Usar iframe oculto para evitar bloqueadores de popups
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(htmlContent);
    frameDoc.close();

    let printed = false;
    const triggerPrint = () => {
      if (printed) return;
      printed = true;
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (err) {
        console.error('Error al imprimir ficha:', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 2500);
      }
    };

    const qrImg = frameDoc.querySelector('img');
    if (qrImg) {
      qrImg.onload = () => setTimeout(triggerPrint, 250);
      qrImg.onerror = () => triggerPrint();
      // Salvaguarda si la imagen ya estaba en caché
      setTimeout(triggerPrint, 700);
    } else {
      setTimeout(triggerPrint, 300);
    }
  };

  // Descargar Imagen QR (PNG) oficial con margen blanco garantizado
  const handleDownloadQr = async () => {
    if (!qrVehicle) return;
    const qrData = qrVehicle.qrCode || `VEHICULO:${qrVehicle.id}`;
    try {
      const dataUrl = qrDataUrl || await QRCode.toDataURL(qrData, {
        width: 600,
        margin: 4, // 4 módulos de margen blanco garantizado
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'M'
      });

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `QR-${qrVehicle.patente || qrVehicle.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setToast({ message: 'Código QR descargado con éxito en su dispositivo.', type: 'success' });
    } catch (err) {
      console.error("Error al descargar QR:", err);
      setToast({ message: 'Error al generar la descarga del QR.', type: 'error' });
    }
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
            Gestión de Vehículos
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Administre los vehículos y revise sus alertas
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Selector de Usuario para Admin/Mecánico */}
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
              <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Filtrar flota:</span>
              <select 
                className="form-input form-select"
                style={{ 
                  width: '240px', 
                  padding: '0.4rem 2rem 0.4rem 0.75rem', 
                  fontSize: '0.85rem',
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

          {isAdmin && (
            <button className="btn btn-primary" onClick={handleOpenCreateModal}>
              <Plus size={18} />
              <span>Registrar Vehículo</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtro Rápido de Flota: Todos / Disponibles / Asignados y Buscador */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          padding: '0.85rem 1.15rem',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Pestañas de Filtro de Asignación */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '0.25rem' }}>
            Estado de Asignación:
          </span>

          <button
            type="button"
            onClick={() => setAssignmentFilter('ALL')}
            className={`btn ${assignmentFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
            style={{ 
              padding: '0.4rem 0.95rem', 
              fontSize: '0.82rem', 
              borderRadius: '20px',
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontWeight: assignmentFilter === 'ALL' ? 700 : 500
            }}
          >
            <span>🏢 Todos</span>
            <span style={{ 
              background: assignmentFilter === 'ALL' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
              padding: '2px 7px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {vehicles.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAssignmentFilter('AVAILABLE')}
            className={`btn ${assignmentFilter === 'AVAILABLE' ? 'btn-success' : 'btn-outline'}`}
            style={{ 
              padding: '0.4rem 0.95rem', 
              fontSize: '0.82rem', 
              borderRadius: '20px',
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontWeight: assignmentFilter === 'AVAILABLE' ? 700 : 500,
              borderColor: assignmentFilter === 'AVAILABLE' ? 'var(--color-success)' : 'rgba(16, 185, 129, 0.4)',
              color: assignmentFilter === 'AVAILABLE' ? '#fff' : '#34d399',
              background: assignmentFilter === 'AVAILABLE' ? 'var(--color-success)' : 'rgba(16, 185, 129, 0.05)'
            }}
          >
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }}></span>
            <span>🟢 Disponibles (Sin Asignar)</span>
            <span style={{ 
              background: assignmentFilter === 'AVAILABLE' ? 'rgba(255,255,255,0.25)' : 'rgba(16, 185, 129, 0.15)',
              padding: '2px 7px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: assignmentFilter === 'AVAILABLE' ? '#fff' : '#34d399'
            }}>
              {vehicles.filter(v => !v.propietarioId && !v.propietarioNombre).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAssignmentFilter('ASSIGNED')}
            className={`btn ${assignmentFilter === 'ASSIGNED' ? 'btn-primary' : 'btn-outline'}`}
            style={{ 
              padding: '0.4rem 0.95rem', 
              fontSize: '0.82rem', 
              borderRadius: '20px',
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              fontWeight: assignmentFilter === 'ASSIGNED' ? 700 : 500,
              borderColor: assignmentFilter === 'ASSIGNED' ? 'var(--primary)' : 'rgba(59, 130, 246, 0.4)',
              color: assignmentFilter === 'ASSIGNED' ? '#fff' : '#60a5fa',
              background: assignmentFilter === 'ASSIGNED' ? 'var(--primary)' : 'rgba(59, 130, 246, 0.05)'
            }}
          >
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#60a5fa' }}></span>
            <span>🔵 Asignados (En Ruta)</span>
            <span style={{ 
              background: assignmentFilter === 'ASSIGNED' ? 'rgba(255,255,255,0.25)' : 'rgba(59, 130, 246, 0.15)',
              padding: '2px 7px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: assignmentFilter === 'ASSIGNED' ? '#fff' : '#60a5fa'
            }}>
              {vehicles.filter(v => !!v.propietarioId || !!v.propietarioNombre).length}
            </span>
          </button>
        </div>

        {/* Buscador de patente / marca / chofer */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Buscar por patente, marca o chofer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              padding: '0.45rem 1.8rem 0.45rem 0.85rem', 
              fontSize: '0.82rem', 
              margin: 0,
              borderRadius: '20px',
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid var(--border-color)',
              width: '100%'
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Grid de Vehículos */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (() => {
        const displayedVehicles = vehicles.filter(v => {
          const isAssigned = !!v.propietarioId || !!v.propietarioNombre;
          if (assignmentFilter === 'AVAILABLE' && isAssigned) return false;
          if (assignmentFilter === 'ASSIGNED' && !isAssigned) return false;

          if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            const matchPatente = v.patente && v.patente.toLowerCase().includes(q);
            const matchMarca = v.marca && v.marca.toLowerCase().includes(q);
            const matchModelo = v.modelo && v.modelo.toLowerCase().includes(q);
            const matchChofer = v.propietarioNombre && v.propietarioNombre.toLowerCase().includes(q);
            return matchPatente || matchMarca || matchModelo || matchChofer;
          }
          return true;
        });

        if (vehicles.length === 0) {
          return (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              <Car size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h3>No hay vehículos registrados</h3>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                Haga clic en "Registrar Vehículo" para agregar su primer automóvil.
              </p>
            </div>
          );
        }

        if (displayedVehicles.length === 0) {
          return (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
              <Car size={44} color="var(--text-muted)" style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <h3>No se encontraron vehículos con este filtro</h3>
              <p style={{ marginTop: '0.4rem', fontSize: '0.85rem' }}>
                {assignmentFilter === 'AVAILABLE' ? 'Actualmente no hay vehículos disponibles (todos están asignados en ruta).' : (
                  assignmentFilter === 'ASSIGNED' ? 'No hay vehículos asignados actualmente (toda la flota está disponible / sin asignar).' : 'Ningún vehículo coincide con la búsqueda.'
                )}
              </p>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ marginTop: '1rem', fontSize: '0.82rem' }}
                onClick={() => { setAssignmentFilter('ALL'); setSearchTerm(''); }}
              >
                Restablecer Filtros
              </button>
            </div>
          );
        }

        return (
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
              gap: '1.5rem' 
            }}
          >
            {displayedVehicles.map((v) => {
              const hasAlerts = v.alertas && v.alertas.length > 0;
              const isHighlighted = selectParam && Number(selectParam) === v.id;
              const isAssigned = !!v.propietarioId || !!v.propietarioNombre;
              
              return (
                <div 
                  key={v.id} 
                  className="glass-card glass-card-hover" 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    height: '100%',
                    border: isHighlighted 
                      ? '2px solid var(--primary)' 
                      : (v.activo === false ? '1px dashed rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)'),
                    borderTop: isHighlighted
                      ? '3px solid var(--primary)'
                      : (isAssigned ? '3px solid #3b82f6' : '3px solid #10b981'),
                    boxShadow: isHighlighted ? '0 0 15px rgba(59, 130, 246, 0.2)' : 'var(--shadow-md)',
                    opacity: v.activo === false ? 0.82 : 1,
                    background: v.activo === false ? 'rgba(239, 68, 68, 0.03)' : 'var(--bg-surface)',
                    overflow: 'hidden'
                  }}
                >
                  <div>
                    {/* Card Title */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{v.marca}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>{v.modelo}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                        {/* Estado Operativo (Solo Admin puede apagar/encender) */}
                        {isAdmin ? (
                          <button 
                            type="button"
                            onClick={() => handleToggleVehicleActivo(v)}
                            title={v.activo !== false ? "Click para apagar / dar de baja temporalmente" : "Click para encender / poner en servicio"}
                            className={`badge ${v.activo !== false ? 'badge-success' : 'badge-danger'}`}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '5px', 
                              fontSize: '0.68rem', 
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: 'none',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '12px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Power size={11} />
                            <span>{v.activo !== false ? 'Operativo' : 'Fuera de Servicio'}</span>
                          </button>
                        ) : (
                          <span 
                            className={`badge ${v.activo !== false ? 'badge-success' : 'badge-danger'}`}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '5px', 
                              fontSize: '0.68rem', 
                              fontWeight: 700,
                              padding: '0.25rem 0.55rem',
                              borderRadius: '12px'
                            }}
                            title={`Estado del vehículo: ${v.activo !== false ? 'Operativo' : 'Fuera de Servicio'}`}
                          >
                            <Power size={11} />
                            <span>{v.activo !== false ? 'Operativo' : 'Fuera de Servicio'}</span>
                          </span>
                        )}

                        {/* Badge de Asignación / Disponibilidad */}
                        {isAssigned ? (
                          <span 
                            className="badge badge-info" 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#60a5fa',
                              border: '1px solid rgba(59, 130, 246, 0.3)'
                            }}
                            title={`Asignado a: ${v.propietarioNombre || `ID #${v.propietarioId}`}`}
                          >
                            <UserCheck size={11} />
                            <span>Asignado ({v.propietarioNombre ? v.propietarioNombre.split(' ')[0] : 'En Ruta'})</span>
                          </span>
                        ) : (
                          <span 
                            className="badge badge-success" 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '4px', 
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399',
                              border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            <CheckCircle2 size={11} />
                            <span>🟢 Disponible</span>
                          </span>
                        )}

                        {(() => {
                          const docStatus = evaluarEstadoDocumentacionVehiculo(v);
                          return (
                            <span 
                              className={`badge ${docStatus.badgeClass}`} 
                              style={{ 
                                fontSize: '0.65rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 700,
                                border: `1px solid ${docStatus.borderColor}`
                              }}
                              title={docStatus.descripcion}
                            >
                              <span>{docStatus.iconText}</span>
                              <span>{docStatus.label}</span>
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    <div 
                      style={{ 
                        fontSize: '0.85rem', 
                        color: 'var(--text-secondary)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.5rem',
                        marginBottom: '1.25rem',
                        padding: '0.85rem',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Patente:</span>
                        <strong style={{ color: 'var(--text-primary)', letterSpacing: '0.05em' }}>{v.patente || 'N/A'}</strong>
                      </div>

                      {/* Estado Asignación / Conductor */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Conductor / Asignación:</span>
                        {isAssigned ? (
                          <strong style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            👤 {v.propietarioNombre || `Chofer #${v.propietarioId}`}
                          </strong>
                        ) : (
                          <strong style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            🟢 Disponible (Sin Asignar)
                          </strong>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Año de Fabricación:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{v.anio}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Kilometraje Actual:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{v.kilometraje.toLocaleString()} km</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Código de Identificación:</span>
                        <strong style={{ color: 'var(--text-muted)' }}>{v.qrCode || `VEHICULO:${v.id}`}</strong>
                      </div>
                    </div>


                  {/* Documentos Legales Obligatorios (Chile) */}
                  {(() => {
                    const padronValido = Boolean(
                      cleanDocVal(v.padronFolio) || 
                      cleanDocVal(v.padronImagen) || 
                      cleanDocVal(v.padronVin)
                    );
                    const prt = evaluarDocumento(v.revisionTecnicaVencimiento);
                    const soap = evaluarDocumento(v.soapVencimiento);
                    const perm = evaluarDocumento(v.permisoCirculacionVencimiento);

                    return (
                      <div 
                        style={{ 
                          margin: '0 0 1rem 0', 
                          padding: '0.65rem 0.75rem', 
                          backgroundColor: 'rgba(255,255,255,0.02)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: 'var(--radius-sm)' 
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <FileCheck size={13} color="var(--primary)" />
                            Documentación Legal (Chile):
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Ver doc ↗</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem' }}>
                          <button
                            type="button"
                            onClick={() => handleViewDocFromCard(v, 'PADRON')}
                            style={{
                              background: 'rgba(0,0,0,0.3)',
                              border: `1px solid ${padronValido ? 'var(--color-success)' : 'var(--border-color)'}`,
                              borderRadius: '4px',
                              padding: '0.35rem 0.15rem',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.15rem'
                            }}
                            title={`Certificado de Inscripción de Vehículos Motorizados (Padrón - R.V.M.): ${padronValido ? 'Inscrito / Al Día' : 'Sin registrar'}`}
                          >
                            <span style={{ fontWeight: 700, fontSize: '0.7rem', color: 'var(--text-primary)' }}>Padrón</span>
                            <span style={{ color: padronValido ? 'var(--color-success)' : 'var(--text-muted)', fontSize: '0.62rem', fontWeight: 600 }}>
                              {padronValido ? 'Al día' : 'Sin Doc.'}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleViewDocFromCard(v, 'PRT')}
                            style={{
                              background: 'rgba(0,0,0,0.3)',
                              border: `1px solid ${prt.color || 'var(--border-color)'}`,
                              borderRadius: '4px',
                              padding: '0.35rem 0.15rem',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.15rem'
                            }}
                            title={`Revisión Técnica: ${prt.label}`}
                          >
                            <span style={{ fontWeight: 700, fontSize: '0.7rem', color: 'var(--text-primary)' }}>PRT</span>
                            <span style={{ color: prt.color, fontSize: '0.62rem', fontWeight: 600 }}>
                              {prt.chipLabel || prt.label}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleViewDocFromCard(v, 'SOAP')}
                            style={{
                              background: 'rgba(0,0,0,0.3)',
                              border: `1px solid ${soap.color || 'var(--border-color)'}`,
                              borderRadius: '4px',
                              padding: '0.35rem 0.15rem',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.15rem'
                            }}
                            title={`SOAP: ${soap.label}`}
                          >
                            <span style={{ fontWeight: 700, fontSize: '0.7rem', color: 'var(--text-primary)' }}>SOAP</span>
                            <span style={{ color: soap.color, fontSize: '0.62rem', fontWeight: 600 }}>
                              {soap.chipLabel || soap.label}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleViewDocFromCard(v, 'PERMISO')}
                            style={{
                              background: 'rgba(0,0,0,0.3)',
                              border: `1px solid ${perm.color || 'var(--border-color)'}`,
                              borderRadius: '4px',
                              padding: '0.35rem 0.15rem',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '0.15rem'
                            }}
                            title={`Permiso de Circulación: ${perm.label}`}
                          >
                            <span style={{ fontWeight: 700, fontSize: '0.7rem', color: 'var(--text-primary)' }}>Permiso</span>
                            <span style={{ color: perm.color, fontSize: '0.62rem', fontWeight: 600 }}>
                              {perm.chipLabel || perm.label}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Alertas si tiene */}
                  {hasAlerts && (
                    <div 
                      style={{ 
                        margin: '0.5rem 0 1.25rem 0', 
                        padding: '0.75rem', 
                        borderRadius: 'var(--radius-sm)', 
                        backgroundColor: 'rgba(239, 68, 68, 0.05)', 
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        fontSize: '0.8rem',
                        color: 'var(--color-danger)',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'flex-start'
                      }}
                    >
                      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                      <div>
                        {v.alertas.map((alert, i) => (
                          <div key={i} style={{ marginBottom: i < v.alertas.length - 1 ? '0.25rem' : 0 }}>
                            {alert}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '0.5rem', 
                    borderTop: '1px solid var(--border-color)', 
                    paddingTop: '0.85rem',
                    marginTop: 'auto',
                    flexWrap: 'wrap'
                  }}
                >
                  <button 
                    className="btn btn-secondary btn-sm" 
                    title="Mantenimientos" 
                    style={{ flex: '1 1 120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    onClick={() => navigate(`/mantenimientos?vehiculoId=${v.id}`)}
                  >
                    <Wrench size={15} />
                    <span>Mantenimientos</span>
                  </button>

                  <button 
                    className="btn btn-secondary btn-sm" 
                    title="Ver e Imprimir Ficha QR"
                    onClick={() => handleOpenQrModal(v)}
                    style={{ padding: '0.45rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <QrCode size={15} color="var(--primary)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Ficha QR</span>
                  </button>

                  {isAdmin && (
                    <button 
                      className="btn btn-secondary btn-sm" 
                      title="Editar vehículo"
                      onClick={() => handleOpenEditModal(v)}
                      style={{ padding: '0.5rem' }}
                    >
                      <Edit3 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        );
      })()}

      {/* CREATE & EDIT VEHICLE MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.35rem' }}>
                {modalType === 'create' ? 'Registrar Nuevo Vehículo' : 'Editar Vehículo'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setModalTab('general')}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: modalTab === 'general' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: modalTab === 'general' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s'
                }}
              >
                <Car size={16} />
                <span>Datos Generales</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('documentos')}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: modalTab === 'documentos' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: modalTab === 'documentos' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s'
                }}
              >
                <FileCheck size={16} />
                <span>Documentos Legales (Chile)</span>
              </button>
            </div>

            <form onSubmit={handleSaveVehicle}>
              {modalTab === 'general' ? (
                <>
                  {/* Marca */}
                  <div className="form-group">
                    <label className="form-label">Marca del Vehículo</label>
                    {marcas.length > 0 ? (
                      <select 
                        className="form-input form-select"
                        value={formMarca}
                        onChange={(e) => setFormMarca(e.target.value)}
                        required
                      >
                        <option value="">Seleccione una marca</option>
                        {marcas.map((m, i) => (
                          <option key={i} value={m}>{m}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Ej. Toyota, Chevrolet"
                        value={formMarca}
                        onChange={(e) => setFormMarca(e.target.value)}
                        required
                      />
                    )}
                  </div>

                  {/* Modelo */}
                  <div className="form-group">
                    <label className="form-label">Modelo</label>
                    {loadingModels ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cargando modelos...</span>
                      </div>
                    ) : modelos.length > 0 ? (
                      <select 
                        className="form-input form-select"
                        value={formModelo}
                        onChange={(e) => setFormModelo(e.target.value)}
                        required
                      >
                        <option value="">Seleccione un modelo</option>
                        {modelos.map((mo, i) => (
                          <option key={i} value={mo}>{mo}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Ej. Yaris, Spark"
                        value={formModelo}
                        onChange={(e) => setFormModelo(e.target.value)}
                        required
                        disabled={!formMarca}
                      />
                    )}
                  </div>

                  {/* Patente */}
                  <div className="form-group">
                    <label className="form-label">Patente</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. AB1234 o ABCD12"
                      value={formPatente}
                      onChange={(e) => setFormPatente(e.target.value.toUpperCase())}
                      required
                    />
                  </div>

                  <div className="form-grid-2">
                    {/* Año */}
                    <div className="form-group">
                      <label className="form-label">Año</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        value={formAnio}
                        onChange={(e) => setFormAnio(e.target.value)}
                        required
                      />
                    </div>

                    {/* Kilometraje */}
                    <div className="form-group">
                      <label className="form-label">Kilometraje Actual (km)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        min="0"
                        value={formKilometraje}
                        onChange={(e) => setFormKilometraje(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Conductor Asignado */}
                  {(isAdmin || isMecanico) && users.length > 0 && (
                    <div className="form-group">
                      <label className="form-label">Conductor / Responsable Asignado</label>
                      <select 
                        className="form-input form-select"
                        value={formOwnerId}
                        onChange={(e) => setFormOwnerId(Number(e.target.value))}
                        required
                      >
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            👤 {u.fullName || u.username} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Estado Operativo: Encendido / Apagado */}
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Power size={15} color={formActivo ? 'var(--color-success)' : 'var(--color-danger)'} />
                      Estado Operativo del Vehículo
                    </label>
                    <select
                      className="form-input form-select"
                      value={formActivo ? 'ACTIVO' : 'INACTIVO'}
                      onChange={(e) => setFormActivo(e.target.value === 'ACTIVO')}
                    >
                      <option value="ACTIVO">🟢 Encendido / Operativo (Habilitado para servicio y jornadas)</option>
                      <option value="INACTIVO">🔴 Apagado / Fuera de Servicio (Bloqueado por administración)</option>
                    </select>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                      Si el móvil está apagado, los conductores no podrán iniciar jornada con él ni realizar despachos.
                    </span>
                  </div>
                </>
              ) : (
                /* TAB 2: DOCUMENTOS LEGALES (CHILE) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Banner Informativo OCR */}
                  <div style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(59, 130, 246, 0.08))', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Sparkles size={22} color="#38bdf8" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                      <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '2px' }}>
                        ⚡ OCR y Autocompletado Inteligente Activo
                      </strong>
                      Al subir o reemplazar la fotografía de cualquiera de los 4 documentos, el sistema leerá automáticamente folios, números de motor/chasis, fechas y aseguradoras sin que debas escribirlos a mano.
                    </div>
                  </div>

                  {/* 1. PADRÓN DEL VEHÍCULO (REGISTRO CIVIL) */}
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileCheck size={18} color="var(--primary)" />
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>1. Certificado de Inscripción de Vehículos Motorizados (Padrón)</strong>
                      </div>
                      <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Registro Civil Chile (CIVM)</span>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">N° Folio Padrón</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Ej. RC-2018-984210"
                          value={formPadronFolio}
                          onChange={(e) => setFormPadronFolio(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Fecha de Emisión Padrón</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={formPadronFechaEmision}
                          onChange={(e) => setFormPadronFechaEmision(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">N° Chasis / VIN</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Ej. 935A12B34C56D7890"
                          value={formPadronVin}
                          onChange={(e) => setFormPadronVin(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">N° Motor</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Ej. 4A91-98765432"
                          value={formPadronMotor}
                          onChange={(e) => setFormPadronMotor(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '0.5rem' }}>
                      <label className="form-label">Copia del Padrón (PDF o Fotografía)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <UploadCloud size={15} />
                          <span>{ocrScanningDoc === 'PADRON' ? 'Leyendo PDF/OCR...' : (formPadronImagen ? 'Reemplazar Padrón' : 'Subir Padrón (PDF/Foto - Auto-OCR)')}</span>
                          <input type="file" accept="image/*,application/pdf,.pdf" onChange={handleDocImageUploadWithOCR('PADRON', setFormPadronImagen)} style={{ display: 'none' }} />
                        </label>

                        {formPadronImagen && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img 
                              src={formPadronImagen} 
                              alt="Vista previa Padrón" 
                              style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--primary)' }} 
                            />
                            <button 
                              type="button" 
                              onClick={() => setFormPadronImagen('')}
                              style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Eliminar documento
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. REVISIÓN TÉCNICA */}
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                      <FileCheck size={18} color="var(--primary)" />
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>2. Certificado de Revisión Técnica (PRT)</strong>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Fecha de Vencimiento PRT</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={formRevisionTecnicaVencimiento}
                          onChange={(e) => setFormRevisionTecnicaVencimiento(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">N° Certificado / Planta</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Ej. PRT-8841 San Dámaso"
                          value={formRevisionTecnicaNumero}
                          onChange={(e) => setFormRevisionTecnicaNumero(e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: '0.5rem' }}>
                      <label className="form-label">Copia del Certificado PRT (PDF o Fotografía)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <UploadCloud size={15} />
                          <span>{ocrScanningDoc === 'PRT' ? 'Leyendo PDF/OCR...' : (formRevisionTecnicaImagen ? 'Reemplazar Certificado' : 'Subir PRT (PDF/Foto - Auto-OCR)')}</span>
                          <input type="file" accept="image/*,application/pdf,.pdf" onChange={handleDocImageUploadWithOCR('PRT', setFormRevisionTecnicaImagen)} style={{ display: 'none' }} />
                        </label>

                        {formRevisionTecnicaImagen && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img 
                              src={formRevisionTecnicaImagen} 
                              alt="Vista previa PRT" 
                              style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--primary)' }} 
                            />
                            <button 
                              type="button" 
                              onClick={() => setFormRevisionTecnicaImagen('')}
                              style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Eliminar documento
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. SOAP */}
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                      <ShieldCheck size={18} color="var(--primary)" />
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>3. Seguro Obligatorio (SOAP)</strong>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Compañía Aseguradora</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Ej. BCI Seguros, Consorcio, Mapfre"
                          value={formSoapAseguradora}
                          onChange={(e) => setFormSoapAseguradora(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Fecha de Vencimiento SOAP</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={formSoapVencimiento}
                          onChange={(e) => setFormSoapVencimiento(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">N° de Póliza SOAP</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Ej. POL-9923847"
                        value={formSoapPoliza}
                        onChange={(e) => setFormSoapPoliza(e.target.value)}
                      />
                    </div>

                    <div style={{ marginTop: '0.5rem' }}>
                      <label className="form-label">Póliza SOAP Digital (PDF o Fotografía)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <UploadCloud size={15} />
                          <span>{ocrScanningDoc === 'SOAP' ? 'Leyendo PDF/OCR...' : (formSoapImagen ? 'Reemplazar Póliza' : 'Subir SOAP (PDF/Foto - Auto-OCR)')}</span>
                          <input type="file" accept="image/*,application/pdf,.pdf" onChange={handleDocImageUploadWithOCR('SOAP', setFormSoapImagen)} style={{ display: 'none' }} />
                        </label>

                        {formSoapImagen && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img 
                              src={formSoapImagen} 
                              alt="Vista previa SOAP" 
                              style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--primary)' }} 
                            />
                            <button 
                              type="button" 
                              onClick={() => setFormSoapImagen('')}
                              style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Eliminar documento
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. PERMISO DE CIRCULACIÓN */}
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                      <FileText size={18} color="var(--primary)" />
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>4. Permiso de Circulación</strong>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="form-label">Municipalidad Emisora</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="Ej. Providencia, Las Condes"
                          value={formPermisoCirculacionMunicipalidad}
                          onChange={(e) => setFormPermisoCirculacionMunicipalidad(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Fecha de Vencimiento</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={formPermisoCirculacionVencimiento}
                          onChange={(e) => setFormPermisoCirculacionVencimiento(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">N° Folio / Comprobante de Pago</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Ej. FOL-2026-88123"
                        value={formPermisoCirculacionFolio}
                        onChange={(e) => setFormPermisoCirculacionFolio(e.target.value)}
                      />
                    </div>

                    <div style={{ marginTop: '0.5rem' }}>
                      <label className="form-label">Permiso de Circulación (PDF o Fotografía)</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <UploadCloud size={15} />
                          <span>{ocrScanningDoc === 'PERMISO' ? 'Leyendo PDF/OCR...' : (formPermisoCirculacionImagen ? 'Reemplazar Permiso' : 'Subir Permiso (PDF/Foto - Auto-OCR)')}</span>
                          <input type="file" accept="image/*,application/pdf,.pdf" onChange={handleDocImageUploadWithOCR('PERMISO', setFormPermisoCirculacionImagen)} style={{ display: 'none' }} />
                        </label>

                        {formPermisoCirculacionImagen && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img 
                              src={formPermisoCirculacionImagen} 
                              alt="Vista previa Permiso" 
                              style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--primary)' }} 
                            />
                            <button 
                              type="button" 
                              onClick={() => setFormPermisoCirculacionImagen('')}
                              style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              Eliminar documento
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Action buttons */}
              <div 
                className="modal-actions" 
                style={{ 
                  marginTop: '1.5rem', 
                  borderTop: '1px solid var(--border-color)', 
                  paddingTop: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                {modalType === 'edit' && isAdmin ? (
                  <button 
                    type="button" 
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      setShowModal(false);
                      handleDeleteVehicle(editingVehicleId);
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.4rem', 
                      fontSize: '0.8rem', 
                      padding: '0.45rem 0.75rem',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                      color: '#f87171'
                    }}
                    title="Eliminar este vehículo de la base de datos de forma permanente"
                  >
                    <Trash2 size={14} />
                    <span>Eliminar vehículo permanentemente</span>
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {modalType === 'create' ? 'Registrar Vehículo' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT LIGHTBOX MODAL */}
      {selectedDoc && (
        <DocumentModal 
          documento={selectedDoc} 
          onClose={() => setSelectedDoc(null)} 
        />
      )}

      {/* QR MODAL / CREDENCIAL IMPRIMIBLE */}
      {showQrModal && qrVehicle && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Credencial QR del Vehículo</h3>
              </div>
              <button 
                onClick={() => setShowQrModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tarjeta de Credencial Estilizada (Vista previa de lo que se imprime) */}
            <div 
              style={{ 
                backgroundColor: '#ffffff', 
                color: '#111827',
                borderRadius: '16px',
                padding: '1.5rem 1rem',
                border: '2px dashed #cbd5e1',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>
                🚗 VehículosPro Fleet
              </div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: '0.75rem' }}>
                Identificación y Acceso Operativo de Flota
              </div>

              {/* Patente estilo placa chilena */}
              <div 
                style={{ 
                  display: 'inline-block',
                  border: '2.5px solid #1e293b',
                  borderRadius: '6px',
                  padding: '4px 14px',
                  fontSize: '1.35rem',
                  fontWeight: 900,
                  letterSpacing: '2px',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  marginBottom: '6px'
                }}
              >
                {qrVehicle.patente || 'SIN PATENTE'}
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.85rem' }}>
                {qrVehicle.marca} {qrVehicle.modelo} ({qrVehicle.anio})
              </div>

              {/* Imagen del Código QR */}
              <div 
                style={{ 
                  display: 'inline-block',
                  padding: '0.5rem', 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  marginBottom: '0.75rem'
                }}
              >
                <img 
                  src={qrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=4&data=${encodeURIComponent(qrVehicle.qrCode || `VEHICULO:${qrVehicle.id}`)}`} 
                  alt="Código QR del vehículo" 
                  style={{ width: '170px', height: '170px', display: 'block', margin: '0 auto' }}
                />
              </div>

              <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', backgroundColor: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '0.75rem' }}>
                {qrVehicle.qrCode || `VEHICULO:${qrVehicle.id}`}
              </div>

              <div style={{ fontSize: '0.68rem', color: '#64748b', lineHeight: 1.35, borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
                Escanee este código con la app para iniciar/cerrar turnos, consultar Padrón (CIVM), PRT, SOAP o registrar mantención.
              </div>
            </div>

            {/* Botones de Acción: Imprimir, Descargar y Cerrar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <button 
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePrintQr}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontWeight: 700, padding: '0.65rem' }}
                >
                  <Printer size={16} />
                  <span>Imprimir Ficha</span>
                </button>

                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleDownloadQr}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem' }}
                >
                  <Download size={16} />
                  <span>Descargar PNG</span>
                </button>
              </div>

              <button 
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowQrModal(false)}
                style={{ width: '100%', color: 'var(--text-muted)' }}
              >
                Cerrar
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
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Vehiculos;
