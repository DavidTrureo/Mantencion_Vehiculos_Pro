package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
// ✅ LA SOLUCIÓN DEFINITIVA: Importaciones explícitas
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditarVehiculoScreen(
    vehiculoId: Long,
    navController: NavController
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var vehiculo by remember { mutableStateOf<Vehiculo?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var cargando by remember { mutableStateOf(true) }

    var marca by remember { mutableStateOf("") }
    var modelo by remember { mutableStateOf("") }
    var anio by remember { mutableStateOf("") }
    var kilometraje by remember { mutableStateOf("") }

    LaunchedEffect(vehiculoId) {
        val usuarioId = UsuarioPreferences.obtenerUsuarioId(context)
        if (usuarioId != null) {
            try {
                val lista = RetrofitProvider.instance.obtenerVehiculos(usuarioId)
                vehiculo = lista.find { it.id == vehiculoId }
                vehiculo?.let {
                    marca = it.marca
                    modelo = it.modelo
                    anio = it.anio.toString()
                    kilometraje = it.kilometraje.toString()
                }
            } catch (e: Exception) {
                error = "Error al cargar vehículo: ${e.message}"
            } finally {
                cargando = false
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
                        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f),
                        titleContentColor = MaterialTheme.colorScheme.onSurface,
                        navigationIconContentColor = MaterialTheme.colorScheme.onSurface
                    )
                )
            }
        ) { paddingValues ->
            if (cargando) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (vehiculo == null) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Vehículo no encontrado", color = MaterialTheme.colorScheme.error)
                }
            } else {
                Column(
                    modifier = Modifier
                        .padding(paddingValues)
                        .padding(16.dp)
                        .fillMaxSize(),
                    verticalArrangement = Arrangement.Center
                ) {
                    // ✅ CORREGIDO: Usando OutlinedTextFieldDefaults
                    val textFieldColors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                        focusedLabelColor = MaterialTheme.colorScheme.primary,
                        unfocusedLabelColor = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
                        cursorColor = MaterialTheme.colorScheme.primary,
                        focusedTextColor = MaterialTheme.colorScheme.onBackground,
                        unfocusedTextColor = MaterialTheme.colorScheme.onBackground
                    )

                    OutlinedTextField(value = marca, onValueChange = { marca = it }, label = { Text("Marca") }, modifier = Modifier.fillMaxWidth(), colors = textFieldColors)
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(value = modelo, onValueChange = { modelo = it }, label = { Text("Modelo") }, modifier = Modifier.fillMaxWidth(), colors = textFieldColors)
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(value = anio, onValueChange = { anio = it }, label = { Text("Año") }, modifier = Modifier.fillMaxWidth(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), colors = textFieldColors)
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(value = kilometraje, onValueChange = { kilometraje = it }, label = { Text("Kilometraje") }, modifier = Modifier.fillMaxWidth(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), colors = textFieldColors)

                    Spacer(modifier = Modifier.height(24.dp))

                    Button(onClick = {
                        val anioInt = anio.toIntOrNull()
                        val kmInt = kilometraje.toIntOrNull()

                        if (marca.isBlank() || modelo.isBlank() || anioInt == null || kmInt == null) {
                            error = "Completa todos los campos correctamente"
                            return@Button
                        }

                        scope.launch {
                            try {
                                val propietarioId = vehiculo?.propietarioId ?: return@launch
                                val actualizado = Vehiculo(id = vehiculoId, marca = marca, modelo = modelo, anio = anioInt, kilometraje = kmInt, propietarioId = propietarioId)
                                RetrofitProvider.instance.actualizarVehiculo(vehiculoId, actualizado)
                                navController.previousBackStackEntry?.savedStateHandle?.set("refrescar", true)
                                navController.popBackStack()
                            } catch (e: Exception) {
                                error = "Error al actualizar vehículo: ${e.message}"
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
    }
}