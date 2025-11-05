package com.mantenimientovehiculospro.data.network

import android.content.Context
import com.mantenimientovehiculospro.MyApp
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

// Este objeto centraliza la configuración de Retrofit para toda la app.
// Lo uso para crear una instancia única de ApiService que se conecta al backend.
object RetrofitProvider {

    // Configuro un interceptor para registrar las peticiones HTTP en consola.
    // Esto me ayuda a depurar las llamadas a la API.
    private val logger = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    // Creo el cliente HTTP con el interceptor de logging.
    private val client = OkHttpClient.Builder()
        .addInterceptor(logger)
        .build()

    // Esta función obtiene la IP del backend desde las preferencias del usuario.
    // Si no hay IP guardada, uso "10.0.2.2" como IP por defecto para emulador Android.
    private fun obtenerBaseUrl(context: Context): String {
        val ip = runBlocking {
            UsuarioPreferences.obtenerIpBackend(context)
        } ?: "10.0.2.2" // IP por defecto para emulador
        return "http://$ip:8080/"
    }

    // Creo la instancia de Retrofit de forma lazy (solo cuando se necesita).
    // Uso el contexto de la aplicación para acceder a las preferencias.
    // Configuro Retrofit con la IP dinámica, el cliente HTTP y el convertidor Gson.
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