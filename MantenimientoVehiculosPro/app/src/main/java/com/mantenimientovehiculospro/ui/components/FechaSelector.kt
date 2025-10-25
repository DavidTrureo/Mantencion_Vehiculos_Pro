package com.mantenimientovehiculospro.ui.components

import android.app.DatePickerDialog
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import java.util.*

@Composable
fun FechaSelector(
    fechaSeleccionada: String,
    onFechaSeleccionada: (String) -> Unit
) {
    val context = LocalContext.current
    val calendario = Calendar.getInstance()

    // Creamos el DatePickerDialog
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

    // Usamos Box para envolver el campo y capturar los clics correctamente
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { datePickerDialog.show() } // Muestra el calendario
    ) {
        OutlinedTextField(
            value = fechaSeleccionada,
            onValueChange = {},
            label = { Text("Fecha") },
            placeholder = { Text("Selecciona una fecha") },
            readOnly = true,
            enabled = false, // hace que no se vea editable ni tenga cursor
            modifier = Modifier.fillMaxWidth()
        )
    }
}
