package com.mantenimientovehiculospro.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

// === Definición del esquema de colores para el tema claro ===
// Aquí asigno los colores definidos en Color.kt a las propiedades de MaterialTheme.
private val LightColorScheme = lightColorScheme(
    primary = PrimaryLight,
    secondary = SecondaryLight,
    tertiary = TertiaryLight,
    background = BackgroundLight,
    surface = SurfaceLight,
    onPrimary = OnPrimaryLight,
    onSecondary = OnSecondaryLight,
    onBackground = OnBackgroundLight,
    onSurface = OnSurfaceLight,
    error = ErrorLight,
    onError = OnErrorLight
)

// === Definición del esquema de colores para el tema oscuro ===
// Igual que arriba, pero usando la paleta de colores oscuros.
private val DarkColorScheme = darkColorScheme(
    primary = PrimaryDark,
    secondary = SecondaryDark,
    tertiary = TertiaryDark,
    background = BackgroundDark,
    surface = SurfaceDark,
    onPrimary = OnPrimaryDark,
    onSecondary = OnSecondaryDark,
    onBackground = OnBackgroundDark,
    onSurface = OnSurfaceDark,
    error = ErrorDark,
    onError = OnErrorDark
)

// === Función principal del tema de la app ===
// Esta función envuelve toda la interfaz en un MaterialTheme personalizado.
// Decide automáticamente si usar tema claro u oscuro, y opcionalmente colores dinámicos en Android 12+.
@Composable
fun MantenimientoVehiculosProTheme(
    darkTheme: Boolean = isSystemInDarkTheme(), // Detecta si el sistema está en modo oscuro
    dynamicColor: Boolean = false,              // Si está en true y el dispositivo es Android 12+, usa Material You
    content: @Composable () -> Unit             // Contenido de la app que hereda este tema
) {
    // Selección del esquema de colores según las condiciones
    val colorScheme = when {
        // Si está activado dynamicColor y el dispositivo soporta Android 12+, uso colores dinámicos
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        // Si el sistema está en modo oscuro, uso el esquema oscuro
        darkTheme -> DarkColorScheme
        // Caso contrario, uso el esquema claro
        else -> LightColorScheme
    }

    // Aplico el tema a toda la app
    MaterialTheme(
        colorScheme = colorScheme, // Colores definidos
        typography = Typography,   // Tipografía definida en Typography.kt
        content = content          // Contenido de la UI que hereda este tema
    )
}