package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import com.mantenimientovehiculospro.ui.components.FechaSelector
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditarMantenimientoScreen(
    mantenimientoId: Long,
    onMantenimientoActualizado: (vehiculoId: Long) -> Unit,
    onCancelar: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var mantenimiento by remember { mutableStateOf<Mantenimiento?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    var tipo by remember { mutableStateOf("") }
    var descripcion by remember { mutableStateOf("") }
    var fechaISO by remember { mutableStateOf<String?>(null) }
    var kilometrajeTexto by remember { mutableStateOf("") }

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

    var expanded by remember { mutableStateOf(false) }

    LaunchedEffect(mantenimientoId) {
        scope.launch {
            try {
                mantenimiento = RetrofitProvider.instance.obtenerMantenimientoPorId(mantenimientoId)
                mantenimiento?.let {
                    tipo = it.tipo
                    descripcion = it.descripcion
                    fechaISO = it.fecha
                    kilometrajeTexto = it.kilometraje.toString()
                }
            } catch (e: Exception) {
                error = "Error al cargar mantenimiento: ${e.message}"
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Editar Mantenimiento") },
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
            if (mantenimiento == null) {
                if (error != null) {
                    Text(error!!, color = MaterialTheme.colorScheme.error)
                } else {
                    CircularProgressIndicator()
                }
                return@Column
            }

            // Tipo
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
                    fechaSeleccionada = fechaISO ?: "",
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

            Button(onClick = {
                val kilometraje = kilometrajeTexto.toIntOrNull()
                if (tipo.isBlank() || descripcion.isBlank() || fechaISO.isNullOrBlank() || kilometraje == null) {
                    error = "Completa todos los campos correctamente."
                    return@Button
                }

                val actualizado = mantenimiento!!.copy(
                    tipo = tipo,
                    descripcion = descripcion,
                    fecha = fechaISO,
                    kilometraje = kilometraje
                )

                scope.launch {
                    try {
                        RetrofitProvider.instance.actualizarMantenimiento(mantenimientoId, actualizado)
                        onMantenimientoActualizado(actualizado.vehiculoId)
                    } catch (e: Exception) {
                        error = "Error al actualizar mantenimiento: ${e.message}"
                    }
                }
            }) {
                Text("Guardar cambios")
            }

            error?.let {
                Spacer(modifier = Modifier.height(16.dp))
                Text(it, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}