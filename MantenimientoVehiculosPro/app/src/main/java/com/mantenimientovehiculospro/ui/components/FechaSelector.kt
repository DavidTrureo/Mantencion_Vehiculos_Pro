package com.mantenimientovehiculospro.ui.components

import android.app.DatePickerDialog
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
// ✅ LA SOLUCIÓN REAL: Importando el objeto de Defaults correcto
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.mantenimientovehiculospro.util.formatearFechaVisual
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
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

    OutlinedTextField(
        value = if (fechaFormateada.isNotBlank()) fechaFormateada else "",
        onValueChange = {},
        label = { Text("Fecha") },
        readOnly = true,
        modifier = Modifier
            .fillMaxWidth()
            .clickable { datePickerDialog.show() },
        trailingIcon = {
            Icon(
                imageVector = Icons.Default.DateRange,
                contentDescription = "Seleccionar fecha",
            )
        },
        // ✅ Y llamando a la función desde el objeto correcto
        colors = OutlinedTextFieldDefaults.colors(
            // Colores para el campo cuando está deshabilitado (nuestro caso)
            disabledTextColor = MaterialTheme.colorScheme.onBackground,
            disabledBorderColor = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
            disabledLabelColor = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
            disabledTrailingIconColor = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
        ),
        enabled = false // Deshabilitado para forzar el uso del diálogo
    )
}