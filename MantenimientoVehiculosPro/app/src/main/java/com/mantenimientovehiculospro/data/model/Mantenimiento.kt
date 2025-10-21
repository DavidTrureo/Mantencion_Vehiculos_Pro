package com.mantenimientovehiculospro.data.model

// El enum debe coincidir con el backend
enum class EstadoMantenimiento {
    REALIZADO, // Verde
    PROXIMO,   // Amarillo
    ATRASADO   // Rojo
}

data class Mantenimiento(
    val id: Long?,
    val tipo: String = "",                    // ✅ Nuevo campo agregado
    val descripcion: String = "",
    val fecha: String? = null,                // ✅ Puede ser nula
    val kilometraje: Int = 0,
    val estado: EstadoMantenimiento = EstadoMantenimiento.PROXIMO, // ✅ Valor por defecto
    val vehiculoId: Long = 0                  // ✅ Necesario para POST
)