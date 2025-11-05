package com.mantenimientovehiculospro.util

import com.mantenimientovehiculospro.data.model.EstadoMantenimiento

// === Función para calcular el estado de un mantenimiento ===
// Determina si un mantenimiento está REALIZADO, PRÓXIMO o ATRASADO
// en base al kilometraje actual del vehículo, el kilometraje en que se realizó
// y la descripción que contiene el rango de kilometraje recomendado.
fun calcularEstadoMantencion(
    kilometrajeActual: Int,       // Kilometraje actual del vehículo
    kilometrajeMantencion: Int,   // Kilometraje en que se realizó el mantenimiento
    descripcion: String           // Texto con el rango de mantenimiento (ej: "Cada 5000 - 10000 km")
): EstadoMantenimiento {
    // Expresión regular para extraer el rango de kilometraje desde la descripción
    val regex = Regex("""Cada (\d{1,6})\s*-\s*(\d{1,6}) km""")
    val match = regex.find(descripcion)

    // Obtengo los valores mínimo y máximo del rango
    val minKm = match?.groups?.get(1)?.value?.toIntOrNull()
    val maxKm = match?.groups?.get(2)?.value?.toIntOrNull()

    // Si no se pudo extraer el rango, asumo que el mantenimiento ya está realizado
    if (minKm == null || maxKm == null) return EstadoMantenimiento.REALIZADO

    // Diferencia entre el kilometraje actual y el kilometraje del mantenimiento
    val diferencia = kilometrajeActual - kilometrajeMantencion

    // Clasifico el estado según la diferencia
    return when {
        diferencia < minKm -> EstadoMantenimiento.REALIZADO   // Aún dentro del rango inicial
        diferencia in minKm..maxKm -> EstadoMantenimiento.PROXIMO // Está próximo a necesitarse
        else -> EstadoMantenimiento.ATRASADO                  // Ya pasó el rango recomendado
    }
}

// === Función para calcular el progreso de un mantenimiento ===
// Devuelve un valor entre 0 y 1 que representa cuánto se ha avanzado
// hacia el próximo mantenimiento, en base al kilometraje.
fun calcularProgresoMantencion(
    kilometrajeActual: Int,       // Kilometraje actual del vehículo
    kilometrajeMantencion: Int,   // Kilometraje en que se realizó el mantenimiento
    descripcion: String           // Texto con el rango de mantenimiento
): Float {
    // Expresión regular para extraer el rango de kilometraje
    val regex = Regex("""Cada (\d{1,6})\s*-\s*(\d{1,6}) km""")
    val match = regex.find(descripcion)

    // Obtengo el valor máximo del rango (si no existe, retorno 0f)
    val maxKm = match?.groups?.get(2)?.value?.toIntOrNull() ?: return 0f

    // Calculo la diferencia de kilometraje
    val diferencia = kilometrajeActual - kilometrajeMantencion

    // Progreso = diferencia / rango máximo
    val progreso = diferencia.toFloat() / maxKm.toFloat()

    // Uso coerceIn para asegurar que el valor esté entre 0 y 1
    return progreso.coerceIn(0f, 1f)
}