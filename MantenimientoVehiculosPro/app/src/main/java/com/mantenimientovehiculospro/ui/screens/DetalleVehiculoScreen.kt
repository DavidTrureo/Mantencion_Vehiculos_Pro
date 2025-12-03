


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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
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

// Esta es la pantalla que muestra todos los detalles de un solo vehículo.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DetalleVehiculoScreen(
    vehiculoId: Long,
    onBack: () -> Unit,
    // Funciones que me vienen del navegador para ir a otras pantallas.
    onEditar: (Long) -> Unit,
    onAgregarMantenimiento: (Long) -> Unit,
    onEditarMantenimiento: (Long) -> Unit,
    onEliminarMantenimiento: suspend (Long) -> Boolean
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope() // Para las llamadas a la API.

    // --- Estados para guardar los datos de la pantalla ---
    var vehiculo by remember { mutableStateOf<Vehiculo?>(null) }
    var mantenimientos by remember { mutableStateOf<List<Mantenimiento>>(emptyList()) }
    var error by remember { mutableStateOf<String?>(null) }
    var cargando by remember { mutableStateOf(true) }
    var refrescar by remember { mutableStateOf(false) } // Un "truco" para forzar la recarga de datos.
    var tipoExpandido by remember { mutableStateOf<String?>(null) } // Para saber qué grupo de mantenimiento está abierto.

    // Estados para los diálogos de confirmación.
    var mostrarDialogoEliminarVehiculo by remember { mutableStateOf(false) }
    var mantenimientoAEliminar by remember { mutableStateOf<Mantenimiento?>(null) }


    // Función que pide todos los datos del vehículo y sus mantenimientos a la API.
    fun cargarDatos() {
        scope.launch {
            cargando = true
            try {
                // Primero busco el ID del usuario que está usando la app.
                val usuarioId = UsuarioPreferences.obtenerUsuarioId(context)
                    ?: throw Exception("No se encontró el usuario. Inicia sesión de nuevo.")

                // Pido los datos del vehículo.
                // Ojo: Aquí pido la lista completa y luego busco. Podría ser más eficiente
                // si la API me diera un vehículo por su ID directamente.
                vehiculo = RetrofitProvider.instance.obtenerVehiculos(usuarioId).find { it.id == vehiculoId }

                // Si encontré el vehículo, pido su historial de mantenimientos.
                if (vehiculo != null) {
                    mantenimientos = RetrofitProvider.instance.obtenerMantenimientos(vehiculoId)
                } else {
                    error = "No se encontró el vehículo."
                }
            } catch (e: Exception) {
                error = "Error al cargar los datos: ${e.message}"
            } finally {
                cargando = false
                refrescar = false // Reseteo la bandera de refresco.
            }
        }
    }

    // Este LaunchedEffect se ejecuta cuando la pantalla carga o cuando 'refrescar' cambia a true.
    LaunchedEffect(vehiculoId, refrescar) {
        cargarDatos()
    }

    // Función que se llama cuando confirmo que quiero borrar un MANTENIMIENTO.
    fun onConfirmarEliminarMantenimiento() {
        mantenimientoAEliminar?.let { mant ->
            scope.launch {
                try {
                    val response = RetrofitProvider.instance.eliminarMantenimiento(mant.id!!)
                    if (response.isSuccessful) {
                        // Si se borró bien, pongo 'refrescar' en true para que el LaunchedEffect
                        // de arriba vuelva a cargar todos los datos.
                        refrescar = true
                    } else {
                        error = "Error al eliminar: ${response.code()}"
                    }
                } catch (e: Exception) {
                    error = "Falló la conexión al eliminar: ${e.message}"
                } finally {
                    mantenimientoAEliminar = null // Cierro el diálogo.
                }
            }
        }
    }

    // Mi fondo personalizado para la pantalla.
    AppBackground(backgroundImageResId = R.drawable.auto4) {
        Scaffold(
            containerColor = Color.Transparent, // Fondo transparente para que se vea la imagen.
            topBar = {
                TopAppBar(
                    title = { Text("Detalle del Vehículo") },
                    navigationIcon = {
                        IconButton(onClick = onBack) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f))
                )
            }
        ) { paddingValues ->
            // Uso LazyColumn porque el historial de mantenimientos puede ser muy largo.
            LazyColumn(
                modifier = Modifier
                    .padding(paddingValues)
                    .fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (cargando) {
                    item { Box(modifier = Modifier.fillParentMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() } }
                } else if (error != null) {
                    item { Box(modifier = Modifier.fillParentMaxSize(), contentAlignment = Alignment.Center) { Text(error!!, color = MaterialTheme.colorScheme.error) } }
                } else if (vehiculo != null) {
                    // --- Sección de Datos del Vehículo ---
                    item {
                        Text("${vehiculo!!.marca} ${vehiculo!!.modelo}", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onBackground)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Año: ${vehiculo!!.anio}", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f))
                        Text("Kilometraje: ${vehiculo!!.kilometraje} km", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f))
                    }

                    // --- Sección del Código QR ---
                    item {
                        vehiculo!!.qrCode?.let {
                            val qrBitmap = generarQrBitmap(it)
                            Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                                Image(bitmap = qrBitmap.asImageBitmap(), contentDescription = "Código QR", modifier = Modifier
                                    .size(200.dp)
                                    .padding(8.dp))
                            }
                        } ?: Text("Este vehículo no tiene un QR asignado.", color = MaterialTheme.colorScheme.onBackground)
                    }

                    // --- Sección de Botones de Acción ---
                    item {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Button(onClick = { onAgregarMantenimiento(vehiculoId) }, modifier = Modifier.fillMaxWidth()) { Text("AGREGAR MANTENIMIENTO") }
                            OutlinedButton(onClick = { onEditar(vehiculoId) }, modifier = Modifier.fillMaxWidth()) { Text("EDITAR VEHÍCULO") }
                            OutlinedButton(
                                onClick = { mostrarDialogoEliminarVehiculo = true },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
                            ) { Text("ELIMINAR VEHÍCULO") }
                        }
                    }

                    // --- Sección del Historial de Mantenimientos ---
                    item {
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Historial de Mantenimientos", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.onBackground)
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    if (mantenimientos.isEmpty()) {
                        item { Text("Todavía no hay mantenimientos registrados.", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)) }
                    } else {
                        // Agrupo los mantenimientos por su tipo (ej: todos los "cambio de aceite" juntos).
                        val agrupadosPorTipo = mantenimientos.groupBy { it.tipo.trim().lowercase() }

                        // Creo una tarjeta para cada grupo.
                        items(agrupadosPorTipo.entries.toList(), key = { it.key }) { entry ->
                            val tipo = entry.key
                            // Ordeno la lista de cada grupo para mostrar primero el más reciente (más km).
                            val listaOrdenada = entry.value.sortedByDescending { it.kilometraje }
                            val estaExpandido = tipoExpandido == tipo

                            Card(
                                // La tarjeta es clickeable para expandir o contraer el grupo.
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { tipoExpandido = if (estaExpandido) null else tipo },
                                shape = MaterialTheme.shapes.medium,
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.7f)),
                                colors = CardDefaults.cardColors(containerColor = Color.Transparent)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    val titulo = "${tipo.replaceFirstChar { it.uppercase() }}" + if (listaOrdenada.size > 1) " (${listaOrdenada.size})" else ""
                                    Text(titulo, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)

                                    // Muestro el primer mantenimiento del grupo (el más reciente).
                                    MantenimientoItem(
                                        mantenimiento = listaOrdenada.first(),
                                        onEditarMantenimiento = onEditarMantenimiento,
                                        onEliminarClick = { mantenimientoAEliminar = listaOrdenada.first() }
                                    )

                                    // Si el grupo está expandido y hay más de un mantenimiento, muestro los demás.
                                    if (estaExpandido && listaOrdenada.size > 1) {
                                        Divider(modifier = Modifier.padding(
                                            vertical = 8.dp
                                        ), color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.3f))
                                        listaOrdenada.drop(1).forEach { mantenimiento ->
                                            MantenimientoItem( // Reutilizo el mismo Composable.
                                                mantenimiento = mantenimiento,
                                                onEditarMantenimiento = onEditarMantenimiento,
                                                onEliminarClick = { mantenimientoAEliminar = mantenimiento },
                                                isSubItem = true // Le digo que es un sub-item para que se vea un poco más pequeño.
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

        // --- Diálogo para eliminar el VEHÍCULO completo ---
        if (mostrarDialogoEliminarVehiculo) {
            AlertDialog(
                onDismissRequest = { mostrarDialogoEliminarVehiculo = false },
                title = { Text("¿Eliminar vehículo?") },
                text = { Text("Esta acción no se puede deshacer y borrará todo su historial.") },
                confirmButton = {
                    Button(onClick = {
                        scope.launch { try { RetrofitProvider.instance.eliminarVehiculo(vehiculoId); onBack() } catch (e: Exception) { error = "Error: ${e.message}" } }
                        mostrarDialogoEliminarVehiculo = false
                    }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)) { Text("ELIMINAR") }
                },
                dismissButton = { TextButton(onClick = { mostrarDialogoEliminarVehiculo = false }) { Text("Cancelar") } }
            )
        }

        // --- Diálogo para eliminar solo un MANTENIMIENTO ---
        if (mantenimientoAEliminar != null) {
            AlertDialog(
                onDismissRequest = { mantenimientoAEliminar = null },
                title = { Text("¿Eliminar mantenimiento?") },
                text = { Text("Esta acción no se puede deshacer.") },
                confirmButton = {
                    Button(
                        onClick = { onConfirmarEliminarMantenimiento() },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                    ) { Text("ELIMINAR") }
                },
                dismissButton = { TextButton(onClick = { mantenimientoAEliminar = null }) { Text("Cancelar") } }
            )
        }
    }
}

