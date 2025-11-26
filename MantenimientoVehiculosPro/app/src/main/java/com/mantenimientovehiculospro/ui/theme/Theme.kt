package com.mantenimientovehiculospro.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

// Paleta de colores para el tema oscuro (el principal de la app)
private val DarkColorScheme = darkColorScheme(
    primary = AmberAccent,           // El color principal para acciones y botones será el ámbar.
    onPrimary = DarkGray,            // El texto sobre los botones ámbar será oscuro para mejor contraste.
    secondary = PacificBlue,         // Color para elementos secundarios.
    onSecondary = TextWhite,         // Texto sobre elementos secundarios.
    background = NavyBlue,           // Fondo principal de la app.
    onBackground = TextWhite,        // Color del texto principal sobre el fondo.
    surface = SlateGray,             // Color para las tarjetas (cards) y otras superficies.
    onSurface = TextWhite,           // Color del texto sobre las tarjetas.
    error = ErrorRed,
    onError = TextWhite
)

// Paleta de colores para el tema claro (alternativa)
private val LightColorScheme = lightColorScheme(
    primary = DeepBlue,              // El color principal para acciones será el azul profundo.
    onPrimary = White,               // Texto blanco sobre los botones azules.
    secondary = MediumGray,          // Color para elementos secundarios.
    onSecondary = DarkGray,          // Texto oscuro sobre elementos secundarios.
    background = OffWhite,           // Fondo principal de la app (blanco roto).
    onBackground = DarkGray,         // Texto principal oscuro.
    surface = White,                 // Las tarjetas serán de color blanco puro.
    onSurface = DarkGray,            // Texto oscuro sobre las tarjetas.
    error = ErrorRed,
    onError = White
)

@Composable
fun MantenimientoVehiculosProTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false, // Desactivamos Material You para mantener nuestra identidad de marca.
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}