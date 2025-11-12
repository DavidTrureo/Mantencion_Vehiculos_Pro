package com.mantenimientovehiculospro.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "usuarios")
data class UsuarioEntity(
    @PrimaryKey(autoGenerate = true)
    val localId: Long = 0,   // ID interno de Room

    val backendId: Long?,    // id que viene del backend (Usuario.id)
    val email: String,
    val password: String
)