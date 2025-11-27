package com.mantenimientovehiculospro.data.network

import android.content.Context
import com.mantenimientovehiculospro.MyApp
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

// RetrofitProvider centraliza la configuración de Retrofit para toda la app.
object RetrofitProvider {

    private val logger = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(logger)
        .build()

    private fun obtenerBaseUrl(context: Context): String {
        // --- CONFIGURACIÓN DE IP ---

        // ✅ Opción 1: IP para DESARROLLO POR USB (Método Recomendado)
        // Funciona en cualquier red junto al comando "adb reverse tcp:8080 tcp:8080"
        val ip = "127.0.0.1"

        // Opción 2: IP para EMULADOR de Android Studio
        // val ip = "10.0.2.2"

        // Opción 3: IP para TELÉFONO FÍSICO por Wi-Fi (requiere la IP de tu Mac en la red)
        // val ip = "192.168.100.105"

        return "http://$ip:8080/"
    }

    val instance: ApiService by lazy {
        val context = MyApp.instance.applicationContext
        Retrofit.Builder()
            .baseUrl(obtenerBaseUrl(context))
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}