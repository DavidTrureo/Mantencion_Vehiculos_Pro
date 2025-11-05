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
    // Uso un Scaffold para estructurar la pantalla con un TopBar y un contenido central
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    // Aquí muestro el título de la aplicación en la barra superior
                    Text(
                        text = "Mantenimiento Vehículos Pro",
                        style = Typography.titleLarge
                    )
                }
            )
        }
    ) { paddingValues ->
        // Box me permite centrar el contenido en la pantalla
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            // Dentro del Box, organizo los elementos en una columna
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(24.dp),
                modifier = Modifier.padding(horizontal = 24.dp)
            ) {
                // Ícono distintivo de la app, que refuerza la identidad visual
                Icon(
                    imageVector = Icons.Filled.DirectionsCar,
                    contentDescription = "Ícono de la app",
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(96.dp)
                )

                // Nombre de la aplicación, destacado con tipografía y color primario
                Text(
                    text = "Mantenimiento Vehículos Pro",
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.primary
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Texto que guía al usuario sobre qué acción tomar
                Text(
                    text = "¿Qué deseas hacer?",
                    style = MaterialTheme.typography.bodyLarge
                )

                // Botón para iniciar sesión
                Button(
                    onClick = onLoginClick,
                    modifier = Modifier.fillMaxWidth(0.8f)
                ) {
                    Text("INICIAR SESIÓN")
                }

                // Botón para registrarse
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