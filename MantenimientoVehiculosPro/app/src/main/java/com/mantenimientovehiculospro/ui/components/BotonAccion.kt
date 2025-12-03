package com.mantenimientovehiculospro.ui.components

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color

// Este es un Composable que creé para tener un botón personalizado.
// En lugar de configurar un botón desde cero cada vez, uso este y así
// todos los botones de la app se ven parecidos y me ahorro escribir código.
@Composable
fun BotonAccion(
    // El texto que va a aparecer dentro del botón, por ejemplo "Guardar" o "Cancelar".
    texto: String,
    // El color de fondo que quiero que tenga el botón.
    colorFondo: Color,
    // El color del texto. Por defecto es blanco, pero puedo cambiarlo si quiero.
    colorTexto: Color = Color.White,
    // El 'modifier' es para poder pasarle ajustes desde afuera, como el ancho (fillMaxWidth).
    modifier: Modifier = Modifier,
    // La acción que se ejecuta cuando alguien presiona el botón.
    onClick: () -> Unit
) {
    // Uso el botón estándar de Material 3, pero le cambio los colores.
    Button(
        onClick = onClick,
        modifier = modifier,
        colors = ButtonDefaults.buttonColors(
            // Aquí le aplico los colores que le pasé a la función.
            containerColor = colorFondo,
            contentColor = colorTexto
        )
    ) {
        // Pongo el texto que me pasaron dentro del botón.
        Text(texto)
    }
}
