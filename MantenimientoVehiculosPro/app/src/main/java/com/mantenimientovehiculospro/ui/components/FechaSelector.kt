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

@Composable
fun FechaSelector(
    fechaSeleccionada: String,
    onFechaSeleccionada: (String) -> Unit
) {
    val context = LocalContext.current
    val calendario = Calendar.getInstance()

    val datePickerDialog = DatePickerDialog(
        context,
        { _, year, month, dayOfMonth ->
            val fecha = "%04d-%02d-%02d".format(year, month + 1, dayOfMonth)
            onFechaSeleccionada(fecha)
        },
        calendario.get(Calendar.YEAR),
        calendario.get(Calendar.MONTH),
        calendario.get(Calendar.DAY_OF_MONTH)
    )

    val fechaFormateada = fechaSeleccionada.formatearFechaVisual()

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { datePickerDialog.show() }
            .background(Color.White)
            .border(1.dp, Color.Gray, shape = MaterialTheme.shapes.small)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = if (fechaFormateada.isNotBlank()) fechaFormateada else "Selecciona una fecha",
            color = if (fechaFormateada.isNotBlank()) Color.Black else Color.Gray,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.weight(1f)
        )
        Icon(
            imageVector = Icons.Default.DateRange,
            contentDescription = "Seleccionar fecha",
            tint = Color.Gray
        )
    }
}