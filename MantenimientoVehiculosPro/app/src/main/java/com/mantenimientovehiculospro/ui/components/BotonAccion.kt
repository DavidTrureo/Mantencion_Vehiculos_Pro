package com.mantenimientovehiculospro.ui.components

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color

// Este componente reutilizable representa un botón personalizado.
// Lo uso en varias pantallas para mantener consistencia visual y evitar repetir código.
@Composable
fun BotonAccion(
    texto: String,             // Texto que se muestra dentro del botón
    colorFondo: Color,         // Color de fondo del botón
    colorTexto: Color = Color.White, // Color del texto (por defecto blanco)
    modifier: Modifier = Modifier,   // Modifier para ajustar tamaño, padding, etc.
    onClick: () -> Unit        // Acción que se ejecuta al hacer clic
) {
    // Uso el componente Button de Material 3 con colores personalizados
    Button(
        onClick = onClick,
        modifier = modifier,
        colors = ButtonDefaults.buttonColors(
            containerColor = colorFondo,  // Color de fondo
            contentColor = colorTexto     // Color del texto
        )
    ) {
        // Muestro el texto dentro del botón
        Text(texto)
    }
}