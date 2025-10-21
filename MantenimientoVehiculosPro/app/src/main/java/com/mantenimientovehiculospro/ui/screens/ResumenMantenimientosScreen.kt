package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.model.Vehiculo
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import kotlinx.coroutines.launch

// ✅ Función para formatear fechas en DD/MM/AAAA
fun formatearFecha(fecha: String?): String {
    if (fecha.isNullOrBlank()) return "Sin fecha"
    return try {
        val partes = fecha.split("-", "/", ".")
        when {
            partes.size == 3 && partes[0].length == 4 -> "${partes[2]}/${partes[1]}/${partes[0]}" // ISO → DD/MM/AAAA
            partes.size == 3 && partes[2].length == 4 -> fecha // Ya está en DD/MM/AAAA
            else -> fecha
        }
    } catch (e: Exception) {
        fecha
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResumenMantenimientosScreen(
    vehiculoId: Long,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var vehiculo by remember { mutableStateOf<Vehiculo?>(null) }
    var mantenimientos by remember { mutableStateOf<List<Mantenimiento>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var cargando by remember { mutableStateOf(true) }

    LaunchedEffect(vehiculoId) {
        scope.launch {
            try {
                val usuarioId = UsuarioPreferences.obtenerUsuarioId(context)
                val lista = RetrofitProvider.instance.obtenerVehiculos(usuarioId ?: return@launch)
                vehiculo = lista.find { it.id == vehiculoId }
                mantenimientos = RetrofitProvider.instance.obtenerMantenimientos(vehiculoId)
            } catch (e: Exception) {
                error = "Error al cargar datos: ${e.message}"
            } finally {
                cargando = false
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Resumen de Mantenimientos") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            when {
                cargando -> CircularProgressIndicator()
                error != null -> Text(error!!, color = MaterialTheme.colorScheme.error)
                vehiculo != null -> {
                    Text("Vehículo: ${vehiculo!!.marca} ${vehiculo!!.modelo}", style = MaterialTheme.typography.titleLarge)
                    Text("Año: ${vehiculo!!.anio} | Km: ${vehiculo!!.kilometraje}", style = MaterialTheme.typography.bodyMedium)

                    Spacer(modifier = Modifier.height(24.dp))
                    Text("Historial de mantenimientos:", style = MaterialTheme.typography.titleMedium)

                    if (mantenimientos.isEmpty()) {
                        Text("No hay mantenimientos registrados.")
                    } else {
                        mantenimientos.forEach { m ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text("• ${m.tipo}", style = MaterialTheme.typography.titleSmall)
                                    Text("Fecha: ${formatearFecha(m.fecha)}")
                                    Text("Descripción: ${m.descripcion}")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}