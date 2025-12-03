package com.mantenimientovehiculospro.data.local

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

// Con esto creo o accedo al archivo de preferencias llamado "usuario_prefs".
// El 'by preferencesDataStore' es la magia de la librería para que funcione fácil.
val Context.dataStore by preferencesDataStore(name = "usuario_prefs")

// Este objeto lo uso para guardar y leer datos del usuario en el teléfono,
// como su ID después de iniciar sesión o la IP del servidor.
// Así no tengo que pedirle los datos a cada rato.
object UsuarioPreferences {

    // Estas son como las "etiquetas" que uso para guardar cada dato.
    private val USUARIO_ID = longPreferencesKey("usuario_id")
    private val IP_BACKEND = stringPreferencesKey("ip_backend")

    // Guardo el ID del usuario que me pasa la API cuando hace login.
    suspend fun guardarUsuarioId(context: Context, id: Long) {
        context.dataStore.edit { prefs ->
            prefs[USUARIO_ID] = id
        }
    }

    // Leo el ID del usuario que ya guardé antes.
    // Si no hay nada, devuelve null.
    suspend fun obtenerUsuarioId(context: Context): Long? {
        return context.dataStore.data.map { prefs ->
            prefs[USUARIO_ID]
        }.first()
    }

    // Borro el ID del usuario del DataStore. Lo uso para el "Cerrar Sesión".
    suspend fun cerrarSesion(context: Context) {
        context.dataStore.edit { prefs ->
            prefs.remove(USUARIO_ID)
        }
    }

    // Guardo la dirección IP del servidor que el usuario pone en la configuración.
    suspend fun guardarIpBackend(context: Context, ip: String) {
        context.dataStore.edit { prefs ->
            prefs[IP_BACKEND] = ip
        }
    }

    // Leo la IP que guardé.
    // La uso en Retrofit para saber a qué servidor conectar la app.
    suspend fun obtenerIpBackend(context: Context): String? {
        return context.dataStore.data.map { prefs ->
            prefs[IP_BACKEND]
        }.first()
    }
}
