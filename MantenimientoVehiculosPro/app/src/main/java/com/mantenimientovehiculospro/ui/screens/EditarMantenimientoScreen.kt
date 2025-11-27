package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.mantenimientovehiculospro.R
import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import com.mantenimientovehiculospro.ui.components.AppBackground
import com.mantenimientovehiculospro.ui.components.FechaSelector
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditarMantenimientoScreen(
    mantenimientoId: Long,
    onMantenimientoActualizado: (vehiculoId: Long) -> Unit,
    onCancelar: () -> Unit
) {
    val scope = rememberCoroutineScope()

    var mantenimiento by remember { mutableStateOf<Mantenimiento?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var cargando by remember { mutableStateOf(true) }

    var tipo by remember { mutableStateOf("") }
    var descripcion by remember { mutableStateOf("") }
    var fechaISO by remember { mutableStateOf<String?>(null) }
    var kilometrajeTexto by remember { mutableStateOf("") }

    val tiposMantencion = listOf(
        "Cambio de aceite", "Revisión de frenos", "Cambio de batería",
        "Revisión de neumáticos", "Cambio de bujías", "Revisión de suspensión",
        "Cambio de filtro de aire", "Limpieza de inyectores"
    )

    var expanded by remember { mutableStateOf(false) }

    LaunchedEffect(mantenimientoId) {
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
        } finally {
            cargando = false
        }
    }

    AppBackground(backgroundImageResId = R.drawable.motor) {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = { Text("Editar Mantenimiento") },
                    navigationIcon = {
                        IconButton(onClick = onCancelar) {
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
            if (cargando) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
                return@Scaffold
            }
            if (error != null) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text(error!!, color = MaterialTheme.colorScheme.error) }
                return@Scaffold
            }

            Column(
                modifier = Modifier.padding(paddingValues).padding(16.dp)
            ) {
                val textFieldColors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                    focusedLabelColor = MaterialTheme.colorScheme.primary,
                    unfocusedLabelColor = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
                    cursorColor = MaterialTheme.colorScheme.primary,
                    focusedTextColor = MaterialTheme.colorScheme.onBackground,
                    unfocusedTextColor = MaterialTheme.colorScheme.onBackground
                )

                ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                    OutlinedTextField(
                        value = tipo,
                        onValueChange = { },
                        readOnly = true,
                        label = { Text("Tipo de mantenimiento") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        colors = textFieldColors,
                        modifier = Modifier.fillMaxWidth().menuAnchor()
                    )
                    ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                        tiposMantencion.forEach { opcion ->
                            DropdownMenuItem(text = { Text(opcion) }, onClick = { tipo = opcion; expanded = false })
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(value = descripcion, onValueChange = { descripcion = it }, label = { Text("Descripción") }, colors = textFieldColors, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(16.dp))

                FechaSelector(fechaSeleccionada = fechaISO ?: "", onFechaSeleccionada = { fechaISO = it })
                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(value = kilometrajeTexto, onValueChange = { kilometrajeTexto = it }, label = { Text("Kilometraje") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), colors = textFieldColors, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(24.dp))

                Button(onClick = {
                    val kilometraje = kilometrajeTexto.toIntOrNull()
                    if (tipo.isBlank() || descripcion.isBlank() || fechaISO.isNullOrBlank() || kilometraje == null) {
                        error = "Completa todos los campos correctamente."
                        return@Button
                    }

                    val actualizado = mantenimiento!!.copy(tipo = tipo, descripcion = descripcion, fecha = fechaISO, kilometraje = kilometraje)

                    scope.launch {
                        try {
                            RetrofitProvider.instance.actualizarMantenimiento(mantenimientoId, actualizado)
                            onMantenimientoActualizado(actualizado.vehiculoId)
                        } catch (e: Exception) {
                            error = "Error al actualizar: ${e.message}"
                        }
                    }
                }) {
                    Text("Guardar cambios")
                }
            }
        }
    }
}