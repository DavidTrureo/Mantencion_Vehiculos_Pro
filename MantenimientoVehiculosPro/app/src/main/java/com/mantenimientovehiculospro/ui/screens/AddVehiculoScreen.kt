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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddVehiculoScreen(
    onVehiculoGuardado: () -> Unit,
    onBack: () -> Unit,
    viewModel: AddVehiculoViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(state.vehiculoGuardado) {
        if (state.vehiculoGuardado) {
            onVehiculoGuardado()
        }
    }

    AppBackground(backgroundImageResId = R.drawable.auto2) {
        Scaffold(
            containerColor = Color.Transparent,
            modifier = Modifier.fillMaxSize()
        ) { padding ->
            Box(modifier = Modifier.fillMaxSize().padding(padding)) {
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

                    // ✅ Campos de texto SIN colores personalizados para GARANTIZAR la compilación
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

                    // ✅ CORREGIDO: Lógica de error basada en el contenido del `mensaje`
                    state.mensaje?.let {
                        val esError = it.contains("Error", ignoreCase = true) || it.contains("campos", ignoreCase = true)
                        val color = if (esError) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onBackground
                        Text(
                            text = it,
                            color = color,
                            style = MaterialTheme.typography.bodyMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }

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