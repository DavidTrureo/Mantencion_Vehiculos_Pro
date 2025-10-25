package com.mantenimientovehiculospro.util

import java.text.SimpleDateFormat
import java.util.*

fun String.formatearFechaVisual(): String {
    return try {
        val parser = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
        val formatter = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())
        val date = parser.parse(this)
        if (date != null) formatter.format(date) else this
    } catch (e: Exception) {
        this
    }
}