package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mantenimientovehiculospro.R
import com.mantenimientovehiculospro.ui.components.AppBackground

// Esta es la pantalla de inicio, la primera que se ve al abrir la app.
// Desde aquí el usuario puede elegir si quiere iniciar sesión o registrarse.
@Composable
fun InicioScreen(
    // La función que se va a ejecutar cuando el usuario presione "INICIAR SESIÓN".
    onLoginClick: () -> Unit,
    // La función que se va a ejecutar cuando el usuario presione "REGISTRARSE".
    onRegisterClick: () -> Unit
) {
    // Uso mi componente de fondo personalizado, pasándole la imagen que quiero.
    AppBackground(backgroundImageResId = R.drawable.auto1) {

        // Uso un Box para poder centrar todo el contenido en medio de la pantalla.
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            // Una columna para apilar los elementos uno debajo del otro.
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(24.dp),
                modifier = Modifier.padding(horizontal = 24.dp)
            ) {
                // El ícono principal de la aplicación.
                Icon(
                    imageVector = Icons.Filled.DirectionsCar,
                    contentDescription = "Ícono de la app",
                    // Le pongo el color primario del tema para que resalte.
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(96.dp)
                )

                // El título de la aplicación.
                Text(
                    text = "Mantenimiento Vehículos Pro",
                    style = MaterialTheme.typography.headlineMedium,
                    // Uso el color 'onBackground' para que se vea bien sobre el fondo oscuro.
                    color = MaterialTheme.colorScheme.onBackground
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "¿Qué deseas hacer?",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onBackground
                )

                // El botón para ir a la pantalla de Login.
                Button(
                    onClick = onLoginClick,
                    modifier = Modifier.fillMaxWidth(0.8f) // Que ocupe el 80% del ancho.
                ) {
                    Text("INICIAR SESIÓN")
                }

                // El botón para ir a la pantalla de Registro.
                Button(
                    onClick = onRegisterClick,
                    modifier = Modifier.fillMaxWidth(0.8f)
                ) {
                    Text("REGISTRARSE")
                }
            }
        }
    }
}
