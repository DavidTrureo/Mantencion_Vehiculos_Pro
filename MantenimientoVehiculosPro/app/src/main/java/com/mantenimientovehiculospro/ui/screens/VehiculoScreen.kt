package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.runtime.setValue
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

// Esta es la pantalla principal de la app una vez que el usuario inicia sesión.
// Muestra la lista de todos sus vehículos.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VehiculoScreen(
    // Funciones que me vienen del navegador para ir a otras pantallas.
    onAddVehiculoClick: () -> Unit,
    onVehiculoClick: (Long) -> Unit,
    onLogout: () -> Unit,
    navController: NavController
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope() // Para las llamadas a la API.

    // --- Estados para guardar los datos de la pantalla ---
    var vehiculos by remember { mutableStateOf<List<Vehiculo>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var cargando by remember { mutableStateOf(true) }

    // Función que pide la lista de vehículos a la API y actualiza la pantalla.
    fun recargarVehiculos() {
        cargando = true // Muestro el circulito de carga.
        scope.launch {
            val usuarioId = UsuarioPreferences.obtenerUsuarioId(context)
            if (usuarioId == null) {
                error = "No se pudo obtener el usuario. Intenta iniciar sesión de nuevo."
                cargando = false
                return@launch
            }
            try {
                // Llamo a la API para que me dé la lista de vehículos de este usuario.
                val lista = RetrofitProvider.instance.obtenerVehiculos(usuarioId)
                vehiculos = lista
                error = null // Limpio cualquier error anterior.
            } catch (e: Exception) {
                error = "Error al cargar los vehículos: ${e.message}"
            } finally {
                cargando = false // Oculto el circulito de carga.
            }
        }
    }

    // Este LaunchedEffect se ejecuta una sola vez cuando la pantalla se muestra por primera vez.
    LaunchedEffect(true) {
        recargarVehiculos()
    }

    // --- ¡Este es el truco para refrescar la lista! ---
    // Me quedo "escuchando" si la pantalla anterior (la de editar) me mandó una señal.
    val refrescarHandle = navController.currentBackStackEntry
        ?.savedStateHandle
        ?.getLiveData<Boolean>("refrescar")
        ?.observeAsState()

    // Este LaunchedEffect se activa cada vez que la señal "refrescar" cambia.
    LaunchedEffect(refrescarHandle?.value) {
        // Si la señal es 'true'...
        if (refrescarHandle?.value == true) {
            // ...vuelvo a cargar la lista de vehículos.
            recargarVehiculos()
            // Y reseteo la señal a 'false' para que no se vuelva a ejecutar sola.
            navController.currentBackStackEntry?.savedStateHandle?.set("refrescar", false)
        }
    }

    AppBackground(backgroundImageResId = R.drawable.auto3) {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = { Text("Mis Vehículos") },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f)
                    ),
                    // Los botones de acción en la barra de arriba.
                    actions = {
                        // Botón para ir a la pantalla de añadir vehículo.
                        IconButton(onClick = onAddVehiculoClick) {
                            Icon(Icons.Default.Add, contentDescription = "Agregar vehículo")
                        }
                        // Botón para cerrar sesión.
                        IconButton(onClick = onLogout) {
                            Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Cerrar sesión")
                        }
                    }
                )
            },
            // El botón flotante para escanear QR.
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { navController.navigate("scanner") }, // Me lleva a la pantalla del escáner.
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
                // Decido qué mostrar: la carga, un error, un mensaje de lista vacía o la lista de vehículos.
                when {
                    cargando -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                    error != null -> Text(
                        text = error!!,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.align(Alignment.Center)
                    )
                    vehiculos.isEmpty() -> Text(
                        text = "No tienes vehículos registrados.\n¡Añade uno para empezar!",
                        modifier = Modifier.align(Alignment.Center),
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    // Si todo está bien y hay vehículos, muestro la lista.
                    else -> LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(vehiculos, key = { it.id!! }) { vehiculo ->
                            // Creo una tarjeta para cada vehículo de la lista.
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { vehiculo.id?.let { onVehiculoClick(it) } }, // Al tocarla, me lleva al detalle del vehículo.
                                shape = MaterialTheme.shapes.large,
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.8f)), // Borde con el color del tema.
                                colors = CardDefaults.cardColors(
                                    containerColor = Color.Transparent // Fondo transparente para el efecto "holograma".
                                )
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Text(
                                        text = "${vehiculo.marca} ${vehiculo.modelo}",
                                        style = MaterialTheme.typography.titleLarge,
                                        color = MaterialTheme.colorScheme.onBackground
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = "Año: ${vehiculo.anio}",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
                                    )
                                    Text(
                                        text = "Kilometraje: ${vehiculo.kilometraje} km",
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
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
