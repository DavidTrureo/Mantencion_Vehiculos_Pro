package com.mantenimientovehiculospro.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

// Define la base de datos principal de la app con Room.
// Registra las tablas (entities) y la versión de la base de datos.
@Database(entities = [UsuarioEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {

    // Provee el DAO para acceder a la tabla de usuarios.
    abstract fun usuarioDao(): UsuarioDao
}
