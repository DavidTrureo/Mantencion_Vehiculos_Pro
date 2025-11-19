package com.mantenimientovehiculospro.data.model

import com.mantenimientovehiculospro.data.local.UsuarioEntity

data class Usuario(
    val id: Long? = null,
    val email: String,
    val password: String
)

fun Usuario.toEntity(): UsuarioEntity =
    UsuarioEntity(
        backendId = this.id,
        email = this.email,
        password = this.password
    )

fun UsuarioEntity.toUsuario(): Usuario =
    Usuario(
        id = this.backendId,
        email = this.email,
        password = this.password
    )