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
    onConfigurado: () -> Unit // Callback que se ejecuta cuando se guarda la configuración
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    // Estado para almacenar la IP ingresada manualmente
    var ipManual by remember { mutableStateOf("") }

    // Estado para mostrar mensajes de confirmación o feedback
    var mensaje by remember { mutableStateOf<String?>(null) }

    // Detecto automáticamente la IP según el entorno:
    // - Si es un emulador (Build.FINGERPRINT contiene "generic"), uso 10.0.2.2
    // - Si es un dispositivo físico, uso una IP local fija (ejemplo: 192.168.100.105)
    val ipDetectada = remember {
        if (Build.FINGERPRINT.contains("generic")) "10.0.2.2" else "192.168.100.105"
    }

    // Estructura principal de la pantalla
    Scaffold(
        topBar = { TopAppBar(title = { Text("Configurar Backend") }) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            // Muestro la IP detectada automáticamente
            Text("IP detectada automáticamente: $ipDetectada")

            Spacer(modifier = Modifier.height(16.dp))

            // Campo de texto para ingresar una IP manual (opcional)
            OutlinedTextField(
                value = ipManual,
                onValueChange = { ipManual = it },
                label = { Text("IP manual (opcional)") },
                placeholder = { Text("Ej: 192.168.1.100") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Botón para guardar la configuración
            Button(
                onClick = {
                    // Si el usuario ingresó una IP manual, la uso; si no, uso la detectada
                    val ipFinal = if (ipManual.isNotBlank()) ipManual else ipDetectada
                    scope.launch {
                        // Guardo la IP en DataStore usando UsuarioPreferences
                        UsuarioPreferences.guardarIpBackend(context, ipFinal)
                        // Muestro mensaje de confirmación
                        mensaje = "IP configurada: $ipFinal"
                        // Ejecuto el callback para notificar que la configuración está lista
                        onConfigurado()
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Guardar configuración")
            }

            // Si hay un mensaje, lo muestro debajo en color primario
            mensaje?.let {
                Spacer(modifier = Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.primary)
            }
        }
    }
}