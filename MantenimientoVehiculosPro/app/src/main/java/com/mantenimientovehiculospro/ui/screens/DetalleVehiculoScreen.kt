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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DetalleVehiculoScreen(
    vehiculoId: Long,
    onBack: () -> Unit,
    onEditar: (Long) -> Unit,
    onAgregarMantenimiento: (Long) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var vehiculo by remember { mutableStateOf<Vehiculo?>(null) }
    var mantenimientos by remember { mutableStateOf<List<Mantenimiento>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var cargando by remember { mutableStateOf(true) }
    var mostrarDialogoConfirmacion by remember { mutableStateOf(false) }

    var refrescar by remember { mutableStateOf(false) }

    LaunchedEffect(vehiculoId, refrescar) {
        scope.launch {
            val usuarioId = UsuarioPreferences.obtenerUsuarioId(context)
            if (usuarioId == null) {
                error = "No se pudo obtener el usuario"
                cargando = false
                return@launch
            }

            try {
                val lista = RetrofitProvider.instance.obtenerVehiculos(usuarioId)
                vehiculo = lista.find { it.id == vehiculoId }
                if (vehiculo == null) {
                    error = "Vehículo no encontrado"
                } else {
                    mantenimientos = RetrofitProvider.instance.obtenerMantenimientos(vehiculoId)
                }
            } catch (e: Exception) {
                error = "Error al cargar datos: ${e.message}"
            } finally {
                cargando = false
                refrescar = false
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Detalle del Vehículo") },
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
                    Text("Marca: ${vehiculo!!.marca}", style = MaterialTheme.typography.titleLarge)
                    Text("Modelo: ${vehiculo!!.modelo}", style = MaterialTheme.typography.bodyLarge)
                    Text("Año: ${vehiculo!!.anio}")
                    Text("Kilometraje: ${vehiculo!!.kilometraje} km")

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = { onEditar(vehiculoId) },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text("Editar", color = MaterialTheme.colorScheme.onPrimary)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Button(
                        onClick = { onAgregarMantenimiento(vehiculoId) },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary)
                    ) {
                        Text("Agregar mantenimiento", color = MaterialTheme.colorScheme.onSecondary)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Button(
                        onClick = { mostrarDialogoConfirmacion = true },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                    ) {
                        Text("Eliminar vehículo", color = MaterialTheme.colorScheme.onError)
                    }

                    if (mostrarDialogoConfirmacion) {
                        AlertDialog(
                            onDismissRequest = { mostrarDialogoConfirmacion = false },
                            title = { Text("¿Eliminar vehículo?") },
                            text = { Text("Esta acción no se puede deshacer.") },
                            confirmButton = {
                                TextButton(onClick = {
                                    mostrarDialogoConfirmacion = false
                                    scope.launch {
                                        try {
                                            val response = RetrofitProvider.instance.eliminarVehiculo(vehiculoId)
                                            if (response.isSuccessful) {
                                                onBack()
                                            } else {
                                                error = "Error al eliminar vehículo: ${response.code()}"
                                            }
                                        } catch (e: Exception) {
                                            error = "Error al eliminar vehículo: ${e.message}"
                                        }
                                    }
                                }) {
                                    Text("Eliminar", color = MaterialTheme.colorScheme.error)
                                }
                            },
                            dismissButton = {
                                TextButton(onClick = { mostrarDialogoConfirmacion = false }) {
                                    Text("Cancelar")
                                }
                            }
                        )
                    }

                    Spacer(modifier = Modifier.height(24.dp))
                    Text("Mantenimientos registrados:", style = MaterialTheme.typography.titleMedium)

                    if (mantenimientos.isEmpty()) {
                        Text(
                            text = "No hay mantenimientos registrados.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.outline
                        )
                    } else {
                        Column {
                            mantenimientos.forEach { mantenimiento ->
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp),
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                                    )
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Text("Tipo: ${mantenimiento.tipo}", style = MaterialTheme.typography.titleMedium)
                                        Text("Fecha: ${mantenimiento.fecha}", style = MaterialTheme.typography.bodyMedium)
                                        Text("Kilometraje: ${mantenimiento.kilometraje} km", style = MaterialTheme.typography.bodyMedium)
                                        Text("Descripción: ${mantenimiento.descripcion}", style = MaterialTheme.typography.bodySmall)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}