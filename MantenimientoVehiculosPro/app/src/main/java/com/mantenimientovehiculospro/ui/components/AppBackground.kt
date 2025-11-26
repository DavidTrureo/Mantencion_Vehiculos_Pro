package com.mantenimientovehiculospro.ui.components

import androidx.annotation.DrawableRes
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource

/**
 * Un componente reutilizable que muestra una imagen de fondo con una capa oscura
 * semi-transparente para mejorar la legibilidad del contenido que va por encima.
 *
 * @param backgroundImageResId El ID del recurso drawable para la imagen de fondo.
 * @param content El contenido que se mostrará sobre el fondo.
 */
@Composable
fun AppBackground(
    @DrawableRes backgroundImageResId: Int,
    content: @Composable () -> Unit
) {
    Box(modifier = Modifier.fillMaxSize()) {
        // 1. La imagen de fondo, que se expande para cubrir todo el espacio sin deformarse.
        Image(
            painter = painterResource(id = backgroundImageResId),
            contentDescription = "Imagen de fondo",
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize()
        )

        // 2. Una capa (scrim) que usa el color de fondo del tema con una transparencia.
        // Esto es CRUCIAL para asegurar que el texto y los botones sean legibles.
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background.copy(alpha = 0.90f)
        ) {
            // 3. El contenido real de la pantalla se coloca aquí, encima de todo.
            content()
        }
    }
}