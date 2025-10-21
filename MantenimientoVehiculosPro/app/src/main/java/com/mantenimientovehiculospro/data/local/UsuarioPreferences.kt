package com.mantenimientovehiculospro.data.local

import android.content.Context
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

val Context.dataStore by preferencesDataStore(name = "usuario_prefs")

object UsuarioPreferences {
    private val USUARIO_ID = longPreferencesKey("usuario_id")

    suspend fun guardarUsuarioId(context: Context, id: Long) {
        context.dataStore.edit { prefs ->
            prefs[USUARIO_ID] = id
        }
    }

    suspend fun obtenerUsuarioId(context: Context): Long? {
        return context.dataStore.data.map { prefs ->
            prefs[USUARIO_ID]
        }.first()
    }

    suspend fun cerrarSesion(context: Context) {
        context.dataStore.edit { prefs ->
            prefs.remove(USUARIO_ID)
        }
    }
}