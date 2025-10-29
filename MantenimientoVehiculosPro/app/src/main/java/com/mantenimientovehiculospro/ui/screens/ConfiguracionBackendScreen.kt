package com.mantenimientovehiculospro.ui.screens

import android.os.Build
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConfiguracionBackendScreen(
    onConfigurado: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var ipManual by remember { mutableStateOf("") }
    var mensaje by remember { mutableStateOf<String?>(null) }

    val ipDetectada = remember {
        if (Build.FINGERPRINT.contains("generic")) "10.0.2.2" else "192.168.100.105"
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Configurar Backend") }) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            Text("IP detectada automáticamente: $ipDetectada")

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = ipManual,
                onValueChange = { ipManual = it },
                label = { Text("IP manual (opcional)") },
                placeholder = { Text("Ej: 192.168.1.100") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = {
                    val ipFinal = if (ipManual.isNotBlank()) ipManual else ipDetectada
                    scope.launch {
                        UsuarioPreferences.guardarIpBackend(context, ipFinal)
                        mensaje = "IP configurada: $ipFinal"
                        onConfigurado()
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Guardar configuración")
            }

            mensaje?.let {
                Spacer(modifier = Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.primary)
            }
        }
    }
}