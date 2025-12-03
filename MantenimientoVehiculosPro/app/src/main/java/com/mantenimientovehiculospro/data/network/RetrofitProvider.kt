package com.mantenimientovehiculospro.data.network

import android.content.Context
import com.mantenimientovehiculospro.MyApp
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

// Este objeto es el que arma y configura Retrofit para toda la aplicación.
// Lo hago un 'object' para que solo exista una instancia y no se cree una nueva cada vez que la uso.
object RetrofitProvider {

    // Esto es un "interceptor" que me permite ver en la consola (en el Logcat)
    // todas las peticiones que la app le hace al servidor y lo que este responde.
    // Es súper útil para "chismosear" y ver si estoy enviando bien los datos o qué error me da la API.
    private val logger = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    // Aquí creo el cliente HTTP. Le agrego el "logger" para que me muestre el tráfico de red.
    private val client = OkHttpClient.Builder()
        .addInterceptor(logger)
        .build()

    // Esta función me devuelve la URL base del servidor.
    private fun obtenerBaseUrl(context: Context): String {
        // --- OJO: AQUÍ SE CONFIGURA LA IP DEL SERVIDOR ---
        // Dependiendo de dónde corra la app (emulador, teléfono por USB, teléfono por WiFi),
        // necesito usar una IP diferente. ¡Solo una debe estar sin comentar!

        // Opción 1: Para el teléfono conectado por USB (la más recomendada).
        // Antes de correr la app, tengo que ejecutar este comando en la terminal:
        // adb reverse tcp:8080 tcp:8080
        // Esto hace que el puerto 8080 del teléfono se conecte al 8080 de mi computador.
        val ip = "127.0.0.1"

        // Opción 2: Para el emulador de Android Studio.
        // El emulador tiene esta IP especial para "ver" el localhost de mi computador.
        // val ip = "10.0.2.2"

        // Opción 3: Para el teléfono por Wi-Fi.
        // Tengo que poner la IP que mi computador tiene en la red Wi-Fi.
        // Ojo: el teléfono y el computador deben estar en la misma red.
        // val ip = "192.168.1.10" // <-- ¡Acuérdate de cambiarla por la tuya!

        // Al final, armo la URL completa con el puerto del servidor.
        return "http://$ip:8080/"
    }

    // Esta es la variable mágica que voy a usar en toda la app para hacer llamadas a la API.
    // El 'by lazy' significa que todo este bloque de configuración de Retrofit
    // solo se va a ejecutar una vez, la primera vez que intente usar 'instance'.
    val instance: ApiService by lazy {
        // Necesito el 'context' para poder leer la URL base.
        val context = MyApp.instance.applicationContext

        Retrofit.Builder()
            // Le digo cuál es la URL de mi servidor.
            .baseUrl(obtenerBaseUrl(context))
            // Le pongo el cliente que creé arriba (con el logger).
            .client(client)
            // Le digo que use GSON para convertir los JSON de la API a mis clases de Kotlin (data class).
            .addConverterFactory(GsonConverterFactory.create())
            // Construyo el objeto Retrofit.
            .build()
            // Finalmente, le digo que use la interfaz 'ApiService' para saber qué llamadas puede hacer.
            .create(ApiService::class.java)
    }
}
