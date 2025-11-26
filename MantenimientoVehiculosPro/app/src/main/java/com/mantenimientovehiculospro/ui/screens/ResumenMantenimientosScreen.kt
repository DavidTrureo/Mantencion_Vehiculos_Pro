package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
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
import com.mantenimientovehiculospro.util.formatearFechaVisual // ✅ Importamos la función de utilidad

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResumenMantenimientosScreen(
    vehiculoId: Long,
    onBack: () -> Unit
) {
    val context = LocalContext.current

    var vehiculo by remember { mutableStateOf<Vehiculo?>(null) }
    var mantenimientos by remember { mutableStateOf<List<Mantenimiento>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var cargando by remember { mutableStateOf(true) }

    LaunchedEffect(vehiculoId) {
        cargando = true
        try {
            val usuarioId = UsuarioPreferences.obtenerUsuarioId(context) ?: throw IllegalStateException("ID de usuario no encontrado")
            val listaVehiculos = RetrofitProvider.instance.obtenerVehiculos(usuarioId)
            vehiculo = listaVehiculos.find { it.id == vehiculoId }
            mantenimientos = RetrofitProvider.instance.obtenerMantenimientos(vehiculoId)
        } catch (e: Exception) {
            error = "Error al cargar datos: ${e.message}"
        } finally {
            cargando = false
        }
    }

    AppBackground(backgroundImageResId = R.drawable.auto4) {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = { Text("Resumen de Mantenimientos") },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver", tint = MaterialTheme.colorScheme.onBackground)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f),
                        titleContentColor = MaterialTheme.colorScheme.onBackground,
                        navigationIconContentColor = MaterialTheme.colorScheme.onBackground
                    )
                )
            }
        ) { paddingValues ->
            Box(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
                when {
                    cargando -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                    error != null -> Text(error!!, color = MaterialTheme.colorScheme.error, modifier = Modifier.align(Alignment.Center))
                    vehiculo != null -> LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        item {
                            Text("Vehículo: ${vehiculo!!.marca} ${vehiculo!!.modelo}", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onBackground)
                            Text("Año: ${vehiculo!!.anio} | Km: ${vehiculo!!.kilometraje}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f))
                            Spacer(modifier = Modifier.height(16.dp))
                            Text("Historial de mantenimientos:", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onBackground)
                        }

                        if (mantenimientos.isEmpty()) {
                            item {
                                Text("No hay mantenimientos registrados.", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f))
                            }
                        } else {
                            items(mantenimientos) { m ->
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = MaterialTheme.shapes.large,
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.8f)),
                                    colors = CardDefaults.cardColors(
                                        containerColor = Color.Transparent
                                    )
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Text("• ${m.tipo}", style = MaterialTheme.typography.titleSmall, color = MaterialTheme.colorScheme.onBackground)
                                        Text("Fecha: ${m.fecha?.formatearFechaVisual() ?: "Sin fecha"}", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f))
                                        Text("Descripción: ${m.descripcion}", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f))
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