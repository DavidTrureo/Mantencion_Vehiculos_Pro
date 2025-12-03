package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.mantenimientovehiculospro.R
import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import com.mantenimientovehiculospro.ui.components.AppBackground
import com.mantenimientovehiculospro.ui.components.FechaSelector
import kotlinx.coroutines.launch

// Esta es la pantalla del formulario para EDITAR un mantenimiento que ya existe.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditarMantenimientoScreen(
    // El ID del mantenimiento que quiero editar. Me lo pasan desde la pantalla anterior.
    mantenimientoId: Long,
    // La función para volver a la pantalla de detalles cuando guarde los cambios.
    onMantenimientoActualizado: (vehiculoId: Long) -> Unit,
    // La función para volver si presiono "cancelar" o la flecha de atrás.
    onCancelar: () -> Unit
) {
    val scope = rememberCoroutineScope() // Para llamar a la API.

    // --- Estados para guardar los datos de la pantalla ---
    var mantenimiento by remember { mutableStateOf<Mantenimiento?>(null) } // El objeto original que cargo de la API.
    var error by remember { mutableStateOf<String?>(null) }
    var cargando by remember { mutableStateOf(true) }

    // Estados para cada campo del formulario. Los inicializo vacíos.
    var tipo by remember { mutableStateOf("") }
    var descripcion by remember { mutableStateOf("") }
    var fechaISO by remember { mutableStateOf<String?>(null) }
    var kilometrajeTexto by remember { mutableStateOf("") }

    // La lista de tipos de mantenimiento para el menú desplegable.
    val tiposMantencion = listOf(
        "Cambio de aceite", "Revisión de frenos", "Cambio de batería",
        "Revisión de neumáticos", "Cambio de bujías", "Revisión de suspensión",
        "Cambio de filtro de aire", "Limpieza de inyectores"
    )

    var expanded by remember { mutableStateOf(false) } // Para el menú desplegable.

    // Este LaunchedEffect se ejecuta una sola vez al entrar en la pantalla.
    // Su trabajo es pedirle a la API los datos del mantenimiento que voy a editar.
    LaunchedEffect(mantenimientoId) {
        try {
            // Pido el mantenimiento usando su ID.
            mantenimiento = RetrofitProvider.instance.obtenerMantenimientoPorId(mantenimientoId)
            // Si la API me devuelve los datos...
            mantenimiento?.let {
                // ...relleno los campos del formulario con esa información.
                tipo = it.tipo
                descripcion = it.descripcion
                fechaISO = it.fecha
                kilometrajeTexto = it.kilometraje.toString()
            }
        } catch (e: Exception) {
            error = "Error al cargar los datos: ${e.message}"
        } finally {
            cargando = false // Dejo de mostrar el circulito de "cargando".
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
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f))
                )
            }
        ) { paddingValues ->
            // Muestro un circulito mientras cargo los datos.
            if (cargando) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
                return@Scaffold // Me salgo para no mostrar el formulario vacío.
            }
            // Si hubo un error al cargar, muestro el mensaje.
            if (error != null) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text(error!!, color = MaterialTheme.colorScheme.error) }
                return@Scaffold
            }

            // Si ya cargué los datos y no hubo error, muestro el formulario.
            Column(
                modifier = Modifier.padding(paddingValues).padding(16.dp)
            ) {
                // Aquí defino un estilo de colores para los campos de texto.
                // Podría haberlo puesto en el tema de la app para reutilizarlo mejor.
                val textFieldColors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                    focusedLabelColor = MaterialTheme.colorScheme.primary,
                    unfocusedLabelColor = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
                    cursorColor = MaterialTheme.colorScheme.primary,
                    focusedTextColor = MaterialTheme.colorScheme.onBackground,
                    unfocusedTextColor = MaterialTheme.colorScheme.onBackground
                )

                // --- Campos del formulario ---
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

                // El botón para guardar los cambios.
                Button(onClick = {
                    val kilometraje = kilometrajeTexto.toIntOrNull()
                    // Valido que todos los campos estén llenos.
                    if (tipo.isBlank() || descripcion.isBlank() || fechaISO.isNullOrBlank() || kilometraje == null) {
                        error = "Completa todos los campos correctamente."
                        return@Button
                    }

                    // Creo una copia del mantenimiento original, pero con los datos nuevos del formulario.
                    val actualizado = mantenimiento!!.copy(tipo = tipo, descripcion = descripcion, fecha = fechaISO, kilometraje = kilometraje)

                    scope.launch {
                        try {
                            // Llamo a la API para actualizar el mantenimiento.
                            RetrofitProvider.instance.actualizarMantenimiento(mantenimientoId, actualizado)
                            // Si todo sale bien, aviso a la pantalla anterior para que vuelva.
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
