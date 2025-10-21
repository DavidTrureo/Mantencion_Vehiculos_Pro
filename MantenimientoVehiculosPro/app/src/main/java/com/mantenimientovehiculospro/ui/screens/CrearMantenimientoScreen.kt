package com.mantenimientovehiculospro.ui.screens

import android.app.DatePickerDialog
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.mantenimientovehiculospro.data.model.EstadoMantenimiento
import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CrearMantenimientoScreen(
    vehiculoId: Long,
    onMantenimientoGuardado: () -> Unit,
    onCancelar: () -> Unit
) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val calendar = Calendar.getInstance()

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
    var fechaVisual by remember { mutableStateOf("") }
    var fechaISO by remember { mutableStateOf("") }
    var kilometrajeTexto by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var expanded by remember { mutableStateOf(false) }

    var historial by remember { mutableStateOf<List<Mantenimiento>>(emptyList()) }
    var ultimaMantencion by remember { mutableStateOf<Mantenimiento?>(null) }
    var tipoSeleccionadoSinHistorial by remember { mutableStateOf(false) }

    val datePickerDialog = DatePickerDialog(
        context,
        { _, year, month, dayOfMonth ->
            calendar.set(year, month, dayOfMonth)
            val formatoVisual = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
            val formatoISO = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            fechaVisual = formatoVisual.format(calendar.time)
            fechaISO = formatoISO.format(calendar.time)
        },
        calendar.get(Calendar.YEAR),
        calendar.get(Calendar.MONTH),
        calendar.get(Calendar.DAY_OF_MONTH)
    )

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

            Spacer(modifier = Modifier.height(8.dp))

            when {
                ultimaMantencion != null -> {
                    Text(
                        text = "Última mantención de \"$tipo\": ${ultimaMantencion?.fecha ?: "Sin fecha"} a los ${ultimaMantencion?.kilometraje} km",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                tipoSeleccionadoSinHistorial -> {
                    Text(
                        text = "No hay registros previos de este mantenimiento.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.outline
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = descripcion,
                onValueChange = { descripcion = it },
                label = { Text("Descripción") },
                placeholder = { Text("Describe qué se hizo o se revisó") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = fechaVisual,
                onValueChange = { /* no editable manualmente */ },
                readOnly = true,
                label = { Text("Fecha") },
                placeholder = { Text("Selecciona una fecha") },
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { datePickerDialog.show() }
            )

            OutlinedTextField(
                value = kilometrajeTexto,
                onValueChange = { kilometrajeTexto = it },
                label = { Text("Kilometraje") },
                placeholder = { Text("Ej: 50000") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(24.dp))

            Button(onClick = {
                val kilometraje = kilometrajeTexto.toIntOrNull()
                if (tipo.isBlank() || descripcion.isBlank() || fechaISO.isBlank() || kilometraje == null) {
                    error = "Completa todos los campos correctamente."
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