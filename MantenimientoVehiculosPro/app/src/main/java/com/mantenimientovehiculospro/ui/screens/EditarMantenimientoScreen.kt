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

    // Estado que guarda el mantenimiento cargado desde el backend
    var mantenimiento by remember { mutableStateOf<Mantenimiento?>(null) }
    var error by remember { mutableStateOf<String?>(null) }

    // Estados que representan los campos editables del formulario
    var tipo by remember { mutableStateOf("") }
    var descripcion by remember { mutableStateOf("") }
    var fechaISO by remember { mutableStateOf<String?>(null) }
    var kilometrajeTexto by remember { mutableStateOf("") }

    // Lista de tipos de mantención disponibles
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

    // Al entrar en la pantalla, cargo el mantenimiento desde el backend
    LaunchedEffect(mantenimientoId) {
        scope.launch {
            try {
                mantenimiento = RetrofitProvider.instance.obtenerMantenimientoPorId(mantenimientoId)
                mantenimiento?.let {
                    // Inicializo los campos con los valores actuales
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
                    // Botón para volver atrás
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
            // Si aún no se carga el mantenimiento, muestro loading o error
            if (mantenimiento == null) {
                if (error != null) {
                    Text(error!!, color = MaterialTheme.colorScheme.error)
                } else {
                    CircularProgressIndicator()
                }
                return@Column
            }

            // Selector de tipo de mantenimiento
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

            // Campo de descripción
            OutlinedTextField(
                value = descripcion,
                onValueChange = { descripcion = it },
                label = { Text("Descripción") },
                placeholder = { Text("Describe qué se hizo o se revisó") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Selector de fecha
            Box(modifier = Modifier.fillMaxWidth()) {
                FechaSelector(
                    fechaSeleccionada = fechaISO ?: "",
                    onFechaSeleccionada = { fechaISO = it }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Campo de kilometraje
            OutlinedTextField(
                value = kilometrajeTexto,
                onValueChange = { kilometrajeTexto = it },
                label = { Text("Kilometraje") },
                placeholder = { Text("Ej: 50000") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Botón para guardar cambios
            Button(onClick = {
                val kilometraje = kilometrajeTexto.toIntOrNull()
                if (tipo.isBlank() || descripcion.isBlank() || fechaISO.isNullOrBlank() || kilometraje == null) {
                    error = "Completa todos los campos correctamente."
                    return@Button
                }

                // Creo una copia del mantenimiento con los nuevos valores
                val actualizado = mantenimiento!!.copy(
                    tipo = tipo,
                    descripcion = descripcion,
                    fecha = fechaISO,
                    kilometraje = kilometraje
                )

                // Llamo al backend para actualizar
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

            // Muestro errores si existen
            error?.let {
                Spacer(modifier = Modifier.height(16.dp))
                Text(it, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}