// Un pequeño Composable que creé para no repetir el código que muestra cada mantenimiento.
@Composable
private fun MantenimientoItem(
    mantenimiento: Mantenimiento,
    onEditarMantenimiento: (Long) -> Unit,
    onEliminarClick: () -> Unit,
    isSubItem: Boolean = false // Para darle un estilo diferente si es un item expandido.
) {
    val textStyle = if (isSubItem) MaterialTheme.typography.bodySmall else MaterialTheme.typography.bodyMedium
    val textColor = if (isSubItem) MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f) else MaterialTheme.colorScheme.onBackground.copy(alpha = 0.8f)

    Column(modifier = Modifier.padding(top = if (isSubItem) 8.dp else 0.dp)) {
        Text("Fecha: ${mantenimiento.fecha?.formatearFechaVisual() ?: "N/A"}", style = textStyle, color = textColor)
        Text("Kilometraje: ${mantenimiento.kilometraje} km", style = textStyle, color = textColor)
        Text("Descripción: ${mantenimiento.descripcion ?: "-"}", style = textStyle, color = textColor)

        // Los botones de Editar y Eliminar para este mantenimiento.
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
            TextButton(onClick = { mantenimiento.id?.let { onEditarMantenimiento(it) } }) { Text("Editar") }
            TextButton(onClick = onEliminarClick) { Text("Eliminar", color = MaterialTheme.colorScheme.error) }
        }
    }
}

// Función que genera el Bitmap del código QR a partir de un texto.
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
