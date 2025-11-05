package com.mantenimientovehiculospro.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.mantenimientovehiculospro.data.model.EstadoMantenimiento
import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.util.calcularEstadoMantencion
import com.mantenimientovehiculospro.util.calcularProgresoMantencion
import com.mantenimientovehiculospro.util.formatearFechaVisual

// Este componente muestra la información de un mantenimiento en forma de tarjeta (Card).
// Incluye datos como tipo, fecha, kilometraje, estado y progreso.
// También cambia de color según el estado del mantenimiento.
@Composable
fun MantencionCard(
    mantenimiento: Mantenimiento,   // Objeto con los datos del mantenimiento
    kilometrajeActual: Int          // Kilometraje actual del vehículo, usado para calcular estado y progreso
) {
    // Calculo el estado del mantenimiento (REALIZADO, PRÓXIMO o ATRASADO)
    val estado = calcularEstadoMantencion(
        kilometrajeActual = kilometrajeActual,
        kilometrajeMantencion = mantenimiento.kilometraje,
        descripcion = mantenimiento.descripcion
    )

    // Calculo el progreso del mantenimiento en base al kilometraje
    val progreso = calcularProgresoMantencion(
        kilometrajeActual = kilometrajeActual,
        kilometrajeMantencion = mantenimiento.kilometraje,
        descripcion = mantenimiento.descripcion
    )

    // Defino el color de la tarjeta según el estado del mantenimiento
    val color = when (estado) {
        EstadoMantenimiento.REALIZADO -> MaterialTheme.colorScheme.primary
        EstadoMantenimiento.PROXIMO -> MaterialTheme.colorScheme.secondary
        EstadoMantenimiento.ATRASADO -> MaterialTheme.colorScheme.error
    }

    // Card que contiene toda la información del mantenimiento
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f)) // Fondo con transparencia
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Información principal del mantenimiento
            Text("Tipo: ${mantenimiento.tipo}", style = MaterialTheme.typography.titleSmall)
            Text("Fecha: ${mantenimiento.fecha?.formatearFechaVisual() ?: "Sin fecha"}")
            Text("Km realizado: ${mantenimiento.kilometraje} km")
            Text("Estado: $estado")

            Spacer(modifier = Modifier.height(8.dp))

            // Barra de progreso que indica cuánto falta para el mantenimiento
            LinearProgressIndicator(
                progress = { progreso },
                modifier = Modifier.fillMaxWidth(),
                color = color,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
            Text("Progreso: ${(progreso * 100).toInt()}%", style = MaterialTheme.typography.bodySmall)

            // Si hay una descripción, la muestro debajo
            if (mantenimiento.descripcion.isNotBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text("Descripción: ${mantenimiento.descripcion}", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}