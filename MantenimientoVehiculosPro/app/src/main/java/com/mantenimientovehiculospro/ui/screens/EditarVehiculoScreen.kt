package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.mantenimientovehiculospro.R
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import com.mantenimientovehiculospro.data.model.Vehiculo
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import com.mantenimientovehiculospro.ui.components.AppBackground
import kotlinx.coroutines.launch

// Esta es la pantalla para EDITAR la información de un vehículo que ya existe.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditarVehiculoScreen(
    // El ID del vehículo que voy a editar. Me lo pasan desde la pantalla anterior.
    vehiculoId: Long,
    // El controlador de navegación para poder volver atrás.
    navController: NavController
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope() // Para las llamadas a la API.

    // --- Estados para guardar los datos de la pantalla ---
    var vehiculo by remember { mutableStateOf<Vehiculo?>(null) } // El objeto original del vehículo.
    var error by remember { mutableStateOf<String?>(null) }
    var cargando by remember { mutableStateOf(true) }

    // Estados para cada campo del formulario.
    var marca by remember { mutableStateOf("") }
    var modelo by remember { mutableStateOf("") }
    var anio by remember { mutableStateOf("") }
    var kilometraje by remember { mutableStateOf("") }

    // Este LaunchedEffect se ejecuta una vez cuando la pantalla carga.
    // Su trabajo es pedirle a la API los datos del vehículo que voy a editar.
    LaunchedEffect(vehiculoId) {
        val usuarioId = UsuarioPreferences.obtenerUsuarioId(context)
        if (usuarioId != null) {
            try {
                // Pido la lista de vehículos del usuario y busco el que coincida con el ID.
                // NOTA: Sería más rápido si la API tuviera un endpoint para pedir un solo vehículo por ID.
                val lista = RetrofitProvider.instance.obtenerVehiculos(usuarioId)
                vehiculo = lista.find { it.id == vehiculoId }

                // Si encontré el vehículo, relleno los campos del formulario con sus datos.
                vehiculo?.let {
                    marca = it.marca
                    modelo = it.modelo
                    anio = it.anio.toString()
                    kilometraje = it.kilometraje.toString()
                }
            } catch (e: Exception) {
                error = "Error al cargar los datos del vehículo: ${e.message}"
            } finally {
                cargando = false // Dejo de mostrar el circulito de "cargando".
            }
        }
    }

    AppBackground(backgroundImageResId = R.drawable.auto2) {
        Scaffold(
            containerColor = Color.Transparent,
            topBar = {
                TopAppBar(
                    title = { Text("Editar Vehículo") },
                    navigationIcon = {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f)
                    )
                )
            }
        ) { paddingValues ->
            if (cargando) {
                // Muestro un circulito de carga mientras busco los datos.
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (vehiculo == null) {
                // Si no encontré el vehículo, muestro un error.
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Vehículo no encontrado", color = MaterialTheme.colorScheme.error)
                }
            } else {
                // Si todo está bien, muestro el formulario.
                Column(
                    modifier = Modifier
                        .padding(paddingValues)
                        .padding(16.dp)
                        .fillMaxSize(),
                    verticalArrangement = Arrangement.Center
                ) {
                    // Defino un estilo para los campos de texto.
                    val textFieldColors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                        focusedLabelColor = MaterialTheme.colorScheme.primary,
                        unfocusedLabelColor = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f)
                    )

                    // --- Campos del Formulario ---
                    OutlinedTextField(value = marca, onValueChange = { marca = it }, label = { Text("Marca") }, modifier = Modifier.fillMaxWidth(), colors = textFieldColors)
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(value = modelo, onValueChange = { modelo = it }, label = { Text("Modelo") }, modifier = Modifier.fillMaxWidth(), colors = textFieldColors)
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(value = anio, onValueChange = { anio = it }, label = { Text("Año") }, modifier = Modifier.fillMaxWidth(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), colors = textFieldColors)
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(value = kilometraje, onValueChange = { kilometraje = it }, label = { Text("Kilometraje") }, modifier = Modifier.fillMaxWidth(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), colors = textFieldColors)

                    Spacer(modifier = Modifier.height(24.dp))

                    // El botón para guardar los cambios.
                    Button(onClick = {
                        val anioInt = anio.toIntOrNull()
                        val kmInt = kilometraje.toIntOrNull()

                        // Valido que los campos no estén vacíos y que los números sean válidos.
                        if (marca.isBlank() || modelo.isBlank() || anioInt == null || kmInt == null) {
                            error = "Por favor, completa todos los campos correctamente."
                            return@Button
                        }

                        scope.launch {
                            try {
                                val propietarioId = vehiculo?.propietarioId ?: return@launch
                                // Creo un nuevo objeto Vehiculo con los datos actualizados.
                                val actualizado = Vehiculo(id = vehiculoId, marca = marca, modelo = modelo, anio = anioInt, kilometraje = kmInt, propietarioId = propietarioId)
                                // Llamo a la API para que guarde los cambios en el servidor.
                                RetrofitProvider.instance.actualizarVehiculo(vehiculoId, actualizado)

                                // Truco para avisarle a la pantalla anterior que debe refrescar sus datos.
                                navController.previousBackStackEntry?.savedStateHandle?.set("refrescar", true)
                                // Vuelvo a la pantalla de detalle del vehículo.
                                navController.popBackStack()
                            } catch (e: Exception) {
                                error = "Error al actualizar el vehículo: ${e.message}"
                            }
                        }
                    }) {
                        Text("Guardar cambios")
                    }

                    // Si hay algún mensaje de error, lo muestro.
                    error?.let {
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(it, color = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
    }
}
