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

@Composable
fun InicioScreen(
    onLoginClick: () -> Unit,
    onRegisterClick: () -> Unit
) {
    // ✅ Usamos nuestro nuevo componente de fondo y le pasamos la imagen que has añadido.
    AppBackground(backgroundImageResId = R.drawable.auto1) {
        // Box para centrar el contenido en la pantalla
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(24.dp),
                modifier = Modifier.padding(horizontal = 24.dp)
            ) {
                // ✅ Ícono con el color de acento para que resalte
                Icon(
                    imageVector = Icons.Filled.DirectionsCar,
                    contentDescription = "Ícono de la app",
                    tint = MaterialTheme.colorScheme.primary, // Usará AmberAccent en tema oscuro
                    modifier = Modifier.size(96.dp)
                )

                // ✅ Texto con el color correcto para ser legible sobre fondo oscuro
                Text(
                    text = "Mantenimiento Vehículos Pro",
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.onBackground // Usará TextWhite en tema oscuro
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "¿Qué deseas hacer?",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onBackground
                )

                // ✅ Los botones ya usan los colores del tema (AmberAccent), así que no necesitan cambios.
                Button(
                    onClick = onLoginClick,
                    modifier = Modifier.fillMaxWidth(0.8f)
                ) {
                    Text("INICIAR SESIÓN")
                }

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