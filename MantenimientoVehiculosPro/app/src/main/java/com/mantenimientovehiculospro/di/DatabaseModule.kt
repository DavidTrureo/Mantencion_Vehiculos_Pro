package com.mantenimientovehiculospro.di

import android.content.Context
import androidx.room.Room
import com.mantenimientovehiculospro.data.local.AppDatabase
import com.mantenimientovehiculospro.data.local.UsuarioDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

// Módulo de Hilt para proveer las dependencias de la base de datos.
// Define cómo crear y proveer instancias para la inyección de dependencias.
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    // Provee una única instancia (Singleton) de AppDatabase para toda la aplicación.
    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "mantenimiento-vehiculos-pro-db"
        ).build()
    }

    // Provee una instancia de UsuarioDao a partir de la base de datos.
    @Provides
    fun provideUsuarioDao(appDatabase: AppDatabase): UsuarioDao {
        return appDatabase.usuarioDao()
    }
}
