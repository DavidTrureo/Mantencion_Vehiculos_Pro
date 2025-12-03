package com.mantenimientovehiculospro.util

import java.time.LocalDate
import java.time.format.DateTimeFormatter

// Este archivo es para poner funciones útiles que puedo usar en toda la app.
// Aquí, por ejemplo, tengo una para formatear fechas.

/**
 * Esta es una "función de extensión" para los Strings.
 * La hice para convertir una fecha que guardo como "2024-12-31" (formato ISO)
 * a un formato más fácil de leer para el usuario, como "31-12-2024".
 */
fun String.formatearFechaVisual(): String {
    return try {
        // 1. Intento "entender" el texto de la fecha asumiendo que viene en formato "yyyy-MM-dd".
        val fechaOriginal = LocalDate.parse(this, DateTimeFormatter.ofPattern("yyyy-MM-dd"))

        // 2. Si lo entiendo, le cambio el formato a "dd-MM-yyyy".
        fechaOriginal.format(DateTimeFormatter.ofPattern("dd-MM-yyyy"))
    } catch (e: Exception) {
        // 3. Si hay un error (por ejemplo, si el texto es "Sin fecha" o está mal escrito),
        // no hago nada y devuelvo el texto tal como vino. Así no se rompe la app.
        this
    }
}
