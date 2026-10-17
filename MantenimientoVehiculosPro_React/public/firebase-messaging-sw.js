importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCCQmdUqWcMFdzRROA0XGzf_wf_RfZSAQc",
  authDomain: "vito-sis-control.firebaseapp.com",
  projectId: "vito-sis-control",
  storageBucket: "vito-sis-control.firebasestorage.app",
  messagingSenderId: "64069146165"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);
  const notificationTitle = payload.notification.title || "Alerta de VehículosPro";
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
