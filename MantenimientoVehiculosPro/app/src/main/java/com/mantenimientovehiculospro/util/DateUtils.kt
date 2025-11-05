package com.mantenimientovehiculospro.util

import java.text.SimpleDateFormat
import java.util.*

// Esta función de extensión convierte un String con formato de fecha ISO (yyyy-MM-dd)
// en un formato más visual y amigable (dd/MM/yyyy).
// Si ocurre un error al parsear, devuelve el mismo String original.
fun String.formatearFechaVisual(): String {
    return try {
        // Parser: interpreta la fecha en formato ISO (ej: "2025-11-04")
        val parser = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

        // Formatter: convierte la fecha a formato visual (ej: "04/11/2025")
        val formatter = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())

        // Intento parsear el String original
        val date = parser.parse(this)

        // Si la fecha es válida, la formateo; si no, devuelvo el String original
        if (date != null) formatter.format(date) else this
    } catch (e: Exception) {
        // En caso de error (ej: String no válido como fecha), devuelvo el original
        this
    }
}