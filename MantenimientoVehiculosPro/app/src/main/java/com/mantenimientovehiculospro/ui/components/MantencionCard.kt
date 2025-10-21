package com.mantenimientovehiculospro.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mantenimientovehiculospro.data.model.EstadoMantenimiento
import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.ui.screens.formatearFecha
import com.mantenimientovehiculospro.util.calcularEstadoMantencion
import com.mantenimientovehiculospro.util.calcularProgresoMantencion

@Composable
fun MantencionCard(
    mantenimiento: Mantenimiento,
    kilometrajeActual: Int
) {
    val estado = calcularEstadoMantencion(
        kilometrajeActual = kilometrajeActual,
        kilometrajeMantencion = mantenimiento.kilometraje,
        descripcion = mantenimiento.descripcion
    )

    val progreso = calcularProgresoMantencion(
        kilometrajeActual = kilometrajeActual,
        kilometrajeMantencion = mantenimiento.kilometraje,
        descripcion = mantenimiento.descripcion
    )

    val color = when (estado) {
        EstadoMantenimiento.REALIZADO -> MaterialTheme.colorScheme.primary
        EstadoMantenimiento.PROXIMO -> MaterialTheme.colorScheme.secondary
        EstadoMantenimiento.ATRASADO -> MaterialTheme.colorScheme.error
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Tipo: ${mantenimiento.tipo}", style = MaterialTheme.typography.titleSmall)
            Text("Fecha: ${formatearFecha(mantenimiento.fecha)}")
            Text("Km realizado: ${mantenimiento.kilometraje} km")
            Text("Estado: $estado")

            Spacer(modifier = Modifier.height(8.dp))
            LinearProgressIndicator(
                progress = { progreso },
                modifier = Modifier.fillMaxWidth(),
                color = color,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
            Text("Progreso: ${(progreso * 100).toInt()}%", style = MaterialTheme.typography.bodySmall)

            if (mantenimiento.descripcion.isNotBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text("Descripción: ${mantenimiento.descripcion}", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}