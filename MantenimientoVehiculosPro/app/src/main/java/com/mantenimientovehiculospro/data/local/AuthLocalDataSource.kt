package com.mantenimientovehiculospro.data.local

import android.content.Context
import com.mantenimientovehiculospro.data.model.Usuario
import com.mantenimientovehiculospro.data.model.toEntity
import com.mantenimientovehiculospro.data.model.toUsuario

class AuthLocalDataSource(context: Context) {

    private val usuarioDao = AppDatabase.getInstance(context).usuarioDao()

    suspend fun guardarUsuario(usuario: Usuario) {
        usuarioDao.insertar(usuario.toEntity())
    }

    suspend fun getUsuario(): Usuario? {
        return usuarioDao.getUsuario()?.toUsuario()
    }

    suspend fun logout() {
        usuarioDao.borrarTodos()
    }
}