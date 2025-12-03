package com.mantenimientovehiculospro.util

import com.mantenimientovehiculospro.data.model.EstadoMantenimiento

// Este archivo tiene funciones de cálculo para la lógica de los mantenimientos.
// Me ayuda a mantener el código más ordenado, separando los cálculos de las pantallas.

// --- Función para calcular el estado de un mantenimiento ---
/**
 * Esta función es la que decide si un mantenimiento está `REALIZADO`, `PROXIMO` o `ATRASADO`.
 * Para hacerlo, se basa en una descripción que debe tener un formato como "Cada 5000 - 10000 km".
 */
fun calcularEstadoMantencion(
    kilometrajeActual: Int,     // El kilometraje que tiene el auto ahora.
    kilometrajeMantencion: Int, // El kilometraje en el que se hizo este mantenimiento.
    descripcion: String         // El texto de donde saco el rango de km.
): EstadoMantenimiento {
    // Esto es una "expresión regular" (regex). Es un mini-lenguaje para buscar patrones en texto.
    // Aquí busco el patrón "Cada [un número] - [otro número] km".
    val regex = Regex("""Cada (\d{1,6})\s*-\s*(\d{1-6}) km""")
    // Intento encontrar ese patrón en la descripción.
    val match = regex.find(descripcion)

    // Si lo encuentro, saco el primer número (minKm) y el segundo (maxKm).
    val minKm = match?.groups?.get(1)?.value?.toIntOrNull()
    val maxKm = match?.groups?.get(2)?.value?.toIntOrNull()

    // Si la descripción no tiene el formato correcto (ej: "Se cambió y listo"),
    // no puedo calcular nada, así que asumo que está REALIZADO y no necesita seguimiento.
    if (minKm == null || maxKm == null) return EstadoMantenimiento.REALIZADO

    // Calculo cuántos kilómetros han pasado desde que se hizo este mantenimiento.
    val diferencia = kilometrajeActual - kilometrajeMantencion

    // Ahora, clasifico el estado:
    return when {
        // Si la diferencia es menor que el rango mínimo, todavía no entra en la "zona de peligro".
        diferencia < minKm -> EstadoMantenimiento.REALIZADO
        // Si la diferencia está dentro del rango, es hora de empezar a preocuparse.
        diferencia in minKm..maxKm -> EstadoMantenimiento.PROXIMO
        // Si ya pasé el rango máximo, ¡estoy atrasado!
        else -> EstadoMantenimiento.ATRASADO
    }
}

// --- Función para calcular el progreso de un mantenimiento ---
/**
 * Esta función calcula un porcentaje (de 0.0 a 1.0) para la barra de progreso.
 * 0.0 significa que recién se hizo el mantenimiento.
 * 1.0 significa que ya llegué (o pasé) el kilometraje máximo recomendado.
 */
fun calcularProgresoMantencion(
    kilometrajeActual: Int,
    kilometrajeMantencion: Int,
    descripcion: String
): Float {
    // Uso la misma expresión regular de antes.
    val regex = Regex("""Cada (\d{1,6})\s*-\s*(\d{1,6}) km""")
    val match = regex.find(descripcion)

    // Para la barra de progreso, solo me interesa el límite máximo del rango.
    // Si no lo encuentro, no puedo calcular el progreso, así que devuelvo 0.
    val maxKm = match?.groups?.get(2)?.value?.toIntOrNull() ?: return 0f

    // Calculo cuántos kilómetros han pasado.
    val diferencia = kilometrajeActual - kilometrajeMantencion

    // Hago una regla de tres simple: (km recorridos) / (km totales del rango).
    val progreso = diferencia.toFloat() / maxKm.toFloat()

    // Me aseguro de que el resultado siempre esté entre 0.0 y 1.0.
    // Si me paso de `maxKm`, el progreso será 1.0 (100%), no más.
    return progreso.coerceIn(0f, 1f)
}
