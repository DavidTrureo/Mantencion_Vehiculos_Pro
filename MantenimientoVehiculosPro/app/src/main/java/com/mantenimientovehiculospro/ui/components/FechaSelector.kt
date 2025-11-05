package com.mantenimientovehiculospro.ui.components

import android.app.DatePickerDialog
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.mantenimientovehiculospro.util.formatearFechaVisual
import java.util.*

// Este componente representa un selector de fecha reutilizable.
// Lo uso en pantallas como "Crear Mantenimiento" o "Editar Mantenimiento"
// para que el usuario pueda elegir una fecha de manera visual y sencilla.
@Composable
fun FechaSelector(
    fechaSeleccionada: String,                 // Fecha actual seleccionada en formato ISO (yyyy-MM-dd)
    onFechaSeleccionada: (String) -> Unit      // Callback que devuelve la nueva fecha seleccionada
) {
    val context = LocalContext.current
    val calendario = Calendar.getInstance()    // Obtengo la fecha actual del sistema

    // Configuro el diálogo nativo de selección de fecha de Android.
    val datePickerDialog = DatePickerDialog(
        context,
        { _, year, month, dayOfMonth ->
            // Cuando el usuario selecciona una fecha, la formateo en ISO (yyyy-MM-dd)
            val fecha = "%04d-%02d-%02d".format(year, month + 1, dayOfMonth)
            onFechaSeleccionada(fecha) // Devuelvo la fecha seleccionada al padre
        },
        calendario.get(Calendar.YEAR),
        calendario.get(Calendar.MONTH),
        calendario.get(Calendar.DAY_OF_MONTH)
    )

    // Formateo la fecha seleccionada para mostrarla de forma más amigable (dd-MM-yyyy).
    val fechaFormateada = fechaSeleccionada.formatearFechaVisual()

    // Diseño visual del campo de selección de fecha
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { datePickerDialog.show() } // Al hacer clic, muestro el diálogo de fecha
            .background(Color.White)
            .border(1.dp, Color.Gray, shape = MaterialTheme.shapes.small)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Texto que muestra la fecha seleccionada o un placeholder si no hay fecha
        Text(
            text = if (fechaFormateada.isNotBlank()) fechaFormateada else "Selecciona una fecha",
            color = if (fechaFormateada.isNotBlank()) Color.Black else Color.Gray,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.weight(1f)
        )
        // Ícono de calendario para reforzar la acción de seleccionar fecha
        Icon(
            imageVector = Icons.Default.DateRange,
            contentDescription = "Seleccionar fecha",
            tint = Color.Gray
        )
    }
}