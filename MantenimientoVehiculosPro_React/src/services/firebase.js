import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { api } from "./api";

const firebaseConfig = {
  apiKey: "AIzaSyCCQmdUqWcMFdzRROA0XGzf_wf_RfZSAQc",
  authDomain: "vito-sis-control.firebaseapp.com",
  projectId: "vito-sis-control",
  storageBucket: "vito-sis-control.firebasestorage.app",
  messagingSenderId: "64069146165"
};

const app = initializeApp(firebaseConfig);
let messaging = null;

try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn("FCM messaging is not supported in this browser environment:", e.message);
}

export const requestNotificationPermission = async (userId, userRole) => {
  if (!messaging) return;
  
  // Solamente los administradores y mecánicos necesitan recibir alertas de mantenciones
  if (userRole !== 'ADMIN' && userRole !== 'MECANICO') {
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Nota: Si configuraste un certificado web push en tu consola de Firebase,
      // pon tu clave VAPID pública aquí. De lo contrario, Firebase lo intentará por defecto.
      const token = await getToken(messaging).catch(err => {
        console.warn("FCM Web Push requiere una clave VAPID para obtener token en la web. Genera una en Configuración del Proyecto -> Cloud Messaging de Firebase.");
        return null;
      });
      
      if (token) {
        await api.actualizarFcmToken(userId, token);
        console.log("FCM Web Token registrado correctamente en el servidor:", token);
      }
    }
  } catch (e) {
    console.error("Error al configurar notificaciones push en la web:", e);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
