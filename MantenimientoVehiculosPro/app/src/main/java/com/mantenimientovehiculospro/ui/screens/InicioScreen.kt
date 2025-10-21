package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InicioScreen(
    onLoginClick: () -> Unit,
    onRegisterClick: () -> Unit
) {
    Scaffold(
        topBar = { TopAppBar(title = { Text("Bienvenido") }) }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                Text("¿Qué deseas hacer?", style = MaterialTheme.typography.headlineMedium)
                Button(onClick = onLoginClick, modifier = Modifier.fillMaxWidth(0.8f)) {
                    Text("INICIAR SESIÓN")
                }
                Button(onClick = onRegisterClick, modifier = Modifier.fillMaxWidth(0.8f)) {
                    Text("REGISTRARSE")
                }
            }
        }
    }
}