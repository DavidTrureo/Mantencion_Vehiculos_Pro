package com.mantenimientovehiculospro.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

// Extension para acceder a DataStore desde cualquier Context
val Context.dataStore by preferencesDataStore(name = "usuario_prefs")

object UsuarioPreferences {

    // Claves para guardar datos
    private val USUARIO_ID = longPreferencesKey("usuario_id")
    private val IP_BACKEND = stringPreferencesKey("ip_backend")

    // Guardar ID del usuario
    suspend fun guardarUsuarioId(context: Context, id: Long) {
        context.dataStore.edit { prefs ->
            prefs[USUARIO_ID] = id
        }
    }

    // Obtener ID del usuario
    suspend fun obtenerUsuarioId(context: Context): Long? {
        return context.dataStore.data.map { prefs ->
            prefs[USUARIO_ID]
        }.first()
    }

    // Cerrar sesión (eliminar ID)
    suspend fun cerrarSesion(context: Context) {
        context.dataStore.edit { prefs ->
            prefs.remove(USUARIO_ID)
        }
    }

    // Guardar IP del backend
    suspend fun guardarIpBackend(context: Context, ip: String) {
        context.dataStore.edit { prefs ->
            prefs[IP_BACKEND] = ip
        }
    }

    // Obtener IP del backend
    suspend fun obtenerIpBackend(context: Context): String? {
        return context.dataStore.data.map { prefs ->
            prefs[IP_BACKEND]
        }.first()
    }
}