package com.mantenimientovehiculospro.data.model

data class Vehiculo(
    val id: Long? = null,
    val marca: String,
    val modelo: String,
    val anio: Int,
    val kilometraje: Int,
    val propietarioId: Long? = null,           // ✅ nuevo campo directo
    val propietario: Usuario? = null
)