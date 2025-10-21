package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.Icons
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MantenimientoScreen(
    navController: NavController = rememberNavController(),
    backStackEntry: NavBackStackEntry? = null
) {
    val viewModel: MantenimientoViewModel = viewModel()
    val mantenimientos by viewModel.mantenimientos.collectAsState()

    val vehiculoId = backStackEntry?.arguments?.getString("vehiculoId")?.toLongOrNull()

    LaunchedEffect(vehiculoId) {
        vehiculoId?.let { viewModel.cargarMantenimientos(it) }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mantenimientos") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")                    }
                }
            )
        }
    ) { paddingValues ->
        LazyColumn(modifier = Modifier.padding(paddingValues).padding(16.dp)) {
            items(mantenimientos) { mantenimiento ->
                val color = when (mantenimiento.estado) {
                    EstadoMantenimiento.REALIZADO -> Color(0xFF4CAF50) // verde
                    EstadoMantenimiento.PROXIMO -> Color(0xFFFFC107)   // amarillo
                    EstadoMantenimiento.ATRASADO -> Color(0xFFF44336)  // rojo
                }

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp)
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