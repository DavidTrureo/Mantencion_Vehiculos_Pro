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
// Este import es clave para poder personalizar los colores del campo de texto.
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.mantenimientovehiculospro.util.formatearFechaVisual
import java.util.*

// Este es un Composable que armé para que el usuario pueda elegir una fecha.
// En lugar de que la escriba a mano, le muestro un campo de texto que,
// al tocarlo, abre el calendario típico de Android.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FechaSelector(
    // La fecha que está guardada actualmente (en formato "yyyy-MM-dd").
    fechaSeleccionada: String,
    // La función que se va a ejecutar cuando el usuario elija una nueva fecha del calendario.
    onFechaSeleccionada: (String) -> Unit
) {
    val context = LocalContext.current
    val calendario = Calendar.getInstance()

    // Aquí preparo el diálogo del calendario de Android, el que sale como un pop-up.
    val datePickerDialog = DatePickerDialog(
        context,
        // Esto es lo que se ejecuta cuando el usuario elige una fecha y le da a "Aceptar".
        { _, year, month, dayOfMonth ->
            // Formateo la fecha al estilo "yyyy-MM-dd" para guardarla bien en la base de datos.
            // Ojo: al mes le sumo 1 porque en Android los meses van de 0 a 11.
            val fecha = "%04d-%02d-%02d".format(year, month + 1, dayOfMonth)
            // Ejecuto la función que me pasaron para actualizar la fecha en la pantalla principal.
            onFechaSeleccionada(fecha)
        },
        // Le paso la fecha de hoy para que el calendario se abra en el día actual.
        calendario.get(Calendar.YEAR),
        calendario.get(Calendar.MONTH),
        calendario.get(Calendar.DAY_OF_MONTH)
    )

    // Convierto la fecha "yyyy-MM-dd" a un formato más bonito para mostrarla (ej: "31-12-2024").
    val fechaFormateada = fechaSeleccionada.formatearFechaVisual()

    // Este es el campo de texto que el usuario ve en la pantalla.
    OutlinedTextField(
        value = if (fechaFormateada.isNotBlank()) fechaFormateada else "",
        onValueChange = {}, // No hace nada porque no se puede escribir directamente.
        label = { Text("Fecha") },
        readOnly = true, // Le digo que es de solo lectura.
        modifier = Modifier
            .fillMaxWidth()
            // ¡El truco! Hago que todo el campo de texto sea clickeable.
            // Al tocarlo, muestro el diálogo del calendario que preparé arriba.
            .clickable { datePickerDialog.show() },
        trailingIcon = {
            Icon(
                imageVector = Icons.Default.DateRange,
                contentDescription = "Seleccionar fecha",
            )
        },
        // Le pongo colores personalizados para que no se vea como un campo de texto "apagado" o gris.
        colors = OutlinedTextFieldDefaults.colors(
            disabledTextColor = MaterialTheme.colorScheme.onBackground,
            disabledBorderColor = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
            disabledLabelColor = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
            disabledTrailingIconColor = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f),
        ),
        // Lo deshabilito para que el teclado no aparezca y el cursor no parpadee.
        // La interacción se hace a través del '.clickable' que puse en el modifier.
        enabled = false
    )
}
