package com.mantenimientovehiculospro.ui.screens

import android.os.Build
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import kotlinx.coroutines.launch

// Esta es una pantalla que hice para poder cambiar fácilmente la IP del servidor (el backend)
// sin tener que andar cambiando el código y recompilando la app cada vez.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConfiguracionBackendScreen(
    // Esta función se va a ejecutar cuando guarde la IP,
    // para avisarle a la pantalla anterior que ya terminé de configurar.
    onConfigurado: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope() // Para poder guardar la IP en segundo plano.

    // Aquí guardo lo que el usuario escribe en el campo de texto.
    var ipManual by remember { mutableStateOf("") }

    // Para mostrar un mensaje en la pantalla, como "IP guardada".
    var mensaje by remember { mutableStateOf<String?>(null) }

    // ¡El truco para detectar la IP!
    // Reviso si la app está corriendo en un emulador de Android Studio.
    val ipDetectada = remember {
        // Si la "huella digital" del sistema contiene "generic", es casi seguro un emulador.
        if (Build.FINGERPRINT.contains("generic")) {
            "10.0.2.2" // IP especial del emulador para conectarse al localhost del PC.
        } else {
            "192.168.100.105" // IP que puse a mano para mi teléfono físico en la red Wi-Fi.
            // Ojo: esta la tengo que cambiar si la IP de mi PC cambia.
        }
    }

    // La estructura de la pantalla (la barra de arriba y el contenido).
    Scaffold(
        topBar = { TopAppBar(title = { Text("Configurar Backend") }) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            // Muestro la IP que detecté automáticamente, para que el usuario sepa.
            Text("IP detectada para este dispositivo: $ipDetectada")

            Spacer(modifier = Modifier.height(16.dp))

            // Un campo de texto para que el usuario pueda poner otra IP si quiere.
            // Por ejemplo, si está en otra red Wi-Fi.
            OutlinedTextField(
                value = ipManual,
                onValueChange = { ipManual = it },
                label = { Text("O escribe una IP manual") },
                placeholder = { Text("Ej: 192.168.1.10") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))

            // El botón para guardar la configuración.
            Button(
                onClick = {
                    // Decido qué IP usar: si el usuario escribió una, uso esa.
                    // Si dejó el campo vacío, uso la que detecté automáticamente.
                    val ipFinal = if (ipManual.isNotBlank()) ipManual else ipDetectada

                    // Inicio una corrutina para guardar los datos sin bloquear la pantalla.
                    scope.launch {
                        // Uso mi clase UsuarioPreferences para guardar la IP en el teléfono.
                        UsuarioPreferences.guardarIpBackend(context, ipFinal)

                        // Muestro un mensaje para confirmar que se guardó.
                        mensaje = "¡Listo! IP configurada como: $ipFinal"

                        // Aviso a la pantalla anterior que ya terminé.
                        onConfigurado()
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Guardar y continuar")
            }

            // Si hay algún mensaje para mostrar, lo pongo aquí abajo.
            mensaje?.let {
                Spacer(modifier = Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.primary)
            }
        }
    }
}
