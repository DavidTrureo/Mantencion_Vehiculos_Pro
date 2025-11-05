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
import com.mantenimientovehiculospro.util.formatearFechaVisual
import kotlinx.coroutines.launch
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResumenMantenimientosScreen(
    vehiculoId: Long,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    // Estados principales de la pantalla
    var vehiculo by remember { mutableStateOf<Vehiculo?>(null) }
    var mantenimientos by remember { mutableStateOf<List<Mantenimiento>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var cargando by remember { mutableStateOf(true) }

    // Al entrar en la pantalla, cargo el vehículo y sus mantenimientos desde el backend
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
                    // Botón para volver atrás
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
                // Estado de carga
                cargando -> CircularProgressIndicator()

                // Estado de error
                error != null -> Text(error!!, color = MaterialTheme.colorScheme.error)

                // Estado con datos cargados
                vehiculo != null -> {
                    // Información básica del vehículo
                    Text(
                        "Vehículo: ${vehiculo!!.marca} ${vehiculo!!.modelo}",
                        style = MaterialTheme.typography.titleLarge
                    )
                    Text(
                        "Año: ${vehiculo!!.anio} | Km: ${vehiculo!!.kilometraje}",
                        style = MaterialTheme.typography.bodyMedium
                    )

                    Spacer(modifier = Modifier.height(24.dp))
                    Text("Historial de mantenimientos:", style = MaterialTheme.typography.titleMedium)

                    // Si no hay mantenimientos registrados
                    if (mantenimientos.isEmpty()) {
                        Text("No hay mantenimientos registrados.")
                    } else {
                        // Recorro la lista de mantenimientos y muestro cada uno en una tarjeta
                        mantenimientos.forEach { m ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                colors = CardDefaults.cardColors(
                                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                                )
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text("• ${m.tipo}", style = MaterialTheme.typography.titleSmall)
                                    Text("Fecha: ${m.fecha?.formatearFechaVisual() ?: "Sin fecha"}")
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