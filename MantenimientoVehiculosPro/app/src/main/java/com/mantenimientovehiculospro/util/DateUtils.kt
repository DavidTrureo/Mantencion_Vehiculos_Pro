package com.mantenimientovehiculospro.util

import java.time.LocalDate
import java.time.format.DateTimeFormatter

/**
 * Formatea una fecha en formato ISO ("yyyy-MM-dd") a un formato más visual para el usuario ("dd-MM-yyyy").
 * Si la fecha es nula o tiene un formato incorrecto, devuelve el string original sin cambios.
 */
fun String.formatearFechaVisual(): String {
    return try {
        val original = LocalDate.parse(this, DateTimeFormatter.ofPattern("yyyy-MM-dd"))
        original.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"))
    } catch (e: Exception) {
        this
    }
}
