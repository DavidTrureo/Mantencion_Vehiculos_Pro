package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsCar
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mantenimientovehiculospro.ui.theme.Typography

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InicioScreen(
    onLoginClick: () -> Unit,
    onRegisterClick: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Mantenimiento Vehículos Pro",
                        style = Typography.titleLarge
                    )
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(24.dp),
                modifier = Modifier.padding(horizontal = 24.dp)
            ) {
                // Ícono distintivo
                Icon(
                    imageVector = Icons.Filled.DirectionsCar,
                    contentDescription = "Ícono de la app",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(96.dp)
                )

                // Nombre de la app
                Text(
                    text = "Mantenimiento Vehículos Pro",
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.primary
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "¿Qué deseas hacer?",
                    style = MaterialTheme.typography.bodyLarge
                )

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