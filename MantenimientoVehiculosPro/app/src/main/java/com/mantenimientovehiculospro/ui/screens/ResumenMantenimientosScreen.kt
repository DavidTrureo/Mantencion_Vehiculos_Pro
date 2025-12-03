package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.mantenimientovehiculospro.R
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.model.Vehiculo
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import com.mantenimientovehiculospro.ui.components.AppBackground
import com.mantenimientovehiculospro.util.formatearFechaVisual

// Esta es una pantalla que muestra un resumen simple de todos los mantenimientos de un vehículo.
// Carga los datos del auto y luego muestra una lista con cada mantenimiento en una tarjeta.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResumenMantenimientosScreen(
    vehiculoId: Long,
    onBack: () -> Unit
) {
    val context = LocalContext.current

    // --- Estados para guardar los datos de la pantalla ---
    var vehiculo by remember { mutableStateOf<Vehiculo?>(null) }
    var mantenimientos by remember { mutableStateOf<List<Mantenimiento>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var cargando by remember { mutableStateOf(true) }

    // Este LaunchedEffect se ejecuta una vez cuando la pantalla carga.
    // Su trabajo es pedirle a la API todos los datos que necesita mostrar.
    LaunchedEffect(vehiculoId) {
        cargando = true // Muestro el circulito de "cargando".
        try {
            // Primero, busco el ID del usuario que está usando la app.
            val usuarioId = UsuarioPreferences.obtenerUsuarioId(context)
                ?: throw IllegalStateException("ID de usuario no encontrado")

            // Pido la lista de vehículos para encontrar el actual por su ID.
            val listaVehiculos = RetrofitProvider.instance.obtenerVehiculos(usuarioId)
            vehiculo = listaVehiculos.find { it.id == vehiculoId }

            // Pido la lista completa de mantenimientos para este vehículo.
            mantenimientos = RetrofitProvider.instance.obtenerMantenimientos(vehiculoId)

        } catch (e: Exception) {
            // Si algo falla, guardo el mensaje de error.
            error = "Error al cargar los datos: ${e.message}"
        } finally {
            cargando = false // Oculto el circulito de "cargando".
        }
    }

    AppBackground(backgroundImageResId = R.drawable.auto4) {
        Scaffold(
            containerColor = Color.Transparent, // Fondo transparente para que se vea la imagen.
            topBar = {
                TopAppBar(
                    title = { Text("Resumen de Mantenimientos") },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(
                                Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Volver",
                                tint = MaterialTheme.colorScheme.onBackground
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f)
                    )
                )
            }
        ) { paddingValues ->
            Box(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
                // Decido qué mostrar en la pantalla según el estado de la carga.
                when {
                    // Si está cargando, muestro el circulito.
                    cargando -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                    // Si hubo un error, muestro el mensaje.
                    error != null -> Text(
                        error!!,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.align(Alignment.Center)
                    )
                    // Si todo está bien, muestro la lista.
                    vehiculo != null -> LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // El primer ítem de la lista: los datos del vehículo.
                        item {
                            Text(
                                "Vehículo: ${vehiculo!!.marca} ${vehiculo!!.modelo}",
                                style = MaterialTheme.typography.titleLarge,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                            Text(
                                "Año: ${vehiculo!!.anio} | Km: ${vehiculo!!.kilometraje}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                "Historial de mantenimientos:",
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                        }

                        // Reviso si la lista de mantenimientos está vacía.
                        if (mantenimientos.isEmpty()) {
                            item {
                                Text(
                                    "No hay mantenimientos registrados.",
                                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
                                )
                            }
                        } else {
                            // Si hay mantenimientos, creo una tarjeta para cada uno.
                            items(mantenimientos, key = { it.id!! }) { m ->
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = MaterialTheme.shapes.large,
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.8f)),
                                    colors = CardDefaults.cardColors(
                                        containerColor = Color.Transparent
                                    )
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Text(
                                            "• ${m.tipo}",
                                            style = MaterialTheme.typography.titleSmall,
                                            color = MaterialTheme.colorScheme.onBackground
                                        )
                                        // Uso mi función para formatear la fecha a un estilo más legible.
                                        Text(
                                            "Fecha: ${m.fecha?.formatearFechaVisual() ?: "Sin fecha"}",
                                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f)
                                        )
                                        Text(
                                            "Descripción: ${m.descripcion}",
                                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f)
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
}
