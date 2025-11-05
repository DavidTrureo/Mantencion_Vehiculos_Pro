package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mantenimientovehiculospro.ui.components.BotonAccion
import com.mantenimientovehiculospro.ui.theme.SuccessGreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddVehiculoScreen(
    onVehiculoGuardado: () -> Unit,                // Callback que se ejecuta cuando el vehículo se guarda con éxito
    viewModel: AddVehiculoViewModel = viewModel()  // ViewModel que maneja el estado de la pantalla
) {
    // Observo el estado expuesto por el ViewModel usando StateFlow
    val state by viewModel.uiState.collectAsState()

    // Efecto lanzado cuando cambia el flag "vehiculoGuardado"
    // Si es true, llamo al callback para notificar que se guardó el vehículo
    LaunchedEffect(state.vehiculoGuardado) {
        if (state.vehiculoGuardado) {
            onVehiculoGuardado()
        }
    }

    // Estructura principal de la pantalla con barra superior y contenido
    Scaffold(
        topBar = { TopAppBar(title = { Text("Añadir Nuevo Vehículo") }) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues) // Respeta el padding del Scaffold
                .padding(16.dp),        // Padding interno
            verticalArrangement = Arrangement.spacedBy(16.dp) // Espaciado entre elementos
        ) {
            // Campo para ingresar la marca del vehículo
            OutlinedTextField(
                value = state.marca,
                onValueChange = { viewModel.onMarcaChange(it) },
                label = { Text("Marca") },
                placeholder = { Text("Ej: Toyota, Ford, Chevrolet...") },
                modifier = Modifier.fillMaxWidth()
            )

            // Campo para ingresar el modelo
            OutlinedTextField(
                value = state.modelo,
                onValueChange = { viewModel.onModeloChange(it) },
                label = { Text("Modelo") },
                placeholder = { Text("Ej: Corolla, Ranger, Spark...") },
                modifier = Modifier.fillMaxWidth()
            )

            // Campo para ingresar el año
            OutlinedTextField(
                value = state.anio,
                onValueChange = { viewModel.onAnioChange(it) },
                label = { Text("Año") },
                placeholder = { Text("Ej: 2015") },
                modifier = Modifier.fillMaxWidth()
            )

            // Campo para ingresar el kilometraje
            OutlinedTextField(
                value = state.kilometraje,
                onValueChange = { viewModel.onKilometrajeChange(it) },
                label = { Text("Kilometraje") },
                placeholder = { Text("Ej: 75000") },
                modifier = Modifier.fillMaxWidth()
            )

            // Empuja el botón hacia abajo (ocupa el espacio restante)
            Spacer(modifier = Modifier.weight(1f))

            // Botón de acción reutilizable para guardar el vehículo
            BotonAccion(
                texto = "GUARDAR VEHÍCULO",
                colorFondo = SuccessGreen,
                onClick = { viewModel.guardarVehiculo() },
                modifier = Modifier.fillMaxWidth()
            )

            // Si hay un mensaje de error o confirmación, lo muestro debajo
            state.mensaje?.let {
                Text(text = it, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}