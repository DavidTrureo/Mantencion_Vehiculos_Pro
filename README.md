# Mantención Vehículos Pro 🚗

Aplicación móvil para registrar y gestionar mantenciones de vehículos personales. Incluye historial por tipo, agrupación inteligente, y conexión con backend para persistencia de datos.

## 📱 Tecnologías utilizadas

- **Frontend móvil:** Kotlin + Jetpack Compose
- **Backend:** Spring Boot + MySQL
- **API REST:** Retrofit + DTOs

## 🚀 Cómo ejecutar el proyecto

### Requisitos

- Android Studio Flamingo o superior
- JDK 17+
- Gradle 8+
- Emulador Android o dispositivo físico

### Frontend (App móvil)

cd MantenimientoVehiculosPro
./gradlew assembleDebug

### Backend (API REST)

cd vehiculospro-api
./mvnw spring-boot:run


🧪 Funcionalidades principales

•  Registro de vehículos
•  Registro y edición de mantenciones
•  Agrupación por tipo con contador
•  Historial expandible por tipo
•  Eliminación segura con confirmación


📦 Estructura del proyecto
Mantencion_Vehiculos_Pro/
├── MantenimientoVehiculosPro/   # App Android
├── vehiculospro-api/           # Backend Spring Boot
└── README.md
