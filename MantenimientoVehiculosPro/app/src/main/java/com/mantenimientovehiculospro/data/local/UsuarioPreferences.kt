package com.mantenimientovehiculospro.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

// Esta extensión me permite acceder a DataStore desde cualquier Context.
// Uso "usuario_prefs" como nombre del archivo de preferencias.
val Context.dataStore by preferencesDataStore(name = "usuario_prefs")

// Este objeto centraliza el acceso a las preferencias del usuario.
// Aquí guardo y recupero datos como el ID del usuario y la IP del backend.
object UsuarioPreferences {

    // Defino las claves que uso para guardar los datos.
    private val USUARIO_ID = longPreferencesKey("usuario_id")
    private val IP_BACKEND = stringPreferencesKey("ip_backend")

    // Guardo el ID del usuario en DataStore.
    // Lo uso después para identificar al usuario en las llamadas al backend.
    suspend fun guardarUsuarioId(context: Context, id: Long) {
        context.dataStore.edit { prefs ->
            prefs[USUARIO_ID] = id
        }
    }

    // Recupero el ID del usuario desde DataStore.
    // Devuelvo null si no está guardado.
    suspend fun obtenerUsuarioId(context: Context): Long? {
        return context.dataStore.data.map { prefs ->
            prefs[USUARIO_ID]
        }.first()
    }

    // Elimino el ID del usuario, útil para cerrar sesión.
    suspend fun cerrarSesion(context: Context) {
        context.dataStore.edit { prefs ->
            prefs.remove(USUARIO_ID)
        }
    }

    // Guardo la IP del backend que el usuario configura.
    // Esto me permite conectarme a diferentes servidores según el entorno.
    suspend fun guardarIpBackend(context: Context, ip: String) {
        context.dataStore.edit { prefs ->
            prefs[IP_BACKEND] = ip
        }
    }

    // Recupero la IP del backend desde DataStore.
    // Si no está configurada, uso una IP por defecto en RetrofitProvider.
    suspend fun obtenerIpBackend(context: Context): String? {
        return context.dataStore.data.map { prefs ->
            prefs[IP_BACKEND]
        }.first()
    }
}