package com.mantenimientovehiculospro.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

// Representa la tabla 'usuarios' en la base de datos.
// Define la estructura de los datos del usuario que se guardarán.
@Entity(tableName = "usuarios")
data class UsuarioEntity(

    // Clave primaria única para cada usuario en la tabla.
    @PrimaryKey
    val id: Long,

    // Almacena el correo electrónico del usuario.
    val email: String
)
