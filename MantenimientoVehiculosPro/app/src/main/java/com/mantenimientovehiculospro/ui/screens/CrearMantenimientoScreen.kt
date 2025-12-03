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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
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

// Esta es la pantalla del formulario para crear un nuevo mantenimiento.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CrearMantenimientoScreen(
    // El ID del auto al que le estoy agregando el mantenimiento.
    vehiculoId: Long,
    // La función para volver atrás cuando se guarda todo bien.
    onMantenimientoGuardado: () -> Unit,
    // La función para volver atrás si presiono "cancelar" o la flecha.
    onCancelar: () -> Unit
) {
    val scope = rememberCoroutineScope() // Para llamar a la API.

    // La lista de mantenimientos que puede elegir el usuario.
    val tiposMantencion = listOf(
        "Cambio de aceite", "Revisión de frenos", "Cambio de batería",
        "Revisión de neumáticos", "Cambio de bujías", "Revisión de suspensión",
        "Cambio de filtro de aire", "Limpieza de inyectores"
    )

    // --- Estados para guardar los datos del formulario ---
    var tipo by remember { mutableStateOf("") }
    var descripcion by remember { mutableStateOf("") }
    var fechaISO by remember { mutableStateOf("") } // Formato "yyyy-MM-dd"
    var kilometrajeTexto by remember { mutableStateOf("") }
    var errorGeneral by remember { mutableStateOf<String?>(null) } // Para errores al guardar.
    var expanded by remember { mutableStateOf(false) } // Para el menú desplegable.
    var historial by remember { mutableStateOf<List<Mantenimiento>>(emptyList()) }
    var ultimaMantencion by remember { mutableStateOf<Mantenimiento?>(null) }
    var kilometrajeError by remember { mutableStateOf<String?>(null) } // Para el error del campo kilometraje.

    // Este LaunchedEffect se ejecuta una sola vez cuando la pantalla carga.
    // Lo uso para pedirle a la API todo el historial de mantenimientos de este auto.
    LaunchedEffect(vehiculoId) {
        try {
            historial = RetrofitProvider.instance.obtenerMantenimientos(vehiculoId)
        } catch (e: Exception) {
            errorGeneral = "No se pudo cargar el historial."
        }
    }

    // Este LaunchedEffect se ejecuta cada vez que el 'tipo' o el 'historial' cambian.
    // Busca en el historial cuál fue la última vez que se hizo este tipo de mantenimiento.
    LaunchedEffect(tipo, historial) {
        ultimaMantencion = historial.filter { it.tipo == tipo }.maxByOrNull { it.kilometraje }
    }

    // Este otro se ejecuta cada vez que el usuario escribe en el campo de kilometraje.
    // Lo uso para validar en tiempo real que el número sea correcto.
    LaunchedEffect(kilometrajeTexto, ultimaMantencion) {
        val kilometraje = kilometrajeTexto.toIntOrNull()
        val mantenimientoPrevio = ultimaMantencion
        kilometrajeError = when {
            // Si no es un número válido.
            kilometrajeTexto.isNotBlank() && kilometraje == null -> "Debe ser un número."
            // Si ya hubo uno antes y el nuevo kilometraje es menor. ¡Imposible!
            mantenimientoPrevio != null && kilometraje != null && kilometraje < mantenimientoPrevio.kilometraje -> "Debe ser >= a ${mantenimientoPrevio.kilometraje} km"
            // Si todo está bien, no hay error.
            else -> null
        }
    }

    // Variable para saber si el formulario está listo para ser guardado.
    // El botón de "Guardar" se activará solo si esto es 'true'.
    val isFormValid = tipo.isNotBlank() && descripcion.isNotBlank() && fechaISO.isNotBlank() && kilometrajeTexto.isNotBlank() && kilometrajeError == null

    AppBackground(backgroundImageResId = R.drawable.odometro0) {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = { Text("Nuevo Mantenimiento") },
                    navigationIcon = { IconButton(onClick = onCancelar) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Volver") } },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f))
                )
            }
        ) { paddingValues ->
            Column(modifier = Modifier.padding(paddingValues).padding(16.dp)) {

                // El menú desplegable para elegir el tipo de mantenimiento.
                ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                    OutlinedTextField(
                        value = tipo,
                        onValueChange = { },
                        readOnly = true,
                        label = { Text("Tipo de mantenimiento") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                        modifier = Modifier.fillMaxWidth().menuAnchor() // '.menuAnchor()' es clave para que el menú sepa dónde aparecer.
                    )
                    ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                        tiposMantencion.forEach { opcion ->
                            DropdownMenuItem(text = { Text(opcion) }, onClick = { tipo = opcion; expanded = false })
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))

                // Muestro un pequeño texto con la info del último mantenimiento de este tipo.
                if (ultimaMantencion != null) {
                    Text("Última vez: ${ultimaMantencion!!.fecha?.formatearFechaVisual()} a los ${ultimaMantencion!!.kilometraje} km", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground)
                } else if (tipo.isNotBlank()) {
                    Text("No hay registros previos de este mantenimiento.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f))
                }
                Spacer(modifier = Modifier.height(16.dp))

                // El resto de los campos del formulario.
                OutlinedTextField(value = descripcion, onValueChange = { descripcion = it }, label = { Text("Descripción") }, placeholder = { Text("Ej: Aceite Castrol 5W-30") }, modifier = Modifier.fillMaxWidth())
                Spacer(modifier = Modifier.height(16.dp))

                // Mi componente para elegir la fecha.
                FechaSelector(fechaSeleccionada = fechaISO, onFechaSeleccionada = { fechaISO = it })
                Spacer(modifier = Modifier.height(16.dp))

                // El campo para el kilometraje, con su validación de error.
                OutlinedTextField(
                    value = kilometrajeTexto,
                    onValueChange = { kilometrajeTexto = it },
                    label = { Text("Kilometraje") },
                    modifier = Modifier.fillMaxWidth(),
                    isError = kilometrajeError != null, // Le digo si tiene que pintarse de rojo.
                    supportingText = { if (kilometrajeError != null) { Text(kilometrajeError!!, color = MaterialTheme.colorScheme.error) } }, // Muestro el mensaje de error abajo.
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )
                Spacer(modifier = Modifier.height(24.dp))

                // El botón para guardar. Solo se puede presionar si 'isFormValid' es true.
                Button(
                    onClick = {
                        // Valido que la fecha no sea en el futuro.
                        val fechaSeleccionada = LocalDate.parse(fechaISO, DateTimeFormatter.ISO_DATE)
                        if (fechaSeleccionada.isAfter(LocalDate.now())) {
                            errorGeneral = "La fecha no puede ser futura."
                            return@Button
                        }

                        // Creo el objeto Mantenimiento con todos los datos del formulario.
                        val mantenimiento = Mantenimiento(id = null, tipo = tipo, descripcion = descripcion, fecha = fechaISO, kilometraje = kilometrajeTexto.toInt(), estado = EstadoMantenimiento.PROXIMO, vehiculoId = vehiculoId)

                        scope.launch {
                            try {
                                // Llamo a la API para guardarlo.
                                RetrofitProvider.instance.crearMantenimiento(vehiculoId, mantenimiento)
                                // Si todo va bien, llamo a la función para volver atrás.
                                onMantenimientoGuardado()
                            } catch (e: Exception) {
                                // Si algo falla, muestro el error.
                                errorGeneral = "Error al guardar: ${e.message}"
                            }
                        }
                    },
                    enabled = isFormValid
                ) {
                    Text("Guardar")
                }

                // Muestro el error general si es que existe.
                errorGeneral?.let {
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(it, color = MaterialTheme.colorScheme.error)
                }
            }
        }
    }
}
