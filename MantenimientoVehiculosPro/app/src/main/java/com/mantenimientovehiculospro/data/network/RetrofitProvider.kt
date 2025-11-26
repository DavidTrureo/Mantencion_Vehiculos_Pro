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
// Se conecta al backend usando la IP guardada en preferencias o un valor por defecto.
object RetrofitProvider {

    // Interceptor para registrar las peticiones HTTP en consola (útil para depuración).
    private val logger = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    // Cliente HTTP con el interceptor de logging.
    private val client = OkHttpClient.Builder()
        .addInterceptor(logger)
        .build()

    // Obtiene la IP del backend.
    private fun obtenerBaseUrl(context: Context): String {
        // --- CONFIGURACIÓN DE IP ---
        // Descomenta la línea que necesites y comenta la otra.

        // Opción 1: IP para probar en tu TELÉFONO FÍSICO (asegúrate que sea la IP correcta de tu Mac)
        //val ip = "192.168.100.105"

        // Opción 2: IP para probar en el EMULADOR de Android Studio
         val ip = "10.0.2.2"

        return "http://$ip:8080/"
    }

    // Instancia única de ApiService con Retrofit.
    // Usa la IP dinámica obtenida de preferencias o el valor por defecto.
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
