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

// Este Composable es una "tarjeta" para mostrar el resumen de un mantenimiento.
// Es reutilizable, así que puedo usarlo en varias pantallas para mostrar
// la información de forma consistente.
@Composable
fun MantencionCard(
    // El objeto del mantenimiento que quiero mostrar, con todos sus datos.
    mantenimiento: Mantenimiento,
    // El kilometraje actual del auto. Lo necesito para calcular si el
    // mantenimiento está próximo, atrasado o ya se hizo.
    kilometrajeActual: Int
) {
    // Aquí llamo a una función que calcula el estado del mantenimiento.
    // Le paso los kilómetros y me devuelve si está REALIZADO, PROXIMO o ATRASADO.
    val estado = calcularEstadoMantencion(
        kilometrajeActual = kilometrajeActual,
        kilometrajeMantencion = mantenimiento.kilometraje,
        descripcion = mantenimiento.descripcion
    )

    // Esta otra función calcula un porcentaje (de 0.0 a 1.0) para la barra de progreso.
    val progreso = calcularProgresoMantencion(
        kilometrajeActual = kilometrajeActual,
        kilometrajeMantencion = mantenimiento.kilometraje,
        descripcion = mantenimiento.descripcion
    )

    // Dependiendo del estado, elijo un color para la tarjeta y la barra de progreso.
    val color = when (estado) {
        EstadoMantenimiento.REALIZADO -> MaterialTheme.colorScheme.primary // Verde/Azul
        EstadoMantenimiento.PROXIMO -> MaterialTheme.colorScheme.secondary // Amarillo/Naranja
        EstadoMantenimiento.ATRASADO -> MaterialTheme.colorScheme.error   // Rojo
    }

    // Esta es la tarjeta (Card) que se ve en la pantalla.
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        // Le pongo un color de fondo semitransparente para que se vea bien.
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.1f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Muestro la información principal del mantenimiento.
            Text("Tipo: ${mantenimiento.tipo}", style = MaterialTheme.typography.titleSmall)
            Text("Fecha: ${mantenimiento.fecha?.formatearFechaVisual() ?: "Sin fecha"}")
            Text("Km realizado: ${mantenimiento.kilometraje} km")
            Text("Estado: $estado")

            Spacer(modifier = Modifier.height(8.dp))

            // La barra de progreso que se va llenando.
            LinearProgressIndicator(
                progress = { progreso }, // Le paso el progreso calculado antes.
                modifier = Modifier.fillMaxWidth(),
                color = color, // Le pongo el color que elegí según el estado.
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
            // Muestro el progreso en formato de porcentaje (ej: 85%).
            Text("Progreso: ${(progreso * 100).toInt()}%", style = MaterialTheme.typography.bodySmall)

            // Si el mantenimiento tiene una descripción, la muestro. Si no, no muestro nada.
            if (mantenimiento.descripcion.isNotBlank()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text("Descripción: ${mantenimiento.descripcion}", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}
