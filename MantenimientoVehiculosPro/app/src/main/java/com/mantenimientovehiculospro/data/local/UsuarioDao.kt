package com.mantenimientovehiculospro.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

// DAO (Data Access Object) para la tabla de usuarios.
// Define las operaciones de base de datos (consultas, inserciones, etc.).
@Dao
interface UsuarioDao {

    // Inserta o reemplaza un usuario en la base de datos.
    // 'OnConflictStrategy.REPLACE' actualiza el registro si ya existe.
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUsuario(usuario: UsuarioEntity)

    // Obtiene el único usuario de la tabla.
    // Devuelve un Flow para observar cambios en tiempo real.
    @Query("SELECT * FROM usuarios LIMIT 1")
    fun getUsuario(): Flow<UsuarioEntity?>
}
