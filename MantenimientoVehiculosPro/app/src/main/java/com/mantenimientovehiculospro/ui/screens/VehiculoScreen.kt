package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.livedata.observeAsState
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
fun VehiculoScreen(
    onAddVehiculoClick: () -> Unit,
    onVehiculoClick: (Long) -> Unit,
    onLogout: () -> Unit,
    navController: NavController
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var vehiculos by remember { mutableStateOf<List<Vehiculo>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var cargando by remember { mutableStateOf(true) }

    fun recargarVehiculos() {
        scope.launch {
            val usuarioId = UsuarioPreferences.obtenerUsuarioId(context)
            if (usuarioId == null) {
                error = "No se pudo obtener el usuario"
                cargando = false
                return@launch
            }

            try {
                val lista = RetrofitProvider.instance.obtenerVehiculos(usuarioId)
                vehiculos = lista
                error = null
            } catch (e: Exception) {
                error = "Error al cargar vehículos: ${e.message}"
            } finally {
                cargando = false
            }
        }
    }

    LaunchedEffect(true) {
        recargarVehiculos()
    }

    val refrescarHandle = navController.currentBackStackEntry
        ?.savedStateHandle
        ?.getLiveData<Boolean>("refrescar")
        ?.observeAsState()

    LaunchedEffect(refrescarHandle?.value) {
        if (refrescarHandle?.value == true) {
            recargarVehiculos()
            navController.currentBackStackEntry?.savedStateHandle?.set("refrescar", false)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mis Vehículos") },
                actions = {
                    IconButton(onClick = onAddVehiculoClick) {
                        Icon(Icons.Default.Add, contentDescription = "Agregar vehículo")
                    }
                    IconButton(onClick = onLogout) {
                        Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Cerrar sesión")
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
                vehiculos.isEmpty() -> Text("No tienes vehículos registrados.")
                else -> LazyColumn {
                    items(vehiculos) { vehiculo ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp)
                                .clickable {
                                    vehiculo.id?.let { onVehiculoClick(it) }
                                }
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Marca: ${vehiculo.marca}", style = MaterialTheme.typography.titleMedium)
                                Text("Modelo: ${vehiculo.modelo}")
                                Text("Año: ${vehiculo.anio}")
                                Text("Kilometraje: ${vehiculo.kilometraje} km")
                            }
                        }
                    }
                }
            }
        }
    }
}