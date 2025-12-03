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

// Este es un Composable que armé para no repetir código.
// Lo uso en todas las pantallas para poner la misma imagen de fondo
// con un efecto oscuro que hace que el texto se lea bien.
@Composable
fun AppBackground(
    // Aquí le paso el ID de la imagen que quiero de fondo (ej: R.drawable.auto4).
    @DrawableRes backgroundImageResId: Int,
    // Y aquí le paso todo el contenido de la pantalla (el Scaffold, los botones, etc.).
    content: @Composable () -> Unit
) {
    // Uso un Box para poder poner cosas una encima de la otra, como capas.
    Box(modifier = Modifier.fillMaxSize()) {

        // Capa 1 (la de más abajo): La imagen de fondo.
        Image(
            painter = painterResource(id = backgroundImageResId),
            contentDescription = "Imagen de fondo de la app",
            // ContentScale.Crop hace que la imagen ocupe todo el espacio sin deformarse,
            // aunque se recorte un poco por los lados.
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize()
        )

        // Capa 2 (en el medio): Un velo oscuro semitransparente.
        // Esto es clave para que las letras blancas se puedan leer encima de la foto.
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background.copy(alpha = 0.75f))
        )

        // Capa 3 (la de más arriba): El contenido de la pantalla que le pasé.
        content()
    }
}
