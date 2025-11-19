package com.mantenimientovehiculospro.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query


@Dao
interface UsuarioDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertar(usuario: UsuarioEntity)

    @Query("SELECT * FROM usuarios LIMIT 1")
    suspend fun getUsuario(): UsuarioEntity?

    @Query("DELETE FROM usuarios")
    suspend fun borrarTodos()
}