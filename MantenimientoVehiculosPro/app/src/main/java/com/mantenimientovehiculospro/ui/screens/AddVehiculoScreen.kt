package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddVehiculoScreen(
    onVehiculoGuardado: () -> Unit,
    viewModel: AddVehiculoViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(state.vehiculoGuardado) {
        if (state.vehiculoGuardado) {
            onVehiculoGuardado()
        }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Añadir Nuevo Vehículo") }) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(
                value = state.marca,
                onValueChange = { viewModel.onMarcaChange(it) },
                label = { Text("Marca") },
                placeholder = { Text("Ej: Toyota, Ford, Chevrolet...") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = state.modelo,
                onValueChange = { viewModel.onModeloChange(it) },
                label = { Text("Modelo") },
                placeholder = { Text("Ej: Corolla, Ranger, Spark...") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = state.anio,
                onValueChange = { viewModel.onAnioChange(it) },
                label = { Text("Año") },
                placeholder = { Text("Ej: 2015") },
                modifier = Modifier.fillMaxWidth()
            )
            OutlinedTextField(
                value = state.kilometraje,
                onValueChange = { viewModel.onKilometrajeChange(it) },
                label = { Text("Kilometraje") },
                placeholder = { Text("Ej: 75000") },
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.weight(1f))

            Button(onClick = { viewModel.guardarVehiculo() }, modifier = Modifier.fillMaxWidth()) {
                Text("GUARDAR VEHÍCULO")
            }

            state.mensaje?.let {
                Text(text = it, color = MaterialTheme.colorScheme.error)
            }
        }
    }
}