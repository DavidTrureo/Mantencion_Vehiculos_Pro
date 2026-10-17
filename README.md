# Mantención Vehículos Pro 🚗💨
> **Plataforma Empresarial y Móvil para la Gestión Integral de Flotas, Mantenimientos y Turnos de Conducción**

![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208-blue?logo=react)
![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203.5%20%28Java%2017%29-green?logo=springboot)
![Google Cloud Run](https://img.shields.io/badge/Cloud-Google%20Cloud%20Run-blue?logo=googlecloud)
![Neon PostgreSQL](https://img.shields.io/badge/Database-Neon%20Serverless%20Postgres-00E599?logo=postgresql)
![Firebase](https://img.shields.io/badge/Storage%20%26%20Hosting-Firebase-orange?logo=firebase)
![Capacitor](https://img.shields.io/badge/Mobile-Capacitor%208%20%28Android%29-119EFF?logo=capacitor)

---

## 🌟 Visión del Proyecto

**Mantención Vehículos Pro** es una solución tecnológica completa diseñada para la administración, supervisión y control operativo de flotas vehiculares y conductores. Permite digitalizar el ciclo de vida completo de cada automóvil: desde el escaneo QR físico en terreno y la apertura de turnos de jornada por parte de los conductores, hasta el reporte de incidentes fotográficos, registro de mantenciones preventivas/correctivas y diagnósticos predictivos asistidos por Inteligencia Artificial.

Toda la infraestructura opera de forma **100% nativa en la nube**, permitiendo que tanto la versión Web de escritorio como la App móvil Android funcionen en tiempo real de manera sincronizada sin depender de servidores locales.

---

## 🏗️ Arquitectura de la Solución

```text
               ┌────────────────────────────────────────────────────────┐
               │                    CLIENTES FINALES                    │
               │  [ Web SPA (Firebase Hosting) ]  [ App Android (APK) ] │
               └──────────────────────────┬─────────────────────────────┘
                                          │ HTTPS / REST API / JWT
                                          ▼
               ┌────────────────────────────────────────────────────────┐
               │             BACKEND EN GOOGLE CLOUD RUN                │
               │   Spring Boot 3.5 (Java 17) en Contenedor Docker       │
               │   • Rate Limiting Filter (Protección Anti-DDoS)        │
               │   • Spring Security + Stateless JWT                    │
               │   • CORS Global & Headers de Seguridad Estrictos       │
               └──────────────┬──────────────────────────┬──────────────┘
                              │                          │
                 Credenciales │                          │ Pooler JDBC SSL
               Secret Manager ▼                          ▼ (prepareThreshold=0)
          ┌───────────────────────┐            ┌────────────────────────┐
          │   FIREBASE STORAGE    │            │    NEON POSTGRESQL     │
          │ Documentos, SOAP, RT  │            │  Base de Datos Serverless│
          │ y Fotos de Incidentes │            │  en Nube AWS (us-east-2) │
          └───────────────────────┘            └────────────────────────┘
```

---

## 🚀 Pila Tecnológica (Stack Definitivo)

### 💻 Frontend Web & Móvil (Multiplataforma)
* **Framework:** [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/) (Compilación ultrarrápida).
* **Entorno Nativo Móvil:** [Capacitor 8](https://capacitorjs.com/) para empaquetado nativo en Android (APK Release).
* **Escaneo QR en Terreno:** Integración con `@capacitor/camera` y librerías de visión artificial `html5-qrcode` y `jsQR` para reconocimiento instantáneo de patentes y vehículos.
* **Mapas y Geolocalización:** [Leaflet](https://leafletjs.com/) y OpenStreetMap para cálculo de rutas y localización de talleres mecánicos.
* **Diseño y Estilo:** CSS moderno con paletas oscuras premium, efectos Glassmorphism, micro-animaciones e interfaz 100% responsive para teléfonos y pantallas panorámicas.

### ⚙️ Backend API REST
* **Framework:** [Spring Boot 3.5.6](https://spring.io/projects/spring-boot) sobre **Java 17 LTS**.
* **Seguridad y Cifrado:**
  * **JWT (JSON Web Tokens):** Sesiones sin estado (Stateless) con expiración configurable.
  * **BCrypt Password Encoder:** Encriptación criptográfica unidireccional de contraseñas.
  * **Rate Limiting Filter:** Bloqueo automático por IP ante intentos excesivos de acceso o ataques de fuerza bruta (HTTP 429 Too Many Requests).
  * **Headers de Protección:** HSTS (HTTP Strict Transport Security), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
* **Persistencia y ORM:** Spring Data JPA con Hibernate optimizado para PostgreSQL.

### ☁️ Servicios Cloud e Infraestructura
* **Servidor de Aplicaciones:** **Google Cloud Run** (`us-east4`), con autoescalado elástico a cero instancias para optimizar recursos ($0 costo en reposo).
* **Base de Datos Relacional:** **Neon Serverless PostgreSQL** con PgBouncer Connection Pooler y conexión segura TLS/SSL obligatoria.
* **Almacenamiento de Archivos:** **Firebase Cloud Storage** (`mantenimiento-vehiculos-pro.firebasestorage.app`) con reglas de acceso que permiten escritura únicamente a través de la API autenticada.
* **Gestión de Secretos:** **Google Cloud Secret Manager** para inyectar llaves maestras en tiempo de ejecución sin exponerlas en el código fuente.
* **CDN y Hosting Web:** **Firebase Hosting** con certificados SSL automáticos y distribución global.

---

## 📱 Funcionalidades del Sistema

1. **Gestión de Flota Vehicular:**
   * Registro completo de vehículos (Patente, Marca, Modelo, Año, Odómetro actual, Tipo de Combustible, Transmisión).
   * Generación y descarga automática de **códigos QR únicos** por vehículo para impresión y fijación en el parabrisas.
   * Gestión de documentos reglamentarios (SOAP, Revisión Técnica) con visor y almacenamiento en Firebase Storage.

2. **Control de Turnos de Jornada (Conductores):**
   * Inicio de turno mediante escaneo del código QR del vehículo.
   * Registro de odómetro de salida y odómetro de llegada con validación de kilometraje positivo.
   * Prevención de asignaciones duplicadas (un vehículo no puede ser tomado si ya tiene un turno abierto por otro conductor).
   * Registro de combustible cargado, estado de limpieza y cierre administrativo por supervisores.

3. **Reporte y Seguimiento de Incidentes:**
   * Notificación inmediata de fallas mecánicas, accidentes o alertas de tablero.
   * Adjunto de fotografías de evidencia desde la cámara del teléfono.
   * Flujo de resolución de incidentes con registro de técnico responsable y fecha de solución.

4. **Gestión de Mantenimientos:**
   * Programación y registro de mantenciones preventivas y correctivas.
   * Alertas automáticas de mantenciones vencidas o próximas según kilometraje y fechas.
   * Cálculo de costos acumulados por vehículo y por período.

5. **Copiloto IA (Diagnóstico Predictivo):**
   * Asistente inteligente integrado con Google Gemini para análisis de síntomas mecánicos, recomendaciones de mantenimiento y optimización de consumo de combustible.

6. **Administración de Usuarios y Roles:**
   * Control de acceso basado en roles: `ADMIN`, `MECANICO` y `CONDUCTOR`.
   * Habilitación / deshabilitación de usuarios con auditoría de acciones.

---

## 📂 Estructura del Repositorio

```text
Mantencion_Vehiculos_Pro/
│
├── MantenimientoVehiculosPro_React/    # Frontend Web SPA y Proyecto Móvil Capacitor
│   ├── android/                        # Proyecto nativo Android Studio (Gradle, Manifest)
│   ├── src/
│   │   ├── components/                 # Componentes UI reutilizables (Modales, Navbar, Toast)
│   │   ├── context/                    # Contextos globales de React (AuthContext)
│   │   ├── services/                   # Clientes de API REST, Firebase y servicios de mapas
│   │   └── views/                      # Vistas (Dashboard, Vehículos, Turnos, Mantenimientos, QR)
│   ├── firebase.json                   # Reglas de Firebase Hosting y Proxy
│   └── package.json                    # Dependencias y scripts de Node.js
│
├── vehiculospro-api/                   # Backend API REST Spring Boot
│   ├── src/main/java/com/mantenimiento/vehiculospro_api/
│   │   ├── config/                     # Seguridad, JWT, CORS, RateLimiting y Firebase
│   │   ├── controller/                 # Controladores REST (/vehiculos, /api/auth, /api/turnos...)
│   │   ├── dto/                        # Data Transfer Objects para validación de entradas
│   │   ├── exception/                  # Manejo global centralizado de excepciones (HTTP 4xx / 5xx)
│   │   ├── mapper/                     # Mapeadores DTO <-> Entidad
│   │   ├── model/                      # Entidades JPA (Vehículo, Usuario, Mantenimiento, Incidente...)
│   │   ├── repository/                 # Repositorios Spring Data JPA
│   │   └── service/                    # Lógica de negocio transaccional
│   ├── Dockerfile                      # Empaquetado multi-etapa optimizado para Cloud Run
│   └── pom.xml                         # Dependencias Maven y configuración del proyecto
│
├── render.yaml                         # Descriptor Blueprint para despliegue alternativo
└── README.md                           # Documentación principal del proyecto
```

---

## 🛠️ Guía de Ejecución Local

### Prerrequisitos
* **Java:** JDK 17 o superior.
* **Node.js:** Versión 18 o superior con `npm`.
* **Android SDK:** (Opcional, solo si se desea compilar el APK localmente).

---

### 1. Iniciar el Backend (Spring Boot)

```bash
cd vehiculospro-api

# Compilar y ejecutar la aplicación
./mvnw spring-boot:run
```
El backend iniciará en `http://localhost:8080`.
Endpoint de verificación: `http://localhost:8080/api/auth/health`.

---

### 2. Iniciar el Frontend Web (React + Vite)

```bash
cd MantenimientoVehiculosPro_React

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo con Hot Reload
npm run dev
```
La aplicación abrirá en `http://localhost:5173`.

---

### 3. Compilar la App Móvil Android (APK)

```bash
cd MantenimientoVehiculosPro_React

# Sincronizar los cambios de React hacia el proyecto Android nativo
npm run build
npx cap sync android

# Compilar APK de lanzamiento (Release)
cd android
./gradlew assembleRelease
```
El archivo ejecutable generado se ubica en:
`android/app/build/outputs/apk/release/app-release.apk`

---

## ☁️ Despliegue a Producción

### Despliegue del Backend en Google Cloud Run

```bash
cd vehiculospro-api

gcloud run deploy vehiculospro-api \
  --source . \
  --project=mantenimiento-vehiculos-pro \
  --region=us-east4 \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --port=8080 \
  --env-vars-file=env.yaml \
  --set-secrets=/etc/secrets/serviceAccountKey.json=firebase-credentials:latest
```

### Despliegue del Frontend en Firebase Hosting

```bash
cd MantenimientoVehiculosPro_React

npm run build
npx firebase-tools deploy --only hosting --project mantenimiento-vehiculos-pro
```

---

## 📋 Catálogo de Endpoints de la API REST

| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/auth/health` | Verificación de salud y estado de la API | Público |
| `POST` | `/api/auth/login` | Inicio de sesión con usuario y contraseña (retorna JWT) | Público (Rate Limited) |
| `POST` | `/api/auth/check-username` | Validación de existencia previa de nombre de usuario/correo | Público |
| `GET` | `/vehiculos` o `/api/vehiculos` | Listar toda la flota de vehículos corporativos | Autenticado |
| `POST` | `/vehiculos` | Registrar un nuevo automóvil en la flota | Autenticado |
| `GET` | `/vehiculos/{id}` | Obtener detalle y ficha técnica de un vehículo | Autenticado |
| `PUT` | `/vehiculos/{id}` | Actualizar información, odómetro o documentación del vehículo | Autenticado |
| `DELETE` | `/vehiculos/{id}` | Eliminar lógicamente un vehículo de la flota | Autenticado |
| `GET` | `/mantenimientos` | Historial de mantenciones preventivas y correctivas | Autenticado |
| `POST` | `/mantenimientos` | Registrar nueva mantención efectuada o programada | Autenticado |
| `POST` | `/api/turnos/iniciar` | Iniciar turno de conducción con escaneo QR y odómetro inicial | Autenticado |
| `POST` | `/api/turnos/{id}/finalizar`| Cierre de turno con odómetro final y registro de incidencias | Autenticado |
| `GET` | `/api/turnos/activo/vehiculo/{id}` | Consultar si un vehículo se encuentra en ruta actualmente | Autenticado |
| `GET` | `/api/incidentes` | Listar incidentes mecánicos reportados por conductores | Autenticado |
| `POST` | `/api/incidentes` | Registrar nuevo incidente con fotografía de respaldo | Autenticado |
| `PUT` | `/api/incidentes/{id}/resolver` | Marcar incidente mecánico como reparado | Autenticado |
| `POST` | `/api/files/upload` | Subida segura de documentos e imágenes a Firebase Storage | Autenticado |
| `GET` | `/api/usuarios` | Listado de conductores, mecánicos y administradores | Admin |
| `POST` | `/api/usuarios` | Crear nuevo usuario con rol asignado | Admin |

---

## 🔒 Buenas Prácticas de Seguridad Implementadas

1. **Cero Credenciales en Código:** Ni contraseñas de base de datos ni llaves de servicio de Firebase están almacenadas en el control de versiones. Todas se inyectan en tiempo de ejecución mediante **Google Cloud Secret Manager** y variables de entorno.
2. **Defensa contra Ataques de Fuerza Bruta:** Filtro activo de límite de tasa (*Rate Limiting*) que restringe intentos abusivos por dirección IP.
3. **Canales Cifrados de Extremo a Extremo:** Toda la comunicación entre Clientes, Cloud Run y Neon PostgreSQL viaja bajo TLS 1.3 / SSL forzado.
4. **Almacenamiento Aislado:** Reglas de Firebase Storage configuradas con lectura pública solo para URLs firmadas y escritura restringida exclusivamente a la cuenta de servicio de backend.

---

## 👨‍💻 Autor y Licencia

* **Desarrollador:** David Trureo Ahumada ([@DavidTrureo](https://github.com/DavidTrureo))
* **Proyecto:** Mantención Vehículos Pro
* **Licencia:** Proyecto Privado para uso corporativo y gestión vehicular.
