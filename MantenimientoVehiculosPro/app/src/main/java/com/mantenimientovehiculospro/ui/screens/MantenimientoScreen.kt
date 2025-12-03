package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavBackStackEntry
import androidx.navigation.NavController
import androidx.navigation.compose.rememberNavController
import com.mantenimientovehiculospro.data.model.EstadoMantenimiento
import com.mantenimientovehiculospro.data.model.Mantenimiento

// Esta es una pantalla que muestra una lista de mantenimientos para un vehículo.
// Parece una versión más simple o quizás un borrador anterior de DetalleVehiculoScreen.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MantenimientoScreen(
    navController: NavController = rememberNavController(),
    // El 'backStackEntry' me lo da el navegador y contiene los argumentos
    // que se pasaron en la ruta, como el ID del vehículo.
    backStackEntry: NavBackStackEntry? = null
) {
    // Conecto esta pantalla con su ViewModel, que es el que maneja la lógica.
    val viewModel: MantenimientoViewModel = viewModel()
    // "Escucho" el estado de la UI que me manda el ViewModel.
    val uiState by viewModel.uiState.collectAsState()

    // Saco el ID del vehículo de los argumentos de la navegación.
    val vehiculoId = backStackEntry?.arguments?.getString("vehiculoId")?.toLongOrNull()

    // Este LaunchedEffect se ejecuta cuando el vehiculoId cambia.
    // Le pide al ViewModel que cargue los mantenimientos para ese ID.
    LaunchedEffect(vehiculoId) {
        vehiculoId?.let { viewModel.cargarMantenimientos(it) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mantenimientos") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(modifier = Modifier.padding(paddingValues).padding(16.dp)) {
            // Muestro un circulito de carga si el ViewModel está ocupado.
            if (uiState.isLoading) {
                CircularProgressIndicator()
            } else if (uiState.error != null) {
                // Si hubo un error, lo muestro en rojo.
                Text(uiState.error ?: "Error desconocido", color = MaterialTheme.colorScheme.error)
            } else {
                // Si todo está bien, muestro la lista de mantenimientos.
                // Uso LazyColumn por si la lista es muy larga, para que no se pegue la app.
                LazyColumn {
                    items(uiState.lista) { mantenimiento ->
                        // Elijo un color para la tarjeta según el estado del mantenimiento.
                        // Ojo: Estos colores están puestos a mano ("hardcodeados").
                        // Sería mejor usar los colores del tema de la app (MaterialTheme.colorScheme).
                        val color = when (mantenimiento.estado) {
                            EstadoMantenimiento.REALIZADO -> Color(0xFF4CAF50) // Verde
                            EstadoMantenimiento.PROXIMO -> Color(0xFFFFC107)   // Amarillo
                            EstadoMantenimiento.ATRASADO -> Color(0xFFF44336)   // Rojo
                        }

                        // Creo una tarjeta para cada mantenimiento de la lista.
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp)
                                // NOTA: .background() en un modifier de Card puede no funcionar como se espera.
                                // Es mejor usar `colors = CardDefaults.cardColors(containerColor = color)`.
                                .background(color)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Text("Descripción: ${mantenimiento.descripcion}", style = MaterialTheme.typography.titleMedium)
                                Text("Fecha: ${mantenimiento.fecha ?: "Sin fecha"}")
                                Text("Kilometraje: ${mantenimiento.kilometraje} km")
                                Text("Estado: ${mantenimiento.estado}")
                            }
                        }
                    }
                }
            }
        }
    }
}
