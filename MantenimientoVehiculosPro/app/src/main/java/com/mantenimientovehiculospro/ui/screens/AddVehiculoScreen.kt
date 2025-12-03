package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mantenimientovehiculospro.R
import com.mantenimientovehiculospro.ui.components.AppBackground

// Esta es la pantalla del formulario para añadir un vehículo nuevo.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddVehiculoScreen(
    // La función que se ejecuta cuando el vehículo se guarda bien, para volver atrás.
    onVehiculoGuardado: () -> Unit,
    // La función para cuando se presiona la flecha de "volver".
    onBack: () -> Unit,
    // Aquí inyecto el ViewModel, que es el que tiene toda la lógica.
    // El `viewModel()` se encarga de dármelo o crearlo si no existe.
    viewModel: AddVehiculoViewModel = viewModel()
) {
    // Aquí "escucho" el estado de la UI que viene del ViewModel.
    // 'state' tiene todos los datos (marca, modelo, etc.) y va a cambiar
    // cada vez que el ViewModel lo actualice.
    val state by viewModel.uiState.collectAsState()

    // Este 'LaunchedEffect' está pendiente de si 'state.vehiculoGuardado' cambia a 'true'.
    // Si cambia, significa que el ViewModel guardó el auto con éxito.
    LaunchedEffect(state.vehiculoGuardado) {
        if (state.vehiculoGuardado) {
            // Si se guardó, llamo a la función para volver a la pantalla anterior.
            onVehiculoGuardado()
        }
    }

    // Uso mi fondo personalizado para la pantalla.
    AppBackground(backgroundImageResId = R.drawable.auto2) {
        Scaffold(
            // Hago el fondo del Scaffold transparente para que se vea la imagen de AppBackground.
            containerColor = Color.Transparent,
            modifier = Modifier.fillMaxSize()
        ) { padding ->
            Box(modifier = Modifier.fillMaxSize().padding(padding)) {
                // El botón para volver, puesto arriba a la izquierda.
                IconButton(
                    onClick = onBack,
                    modifier = Modifier.align(Alignment.TopStart).padding(8.dp)
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Volver",
                        tint = MaterialTheme.colorScheme.onBackground
                    )
                }

                // La columna principal con el formulario, centrado en la pantalla.
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "Añadir Vehículo",
                        style = MaterialTheme.typography.headlineLarge,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Spacer(modifier = Modifier.height(32.dp))

                    // --- CAMPOS DEL FORMULARIO ---
                    // Cada campo de texto está conectado al ViewModel.
                    // 'value' lee el dato desde el 'state'.
                    // 'onValueChange' llama a una función del ViewModel cada vez que escribo algo.

                    OutlinedTextField(
                        value = state.marca,
                        onValueChange = viewModel::onMarcaChange,
                        label = { Text("Marca") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = state.modelo,
                        onValueChange = viewModel::onModeloChange,
                        label = { Text("Modelo") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = state.anio,
                        onValueChange = viewModel::onAnioChange,
                        label = { Text("Año") },
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    OutlinedTextField(
                        value = state.kilometraje,
                        onValueChange = viewModel::onKilometrajeChange,
                        label = { Text("Kilometraje") },
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    // Aquí muestro los mensajes que me manda el ViewModel (errores o avisos).
                    state.mensaje?.let {
                        // Reviso si el mensaje es de error para pintarlo en rojo.
                        val esError = it.contains("Error", ignoreCase = true) || it.contains("campos", ignoreCase = true)
                        val color = if (esError) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onBackground
                        Text(
                            text = it,
                            color = color,
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    // El botón para guardar el vehículo.
                    Button(
                        onClick = { viewModel.guardarVehiculo() },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("GUARDAR VEHÍCULO")
                    }
                }
            }
        }
    }
}
