package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.mantenimientovehiculospro.R
import com.mantenimientovehiculospro.data.model.EstadoMantenimiento
import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import com.mantenimientovehiculospro.ui.components.AppBackground
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
        "Cambio de aceite", "Revisión de frenos", "Cambio de batería",
        "Revisión de neumáticos", "Cambio de bujías", "Revisión de suspensión",
        "Cambio de filtro de aire", "Limpieza de inyectores"
    )

    var tipo by remember { mutableStateOf("") }
    var descripcion by remember { mutableStateOf("") }
    var fechaISO by remember { mutableStateOf("") }
    var kilometrajeTexto by remember { mutableStateOf("") }
    var errorGeneral by remember { mutableStateOf<String?>(null) }
    var expanded by remember { mutableStateOf(false) }
    var historial by remember { mutableStateOf<List<Mantenimiento>>(emptyList()) }
    var ultimaMantencion by remember { mutableStateOf<Mantenimiento?>(null) }
    var kilometrajeError by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(vehiculoId) {
        try {
            historial = RetrofitProvider.instance.obtenerMantenimientos(vehiculoId)
        } catch (e: Exception) {
            errorGeneral = "No se pudo cargar el historial."
        }
    }

    val tipoSeleccionadoSinHistorial = tipo.isNotBlank() && historial.none { it.tipo == tipo }

    LaunchedEffect(tipo, historial) {
        ultimaMantencion = historial.filter { it.tipo == tipo }.maxByOrNull { it.kilometraje }
    }

    LaunchedEffect(kilometrajeTexto, ultimaMantencion) {
        val kilometraje = kilometrajeTexto.toIntOrNull()
        val mantenimientoPrevio = ultimaMantencion
        kilometrajeError = when {
            kilometrajeTexto.isNotBlank() && kilometraje == null -> "Debe ser un número."
            mantenimientoPrevio != null && kilometraje != null && kilometraje < mantenimientoPrevio.kilometraje -> "Debe ser >= a ${mantenimientoPrevio.kilometraje} km"
            else -> null
        }
    }

    val isFormValid = tipo.isNotBlank() && descripcion.isNotBlank() && fechaISO.isNotBlank() && kilometrajeTexto.isNotBlank() && kilometrajeError == null

    AppBackground(backgroundImageResId = R.drawable.odometro0) {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = { Text("Nuevo Mantenimiento") },
                    navigationIcon = { IconButton(onClick = onCancelar) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Volver") } },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f),
                        titleContentColor = MaterialTheme.colorScheme.onSurface,
                        navigationIconContentColor = MaterialTheme.colorScheme.onSurface
                    )
                )
            }
        ) { paddingValues ->
            Column(modifier = Modifier.padding(paddingValues).padding(16.dp)) {

                ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                    OutlinedTextField(
                        value = tipo,
                        onValueChange = { },
                        readOnly = true,
                        label = { Text("Tipo de mantenimiento") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        // ✅ SIN COLORES PERSONALIZADOS PARA GARANTIZAR COMPILACIÓN
                        modifier = Modifier.fillMaxWidth().menuAnchor()
                    )
                    ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                        tiposMantencion.forEach { opcion ->
                            DropdownMenuItem(text = { Text(opcion) }, onClick = { tipo = opcion; expanded = false })
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))

                // ✅ CORREGIDO: Lógica del if/else para el texto de historial
                if (ultimaMantencion != null) {
                    Text("Última vez: ${ultimaMantencion!!.fecha?.formatearFechaVisual()} a los ${ultimaMantencion!!.kilometraje} km", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground)
                } else if (tipoSeleccionadoSinHistorial) {
                    Text("No hay registros previos de este mantenimiento.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f))
                }
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(value = descripcion, onValueChange = { descripcion = it }, label = { Text("Descripción") }, placeholder = { Text("Ej: Aceite Castrol 5W-30") }, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(16.dp))

                Box(modifier = Modifier.fillMaxWidth()) {
                    FechaSelector(fechaSeleccionada = fechaISO, onFechaSeleccionada = { fechaISO = it })
                }
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = kilometrajeTexto,
                    onValueChange = { kilometrajeTexto = it },
                    label = { Text("Kilometraje") },
                    placeholder = { Text("Ej: 50000") },
                    modifier = Modifier.fillMaxWidth(),
                    isError = kilometrajeError != null,
                    supportingText = { if (kilometrajeError != null) { Text(kilometrajeError!!, color = MaterialTheme.colorScheme.error) } },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )
                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        val kilometraje = kilometrajeTexto.toInt()
                        val fechaSeleccionada = LocalDate.parse(fechaISO, DateTimeFormatter.ISO_DATE)
                        if (fechaSeleccionada.isAfter(LocalDate.now())) {
                            errorGeneral = "La fecha no puede ser futura."
                            return@Button
                        }
                        val mantenimiento = Mantenimiento(id = null, tipo = tipo, descripcion = descripcion, fecha = fechaISO, kilometraje = kilometraje, estado = EstadoMantenimiento.PROXIMO, vehiculoId = vehiculoId)
                        scope.launch {
                            try {
                                RetrofitProvider.instance.crearMantenimiento(vehiculoId, mantenimiento)
                                onMantenimientoGuardado()
                            } catch (e: Exception) {
                                errorGeneral = "Error al guardar: ${e.message}"
                            }
                        }
                    },
                    enabled = isFormValid
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
}