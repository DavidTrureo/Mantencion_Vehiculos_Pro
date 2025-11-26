package com.mantenimientovehiculospro.ui.components

import androidx.annotation.DrawableRes
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
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
        // 1. La imagen de fondo, que se expande para cubrir todo el espacio.
        Image(
            painter = painterResource(id = backgroundImageResId),
            contentDescription = "Imagen de fondo",
            contentScale = ContentScale.Crop, // Crop para evitar deformaciones
            modifier = Modifier.fillMaxSize()
        )

        // 2. La capa oscura (scrim) que va encima de la imagen para oscurecerla.
        // Esto es CRUCIAL para la legibilidad del texto.
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background.copy(alpha = 0.75f))
        )

        // 3. El contenido real de la pantalla, que se coloca encima de todo.
        content()
    }
}