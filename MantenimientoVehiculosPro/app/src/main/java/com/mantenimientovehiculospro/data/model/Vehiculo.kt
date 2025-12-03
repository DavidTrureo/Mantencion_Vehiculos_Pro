package com.mantenimientovehiculospro.data.model

// Esta es la plantilla para un objeto Vehiculo.
// Representa un auto con todas sus características principales.
data class Vehiculo(
    // El ID único que le pone la base de datos a cada vehículo.
    // Es nulo cuando estoy creando un auto nuevo y todavía no lo he guardado.
    val id: Long? = null,

    // La marca del auto, por ejemplo: "Toyota", "Ford", "Nissan".
    val marca: String,

    // El modelo específico, como "Corolla", "Mustang", "Sentra".
    val modelo: String,

    // El año de fabricación del vehículo.
    val anio: Int,

    // El kilometraje actual del auto. Lo uso para saber cuándo toca el próximo mantenimiento.
    val kilometraje: Int,

    // El ID del usuario dueño de este vehículo.
    // Lo uso para asegurarme de que cada usuario solo vea sus propios autos.
    val propietarioId: Long? = null,

    // Aquí guardo el texto o URL que se convierte en el código QR.
    // Es nulo si el vehículo todavía no tiene un QR generado.
    val qrCode: String? = null
)
