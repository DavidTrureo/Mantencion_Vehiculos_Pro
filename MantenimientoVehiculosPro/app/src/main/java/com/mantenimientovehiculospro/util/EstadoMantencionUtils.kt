package com.mantenimientovehiculospro.util

import com.mantenimientovehiculospro.data.model.EstadoMantenimiento

fun calcularEstadoMantencion(
    kilometrajeActual: Int,
    kilometrajeMantencion: Int,
    descripcion: String
): EstadoMantenimiento {
    val regex = Regex("""Cada (\d{1,6})\s*-\s*(\d{1,6}) km""")
    val match = regex.find(descripcion)

    val minKm = match?.groups?.get(1)?.value?.toIntOrNull()
    val maxKm = match?.groups?.get(2)?.value?.toIntOrNull()

    if (minKm == null || maxKm == null) return EstadoMantenimiento.REALIZADO

    val diferencia = kilometrajeActual - kilometrajeMantencion

    return when {
        diferencia < minKm -> EstadoMantenimiento.REALIZADO
        diferencia in minKm..maxKm -> EstadoMantenimiento.PROXIMO
        else -> EstadoMantenimiento.ATRASADO
    }
}

fun calcularProgresoMantencion(
    kilometrajeActual: Int,
    kilometrajeMantencion: Int,
    descripcion: String
): Float {
    val regex = Regex("""Cada (\d{1,6})\s*-\s*(\d{1,6}) km""")
    val match = regex.find(descripcion)

    val maxKm = match?.groups?.get(2)?.value?.toIntOrNull() ?: return 0f

    val diferencia = kilometrajeActual - kilometrajeMantencion
    val progreso = diferencia.toFloat() / maxKm.toFloat()
    return progreso.coerceIn(0f, 1f)
}