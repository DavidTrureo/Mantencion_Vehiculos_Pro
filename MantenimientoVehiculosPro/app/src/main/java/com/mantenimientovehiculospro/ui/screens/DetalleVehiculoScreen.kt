package com.mantenimientovehiculospro.ui.screens

import android.graphics.Bitmap
import android.graphics.Color as AndroidColor
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import com.mantenimientovehiculospro.R
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.model.Vehiculo
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import com.mantenimientovehiculospro.ui.components.AppBackground
import com.mantenimientovehiculospro.util.formatearFechaVisual
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DetalleVehiculoScreen(
    vehiculoId: Long,
    onBack: () -> Unit,
    onEditar: (Long) -> Unit,
    onAgregarMantenimiento: (Long) -> Unit,
    onEditarMantenimiento: (Long) -> Unit,
    onEliminarMantenimiento: suspend (Long) -> Boolean
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var vehiculo by remember { mutableStateOf<Vehiculo?>(null) }
    var mantenimientos by remember { mutableStateOf<List<Mantenimiento>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var cargando by remember { mutableStateOf(true) }
    var mostrarDialogoConfirmacion by remember { mutableStateOf(false) }
    var refrescar by remember { mutableStateOf(false) }
    var tipoExpandido by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(vehiculoId, refrescar) {
        cargando = true
        val usuarioId = UsuarioPreferences.obtenerUsuarioId(context)
        if (usuarioId == null) {
            error = "No se pudo obtener el usuario"
            cargando = false
            return@LaunchedEffect
        }
        try {
            val listaVehiculos = RetrofitProvider.instance.obtenerVehiculos(usuarioId)
            vehiculo = listaVehiculos.find { it.id == vehiculoId }
            if (vehiculo != null) {
                mantenimientos = RetrofitProvider.instance.obtenerMantenimientos(vehiculoId)
            } else {
                error = "Vehículo no encontrado"
            }
        } catch (e: Exception) {
            error = "Error al cargar datos: ${e.message}"
        } finally {
            cargando = false
            refrescar = false
        }
    }

    AppBackground(backgroundImageResId = R.drawable.auto4) {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = { Text("Detalle del Vehículo") },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f),
                        titleContentColor = MaterialTheme.colorScheme.onSurface,
                        navigationIconContentColor = MaterialTheme.colorScheme.onSurface
                    )
                )
            }
        ) { paddingValues ->
            LazyColumn(
                modifier = Modifier.padding(paddingValues).fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (cargando) {
                    item { Box(modifier = Modifier.fillParentMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() } }
                } else if (error != null) {
                    item { Box(modifier = Modifier.fillParentMaxSize(), contentAlignment = Alignment.Center) { Text(error!!, color = MaterialTheme.colorScheme.error) } }
                } else if (vehiculo != null) {
                    item {
                        Text("${vehiculo!!.marca} ${vehiculo!!.modelo}", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onBackground)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Año: ${vehiculo!!.anio}", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f))
                        Text("Kilometraje: ${vehiculo!!.kilometraje} km", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f))
                    }

                    item {
                        vehiculo!!.qrCode?.let {
                            val qrBitmap = generarQrBitmap(it)
                            Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                                Image(bitmap = qrBitmap.asImageBitmap(), contentDescription = "Código QR", modifier = Modifier.size(200.dp).padding(8.dp))
                            }
                        } ?: Text("No hay QR asignado", color = MaterialTheme.colorScheme.onBackground)
                    }

                    item {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(onClick = { onAgregarMantenimiento(vehiculoId) }, modifier = Modifier.fillMaxWidth()) { Text("AGREGAR MANTENIMIENTO") }
                            OutlinedButton(onClick = { onEditar(vehiculoId) }, modifier = Modifier.fillMaxWidth()) { Text("EDITAR VEHÍCULO") }
                            OutlinedButton(onClick = { mostrarDialogoConfirmacion = true }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)) { Text("ELIMINAR VEHÍCULO") }
                        }
                    }

                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Historial de Mantenimientos", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onBackground)
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    if (mantenimientos.isEmpty()) {
                        item { Text("No hay mantenimientos registrados.", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)) }
                    } else {
                        val agrupadosPorTipo = mantenimientos.groupBy { it.tipo.trim().lowercase() }

                        items(agrupadosPorTipo.entries.toList(), key = { it.key }) { entry ->
                            val tipo = entry.key
                            val listaOrdenada = entry.value.sortedByDescending { it.kilometraje }
                            val ultimo = listaOrdenada.first()
                            val restantes = listaOrdenada.drop(1)
                            val cantidad = listaOrdenada.size
                            val estaExpandido = tipoExpandido == tipo

                            Card(
                                modifier = Modifier.fillMaxWidth().clickable { tipoExpandido = if (estaExpandido) null else tipo },
                                shape = MaterialTheme.shapes.medium,
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.7f)),
                                colors = CardDefaults.cardColors(containerColor = Color.Transparent)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    val titulo = "${tipo.replaceFirstChar { it.uppercase() }}" + if (cantidad > 1) " ($cantidad)" else ""
                                    Text(titulo, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                                    Text("Fecha: ${ultimo.fecha?.formatearFechaVisual() ?: "N/A"}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f))
                                    Text("Kilometraje: ${ultimo.kilometraje} km", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f))
                                    Text("Descripción: ${ultimo.descripcion ?: "-"}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f))

                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                                        TextButton(onClick = { ultimo.id?.let { onEditarMantenimiento(it) } }) { Text("Editar") }
                                        TextButton(onClick = { /* Lógica para eliminar */ }) { Text("Eliminar", color = MaterialTheme.colorScheme.error) }
                                    }

                                    if (estaExpandido && restantes.isNotEmpty()) {
                                        Divider(modifier = Modifier.padding(vertical = 8.dp), color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f))
                                        restantes.forEach { mantenimiento ->
                                            Column(modifier = Modifier.padding(top = 8.dp)) {
                                                Text("Fecha: ${mantenimiento.fecha?.formatearFechaVisual() ?: "N/A"}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f))
                                                Text("Kilometraje: ${mantenimiento.kilometraje} km", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f))
                                                Text("Descripción: ${mantenimiento.descripcion ?: "-"}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f))
                                                Spacer(modifier = Modifier.height(8.dp))
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

        if (mostrarDialogoConfirmacion) {
            AlertDialog(
                onDismissRequest = { mostrarDialogoConfirmacion = false },
                title = { Text("¿Eliminar vehículo?") },
                text = { Text("Esta acción no se puede deshacer.") },
                confirmButton = {
                    Button(onClick = { scope.launch { try { RetrofitProvider.instance.eliminarVehiculo(vehiculoId); onBack() } catch (e: Exception) { error = "Error: ${e.message}" } }; mostrarDialogoConfirmacion = false }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)) { Text("ELIMINAR") }
                },
                dismissButton = { TextButton(onClick = { mostrarDialogoConfirmacion = false }) { Text("Cancelar") } }
            )
        }
    }
}

private fun generarQrBitmap(contenido: String): Bitmap {
    val writer = QRCodeWriter()
    val bitMatrix = writer.encode(contenido, BarcodeFormat.QR_CODE, 400, 400)
    val bitmap = Bitmap.createBitmap(400, 400, Bitmap.Config.RGB_565)
    for (x in 0 until 400) {
        for (y in 0 until 400) {
            bitmap.setPixel(x, y, if (bitMatrix[x, y]) AndroidColor.BLACK else AndroidColor.WHITE)
        }
    }
    return bitmap
}