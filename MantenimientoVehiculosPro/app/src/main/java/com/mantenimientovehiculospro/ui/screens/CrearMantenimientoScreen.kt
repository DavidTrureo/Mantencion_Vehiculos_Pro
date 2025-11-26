package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
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

    // Estados del formulario
    var tipo by remember { mutableStateOf("") }
    var descripcion by remember { mutableStateOf("") }
    var fechaISO by remember { mutableStateOf("") }
    var kilometrajeTexto by remember { mutableStateOf("") }
    var errorGeneral by remember { mutableStateOf<String?>(null) }
    var expanded by remember { mutableStateOf(false) }

    // Historial y validación
    var historial by remember { mutableStateOf<List<Mantenimiento>>(emptyList()) }
    var ultimaMantencion by remember { mutableStateOf<Mantenimiento?>(null) }
    var tipoSeleccionadoSinHistorial by remember { mutableStateOf(false) }

    // ✅ Estado de error específico para el kilometraje
    var kilometrajeError by remember { mutableStateOf<String?>(null) }

    // Carga inicial del historial
    LaunchedEffect(vehiculoId) {
        try {
            historial = RetrofitProvider.instance.obtenerMantenimientos(vehiculoId)
        } catch (e: Exception) {
            errorGeneral = "No se pudo cargar el historial."
        }
    }

    // Reacciona a cambios en el tipo de mantenimiento
    LaunchedEffect(tipo, historial) {
        val filtradas = historial.filter { it.tipo == tipo }
        ultimaMantencion = filtradas.maxByOrNull { it.kilometraje }
        tipoSeleccionadoSinHistorial = tipo.isNotBlank() && filtradas.isEmpty()
    }

    // ✅ Validación en tiempo real del kilometraje
    LaunchedEffect(kilometrajeTexto, ultimaMantencion) {
        val kilometraje = kilometrajeTexto.toIntOrNull()
        val mantenimientoPrevio = ultimaMantencion

        if (kilometrajeTexto.isNotBlank() && kilometraje == null) {
            kilometrajeError = "Debe ser un número."
        } else if (mantenimientoPrevio != null && kilometraje != null && kilometraje < mantenimientoPrevio.kilometraje) {
            kilometrajeError = "Debe ser mayor o igual a ${mantenimientoPrevio.kilometraje} km"
        } else {
            kilometrajeError = null // Sin error
        }
    }

    // ✅ Determina si el formulario es válido para habilitar el botón Guardar
    val isFormValid = tipo.isNotBlank() &&
            descripcion.isNotBlank() &&
            fechaISO.isNotBlank() &&
            kilometrajeTexto.isNotBlank() &&
            kilometrajeError == null

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
                    modifier = Modifier.fillMaxWidth().menuAnchor()
                )
                ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                    tiposMantencion.forEach { opcion ->
                        DropdownMenuItem(
                            text = { Text(opcion) },
                            onClick = { tipo = opcion; expanded = false }
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(16.dp))

            val mantenimientoPrevio = ultimaMantencion
            if (mantenimientoPrevio != null) {
                val fechaFormateada = mantenimientoPrevio.fecha?.formatearFechaVisual() ?: "Sin fecha"
                Text("Última vez: $fechaFormateada a los ${mantenimientoPrevio.kilometraje} km", style = MaterialTheme.typography.bodySmall)
            } else if (tipoSeleccionadoSinHistorial) {
                Text("No hay registros previos de este mantenimiento.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline)
            }
            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = descripcion,
                onValueChange = { descripcion = it },
                label = { Text("Descripción") },
                placeholder = { Text("Ej: Aceite Castrol 5W-30") },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(16.dp))

            Box(modifier = Modifier.fillMaxWidth()) {
                FechaSelector(fechaSeleccionada = fechaISO, onFechaSeleccionada = { fechaISO = it })
            }
            Spacer(modifier = Modifier.height(16.dp))

            // ✅ Campo de kilometraje con validación visual
            OutlinedTextField(
                value = kilometrajeTexto,
                onValueChange = { kilometrajeTexto = it },
                label = { Text("Kilometraje") },
                placeholder = { Text("Ej: 50000") },
                modifier = Modifier.fillMaxWidth(),
                isError = kilometrajeError != null, // Marca el campo en rojo si hay error
                supportingText = { // Muestra el mensaje de error debajo del campo
                    if (kilometrajeError != null) {
                        Text(kilometrajeError!!, color = MaterialTheme.colorScheme.error)
                    }
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number) // Muestra el teclado numérico
            )
            Spacer(modifier = Modifier.height(24.dp))

            // ✅ Botón que se habilita/deshabilita según la validez del formulario
            Button(
                onClick = {
                    val kilometraje = kilometrajeTexto.toInt() // Seguro porque isFormValid es true

                    val fechaSeleccionada = LocalDate.parse(fechaISO, DateTimeFormatter.ISO_DATE)
                    if (fechaSeleccionada.isAfter(LocalDate.now())) {
                        errorGeneral = "La fecha no puede ser futura."
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
                            errorGeneral = "Error al guardar: ${e.message}"
                        }
                    }
                },
                enabled = isFormValid // El botón se habilita solo si el formulario es válido
            ) {
                Text("Guardar")
            }

            errorGeneral?.let {
                Spacer(modifier = Modifier.height(16.dp))
                Text(it, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}