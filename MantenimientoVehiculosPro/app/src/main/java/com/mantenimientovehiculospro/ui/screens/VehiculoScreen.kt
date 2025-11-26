package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.mantenimientovehiculospro.R
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import com.mantenimientovehiculospro.data.model.Vehiculo
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import com.mantenimientovehiculospro.ui.components.AppBackground
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

    LaunchedEffect(true) { recargarVehiculos() }

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

    // ✅ Envolvemos todo en AppBackground para poner la imagen de fondo
    AppBackground(backgroundImageResId = R.drawable.odometro) {
        Scaffold(
            // Hacemos el Scaffold transparente para que se vea la imagen
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = { Text("Mis Vehículos") },
                    colors = TopAppBarDefaults.topAppBarColors(
                        // Le damos un efecto translúcido a la barra superior
                        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f),
                        titleContentColor = MaterialTheme.colorScheme.onSurface,
                        actionIconContentColor = MaterialTheme.colorScheme.primary
                    ),
                    actions = {
                        IconButton(onClick = onAddVehiculoClick) {
                            Icon(Icons.Default.Add, contentDescription = "Agregar vehículo")
                        }
                        IconButton(onClick = onLogout) {
                            Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Cerrar sesión")
                        }
                    }
                )
            },
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { navController.navigate("scanner") },
                    containerColor = MaterialTheme.colorScheme.primary
                ) {
                    Icon(Icons.Filled.CameraAlt, contentDescription = "Escanear QR", tint = MaterialTheme.colorScheme.onPrimary)
                }
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(start = 16.dp, end = 16.dp, top = 16.dp)
            ) {
                when {
                    cargando -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                    error != null -> Text(
                        text = error!!,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.align(Alignment.Center)
                    )
                    vehiculos.isEmpty() -> Text(
                        text = "No tienes vehículos registrados. ¡Añade uno para empezar!",
                        modifier = Modifier.align(Alignment.Center),
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(vehiculos) { vehiculo ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { vehiculo.id?.let { onVehiculoClick(it) } },
                                colors = CardDefaults.cardColors(
                                    // Hacemos las tarjetas semi-transparentes para mejorar la legibilidad
                                    containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.75f)
                                )
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "${vehiculo.marca} ${vehiculo.modelo}",
                                        style = MaterialTheme.typography.titleLarge,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "Año: ${vehiculo.anio}",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                    )
                                    Text(
                                        text = "Kilometraje: ${vehiculo.kilometraje} km",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}