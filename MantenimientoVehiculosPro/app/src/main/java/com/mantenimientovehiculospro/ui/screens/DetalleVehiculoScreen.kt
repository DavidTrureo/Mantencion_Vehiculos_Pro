package com.mantenimientovehiculospro.ui.screens

import android.graphics.Bitmap
import android.graphics.Color
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
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.model.Vehiculo
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import com.mantenimientovehiculospro.ui.components.BotonAccion
import com.mantenimientovehiculospro.ui.theme.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

fun String.formatearFechaVisual(): String {
    return try {
        val original = LocalDate.parse(this, DateTimeFormatter.ofPattern("yyyy-MM-dd"))
        original.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"))
    } catch (e: Exception) {
        this
    }
}

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
        when {
            cargando -> Box(
                modifier = Modifier.fillMaxSize().padding(paddingValues),
                contentAlignment = Alignment.Center
            ) { CircularProgressIndicator() }

            error != null -> Column(
                modifier = Modifier.fillMaxSize().padding(paddingValues).padding(16.dp)
            ) { Text(error!!, color = MaterialTheme.colorScheme.error) }

            vehiculo != null -> LazyColumn(
                modifier = Modifier.padding(paddingValues).padding(16.dp).fillMaxSize()
            ) {
                item {
                    Text("Marca: ${vehiculo!!.marca}", style = MaterialTheme.typography.titleLarge)
                    Text("Modelo: ${vehiculo!!.modelo}", style = MaterialTheme.typography.bodyLarge)
                    Text("Año: ${vehiculo!!.anio}")
                    Text("Kilometraje: ${vehiculo!!.kilometraje} km")

                    Spacer(modifier = Modifier.height(16.dp))

                    // ✅ Mostrar QR
                    Text("Código QR:", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(8.dp))
                    vehiculo!!.qrCode?.let { contenido ->
                        val qrBitmap = generarQrBitmap(contenido)
                        Image(
                            bitmap = qrBitmap.asImageBitmap(),
                            contentDescription = "Código QR del vehículo",
                            modifier = Modifier.size(200.dp)
                        )
                    } ?: Text("Este vehículo no tiene QR asignado")

                    Spacer(modifier = Modifier.height(16.dp))

                    BotonAccion(
                        texto = "Editar Vehículo",
                        colorFondo = WarningYellow,
                        onClick = { onEditar(vehiculoId) },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    BotonAccion(
                        texto = "Agregar Mantenimiento",
                        colorFondo = InfoBlue,
                        onClick = { onAgregarMantenimiento(vehiculoId) },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    BotonAccion(
                        texto = "Eliminar Vehículo",
                        colorFondo = ErrorRed,
                        onClick = { mostrarDialogoConfirmacion = true },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(24.dp))
                    Text("Mantenimientos registrados:", style = MaterialTheme.typography.titleMedium)
                }

                // Lista de mantenimientos agrupados
                if (mantenimientos.isEmpty()) {
                    item {
                        Text(
                            text = "No hay mantenimientos registrados.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.outline
                        )
                    }
                } else {
                    val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
                    val agrupadasPorTipo = mantenimientos.groupBy { it.tipo.trim().lowercase() }
                        .mapValues { (_, lista) ->
                            lista.sortedByDescending {
                                try { LocalDate.parse(it.fecha ?: "", formatter) }
                                catch (e: Exception) { LocalDate.MIN }
                            }
                        }

                    items(agrupadasPorTipo.entries.toList()) { entry ->
                        val tipo = entry.key
                        val listaOrdenada = entry.value
                        val ultima = listaOrdenada.firstOrNull()
                        val restantes = listaOrdenada.drop(1)
                        val cantidad = listaOrdenada.size
                        val tipoFormateado = tipo.replaceFirstChar { it.uppercase() }

                        Card(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp).clickable {
                                tipoExpandido = if (tipoExpandido == tipo) null else tipo
                            },
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Tipo: $tipoFormateado${if (cantidad > 1) " ($cantidad)" else ""}",
                                    style = MaterialTheme.typography.titleMedium)
                                Text("Fecha: ${ultima?.fecha?.formatearFechaVisual() ?: "Sin fecha"}")
                                Text("Kilometraje: ${ultima?.kilometraje} km")
                                Text("Descripción: ${ultima?.descripcion ?: "-"}")

                                Spacer(modifier = Modifier.height(8.dp))

                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                                    TextButton(onClick = { ultima?.id?.let { onEditarMantenimiento(it) } }) {
                                        Text("Editar")
                                    }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    TextButton(onClick = {
                                        ultima?.id?.let { id ->
                                            scope.launch {
                                                val eliminado = onEliminarMantenimiento(id)
                                                if (eliminado) refrescar = true
                                                else error = "No se pudo eliminar el mantenimiento"
                                            }
                                        }
                                    }) {
                                        Text("Eliminar", color = MaterialTheme.colorScheme.error)
                                    }
                                }

                                if (tipoExpandido == tipo && restantes.isNotEmpty()) {
                                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                                    restantes.forEach { mantenimiento ->
                                        Column(modifier = Modifier.padding(vertical = 4.dp)) {
                                            Text("Fecha: ${mantenimiento.fecha?.formatearFechaVisual() ?: "Sin fecha"}")
                                            Text("Kilometraje: ${mantenimiento.kilometraje} km")
                                            Text("Descripción: ${mantenimiento.descripcion ?: "-"}")
                                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                                                TextButton(onClick = { mantenimiento.id?.let { onEditarMantenimiento(it) } }) {
                                                    Text("Editar")
                                                }
                                                Spacer(modifier = Modifier.width(8.dp))
                                                TextButton(onClick = {
                                                    mantenimiento.id?.let { id ->
                                                        scope.launch {
                                                            val eliminado = onEliminarMantenimiento(id)
                                                            if (eliminado) refrescar = true
                                                            else error = "No se pudo eliminar el mantenimiento"
                                                        }
                                                    }
                                                }) {
                                                    Text("Eliminar", color = MaterialTheme.colorScheme.error)
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
        }

        // Diálogo de confirmación para eliminar vehículo
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
    }
}

// ✅ Función para generar el QR como Bitmap
private fun generarQrBitmap(contenido: String): Bitmap {
    val writer = QRCodeWriter()
    val bitMatrix = writer.encode(contenido, BarcodeFormat.QR_CODE, 400, 400)
    val bitmap = Bitmap.createBitmap(400, 400, Bitmap.Config.RGB_565)
    for (x in 0 until 400) {
        for (y in 0 until 400) {
            bitmap.setPixel(x, y, if (bitMatrix[x, y]) Color.BLACK else Color.WHITE)
        }
    }
    return bitmap
}