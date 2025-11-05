package com.mantenimientovehiculospro.ui.theme

import androidx.compose.ui.graphics.Color

// === Light Theme Colors ===
// Colores principales para el tema claro de la aplicación.
// Estos se aplican cuando el usuario tiene activado el modo claro.
val PrimaryLight = Color(0xFF1976D2)       // Azul principal (botones, barras, elementos destacados)
val SecondaryLight = Color(0xFF0288D1)     // Azul secundario (acciones secundarias, acentos)
val TertiaryLight = Color(0xFF4CAF50)      // Verde para elementos de apoyo o confirmación
val BackgroundLight = Color(0xFFFFFFFF)    // Fondo principal blanco
val SurfaceLight = Color(0xFFF5F5F5)       // Superficies (tarjetas, contenedores)
val OnPrimaryLight = Color(0xFFFFFFFF)     // Texto sobre Primary (blanco para contraste)
val OnSecondaryLight = Color(0xFFFFFFFF)   // Texto sobre Secondary
val OnBackgroundLight = Color(0xFF000000)  // Texto sobre fondo claro (negro)
val OnSurfaceLight = Color(0xFF000000)     // Texto sobre superficies claras
val ErrorLight = Color(0xFFD32F2F)         // Rojo para errores
val OnErrorLight = Color(0xFFFFFFFF)       // Texto sobre fondo de error

// === Dark Theme Colors ===
// Colores principales para el tema oscuro de la aplicación.
// Estos se aplican cuando el usuario activa el modo oscuro.
val PrimaryDark = Color(0xFF90CAF9)        // Azul claro para destacar en fondo oscuro
val SecondaryDark = Color(0xFF81D4FA)      // Azul secundario más suave
val TertiaryDark = Color(0xFFA5D6A7)       // Verde claro para confirmaciones
val BackgroundDark = Color(0xFF121212)     // Fondo principal oscuro
val SurfaceDark = Color(0xFF1E1E1E)        // Superficies oscuras (tarjetas, contenedores)
val OnPrimaryDark = Color(0xFF000000)      // Texto sobre Primary (negro para contraste)
val OnSecondaryDark = Color(0xFF000000)    // Texto sobre Secondary
val OnBackgroundDark = Color(0xFFFFFFFF)   // Texto sobre fondo oscuro (blanco)
val OnSurfaceDark = Color(0xFFFFFFFF)      // Texto sobre superficies oscuras
val ErrorDark = Color(0xFFEF5350)          // Rojo más claro para errores en modo oscuro
val OnErrorDark = Color(0xFF000000)        // Texto sobre fondo de error

// === Semantic Colors (usable across themes) ===
// Colores semánticos que puedo usar en cualquier tema (claro u oscuro).
// Sirven para dar significado visual a estados comunes.
val ErrorRed = Color(0xFFD32F2F)           // Rojo para errores
val SuccessGreen = Color(0xFF4CAF50)       // Verde para éxito o confirmación
val WarningYellow = Color(0xFFFFA000)      // Amarillo para advertencias
val InfoBlue = Color(0xFF0288D1)           // Azul para información
val NeutralGray = Color(0xFF9E9E9E)        // Gris neutro para elementos secundarios