package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mantenimientovehiculospro.data.model.EstadoMantenimiento
import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import com.mantenimientovehiculospro.ui.components.FechaSelector
import com.mantenimientovehiculospro.util.formatearFechaVisual
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CrearMantenimientoScreen(
    vehiculoId: Long,
    onMantenimientoGuardado: () -> Unit,
    onCancelar: () -> Unit
) {
    val scope = rememberCoroutineScope()

    val tiposMantencion = listOf(
        "Cambio de aceite",
        "Revisión de frenos",
        "Cambio de batería",
        "Revisión de neumáticos",
        "Cambio de bujías",
        "Revisión de suspensión",
        "Cambio de filtro de aire",
        "Limpieza de inyectores"
    )

    var tipo by remember { mutableStateOf("") }
    var descripcion by remember { mutableStateOf("") }
    var fechaISO by remember { mutableStateOf("") }
    var kilometrajeTexto by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var expanded by remember { mutableStateOf(false) }

    var historial by remember { mutableStateOf<List<Mantenimiento>>(emptyList()) }
    var ultimaMantencion by remember { mutableStateOf<Mantenimiento?>(null) }
    var tipoSeleccionadoSinHistorial by remember { mutableStateOf(false) }

    LaunchedEffect(vehiculoId) {
        scope.launch {
            try {
                historial = RetrofitProvider.instance.obtenerMantenimientos(vehiculoId)
            } catch (_: Exception) {
                // Silenciar error
            }
        }
    }

    LaunchedEffect(tipo, historial) {
        val filtradas = historial.filter { it.tipo == tipo }
        ultimaMantencion = filtradas.maxByOrNull { it.kilometraje }
        tipoSeleccionadoSinHistorial = tipo.isNotBlank() && filtradas.isEmpty()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Nuevo Mantenimiento") },
                navigationIcon = {
                    IconButton(onClick = onCancelar) {
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
            // Tipo de mantenimiento
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = !expanded }
            ) {
                OutlinedTextField(
                    value = tipo,
                    onValueChange = { tipo = it },
                    readOnly = true,
                    label = { Text("Tipo de mantenimiento") },
                    placeholder = { Text("Selecciona una opción") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .menuAnchor()
                )
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    tiposMantencion.forEach { opcion ->
                        DropdownMenuItem(
                            text = { Text(opcion) },
                            onClick = {
                                tipo = opcion
                                expanded = false
                            }
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Historial
            val mantenimientoPrevio = ultimaMantencion
            if (mantenimientoPrevio != null) {
                val fechaFormateada = mantenimientoPrevio.fecha?.formatearFechaVisual() ?: "Sin fecha"
                Text(
                    text = "Última mantención de \"$tipo\": $fechaFormateada a los ${mantenimientoPrevio.kilometraje} km",
                    style = MaterialTheme.typography.bodySmall
                )
            } else if (tipoSeleccionadoSinHistorial) {
                Text(
                    text = "No hay registros previos de este mantenimiento.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.outline
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Descripción
            OutlinedTextField(
                value = descripcion,
                onValueChange = { descripcion = it },
                label = { Text("Descripción") },
                placeholder = { Text("Describe qué se hizo o se revisó") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Fecha
            Box(modifier = Modifier.fillMaxWidth()) {
                FechaSelector(
                    fechaSeleccionada = fechaISO,
                    onFechaSeleccionada = { fechaISO = it }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Kilometraje
            OutlinedTextField(
                value = kilometrajeTexto,
                onValueChange = { kilometrajeTexto = it },
                label = { Text("Kilometraje") },
                placeholder = { Text("Ej: 50000") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Botón Guardar
            Button(onClick = {
                val kilometraje = kilometrajeTexto.toIntOrNull()
                if (tipo.isBlank() || descripcion.isBlank() || fechaISO.isBlank() || kilometraje == null) {
                    error = "Completa todos los campos correctamente."
                    return@Button
                }

                val fechaSeleccionada = try {
                    LocalDate.parse(fechaISO, DateTimeFormatter.ISO_DATE)
                } catch (e: Exception) {
                    null
                }

                if (fechaSeleccionada == null || fechaSeleccionada.isAfter(LocalDate.now())) {
                    error = "La fecha debe ser actual o pasada. No se permiten fechas futuras."
                    return@Button
                }

                val mantenimientoPrevio = ultimaMantencion
                if (mantenimientoPrevio != null && kilometraje < mantenimientoPrevio.kilometraje) {
                    error = "El kilometraje debe ser mayor o igual al de la última mantención (${mantenimientoPrevio.kilometraje} km)."
                    return@Button
                }

                val mantenimiento = Mantenimiento(
                    id = null,
                    tipo = tipo,
                    descripcion = descripcion,
                    fecha = fechaISO,
                    kilometraje = kilometraje,
                    estado = EstadoMantenimiento.PROXIMO,
                    vehiculoId = vehiculoId
                )

                scope.launch {
                    try {
                        RetrofitProvider.instance.crearMantenimiento(vehiculoId, mantenimiento)
                        onMantenimientoGuardado()
                    } catch (e: Exception) {
                        error = "Error al guardar mantenimiento: ${e.message}"
                    }
                }
            }) {
                Text("Guardar")
            }

            error?.let {
                Spacer(modifier = Modifier.height(16.dp))
                Text(it, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}