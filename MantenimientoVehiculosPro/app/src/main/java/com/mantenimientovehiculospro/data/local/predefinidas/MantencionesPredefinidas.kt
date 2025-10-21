package com.mantenimientovehiculospro.data.local.predefinidas

import com.mantenimientovehiculospro.data.model.EstadoMantenimiento
import com.mantenimientovehiculospro.data.model.Mantenimiento

fun obtenerMantencionesPredefinidas(): List<Mantenimiento> {
    return listOf(
        Mantenimiento(null, "Cambio de aceite del motor", "Cada 5.000 - 10.000 km", null, 0, EstadoMantenimiento.PROXIMO, 0),
        Mantenimiento(null, "Revisión de frenos", "Cada 5.000 - 10.000 km", null, 0, EstadoMantenimiento.PROXIMO, 0),
        Mantenimiento(null, "Cambio de batería", "Cada 30.000 - 50.000 km", null, 0, EstadoMantenimiento.PROXIMO, 0),
        Mantenimiento(null, "Revisión de neumáticos", "Cada 10.000 - 15.000 km", null, 0, EstadoMantenimiento.PROXIMO, 0),
        Mantenimiento(null, "Cambio de bujías", "Cada 20.000 - 30.000 km", null, 0, EstadoMantenimiento.PROXIMO, 0),
        Mantenimiento(null, "Revisión de suspensión", "Cada 30.000 - 50.000 km", null, 0, EstadoMantenimiento.PROXIMO, 0),
        Mantenimiento(null, "Cambio de filtro de aire", "Cada 15.000 - 30.000 km", null, 0, EstadoMantenimiento.PROXIMO, 0),
        Mantenimiento(null, "Limpieza de inyectores", "Cada 20.000 - 30.000 km", null, 0, EstadoMantenimiento.PROXIMO, 0)
    )
}