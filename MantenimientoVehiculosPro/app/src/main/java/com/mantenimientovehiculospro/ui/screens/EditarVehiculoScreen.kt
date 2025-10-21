package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import com.mantenimientovehiculospro.data.model.Vehiculo
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditarVehiculoScreen(
    vehiculoId: Long,
    navController: NavController
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var vehiculo by remember { mutableStateOf<Vehiculo?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var cargando by remember { mutableStateOf(true) }

    var marca by remember { mutableStateOf("") }
    var modelo by remember { mutableStateOf("") }
    var anio by remember { mutableStateOf("") }
    var kilometraje by remember { mutableStateOf("") }

    LaunchedEffect(vehiculoId) {
        scope.launch {
            val usuarioId = UsuarioPreferences.obtenerUsuarioId(context)
            if (usuarioId != null) {
                try {
                    val lista = RetrofitProvider.instance.obtenerVehiculos(usuarioId)
                    vehiculo = lista.find { it.id == vehiculoId }
                    vehiculo?.let {
                        marca = it.marca
                        modelo = it.modelo
                        anio = it.anio.toString()
                        kilometraje = it.kilometraje.toString()
                    }
                } catch (e: Exception) {
                    error = "Error al cargar vehículo: ${e.message}"
                } finally {
                    cargando = false
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Editar Vehículo") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
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
            if (cargando) {
                CircularProgressIndicator()
            } else if (vehiculo == null) {
                Text("Vehículo no encontrado", color = MaterialTheme.colorScheme.error)
            } else {
                OutlinedTextField(
                    value = marca,
                    onValueChange = { marca = it },
                    label = { Text("Marca") },
                    placeholder = { Text("Ej: Toyota, Ford, Chevrolet...") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = modelo,
                    onValueChange = { modelo = it },
                    label = { Text("Modelo") },
                    placeholder = { Text("Ej: Corolla, Ranger, Spark...") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = anio,
                    onValueChange = { anio = it },
                    label = { Text("Año") },
                    placeholder = { Text("Ej: 2015") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = kilometraje,
                    onValueChange = { kilometraje = it },
                    label = { Text("Kilometraje") },
                    placeholder = { Text("Ej: 75000") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(24.dp))

                Button(onClick = {
                    val anioInt = anio.toIntOrNull()
                    val kmInt = kilometraje.toIntOrNull()

                    if (marca.isBlank() || modelo.isBlank() || anioInt == null || kmInt == null) {
                        error = "Completa todos los campos correctamente"
                        return@Button
                    }

                    scope.launch {
                        try {
                            val propietarioId = vehiculo?.propietarioId ?: return@launch
                            val actualizado = Vehiculo(
                                id = vehiculoId,
                                marca = marca,
                                modelo = modelo,
                                anio = anioInt,
                                kilometraje = kmInt,
                                propietarioId = propietarioId
                            )
                            RetrofitProvider.instance.actualizarVehiculo(vehiculoId, actualizado)
                            navController.previousBackStackEntry?.savedStateHandle?.set("refrescar", true)
                            navController.popBackStack()
                        } catch (e: Exception) {
                            error = "Error al actualizar vehículo: ${e.message}"
                        }
                    }
                }) {
                    Text("Guardar cambios")
                }

                error?.let {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(it, color = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}