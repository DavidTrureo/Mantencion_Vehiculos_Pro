package com.mantenimientovehiculospro.data.model

// Esto define los3 posibles estados de un mantenimiento.
// Es importante que los nombres (REALIZADO, PROXIMO, ATRASADO)
// sean exactamente los mismos que me manda el servidor (el backend).
enum class EstadoMantenimiento {
    REALIZADO, // Se va a ver en verde en la app
    PROXIMO,   // Se va a ver en amarillo
    ATRASADO   // Se va a ver en rojo
}

// Esta es la "plantilla" para un objeto de tipo Mantenimiento.
// Contiene todos los datos que necesito para guardar o mostrar
// la información de un mantenimiento que le hago a un auto.
data class Mantenimiento(
    // El ID que le pone la base de datos. Puede ser nulo si estoy creando uno nuevo y todavía no lo guardo.
    val id: Long?,

    // El tipo de mantenimiento, por ejemplo: "Cambio de aceite", "Revisión de frenos".
    val tipo: String = "",

    // Una descripción con más detalles de lo que se hizo, como "Se usó aceite sintético 5W-30".
    val descripcion: String = "",

    // La fecha en que se hizo o se hará el mantenimiento. La guardo como texto.
    val fecha: String? = null,

    // A qué kilometraje se le hizo este mantenimiento al auto.
    val kilometraje: Int = 0,

    // Para saber si ya se hizo, está por vencer o ya me pasé. Por defecto es PROXIMO.
    val estado: EstadoMantenimiento = EstadoMantenimiento.PROXIMO,

    // El ID del vehículo al que le pertenece este mantenimiento.
    // Lo necesito para que la API sepa a qué auto asociarlo cuando creo uno nuevo.
    val vehiculoId: Long = 0
)
