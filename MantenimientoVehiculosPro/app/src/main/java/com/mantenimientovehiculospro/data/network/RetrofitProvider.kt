package com.mantenimientovehiculospro.data.network

import android.content.Context
import com.mantenimientovehiculospro.MyApp
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import kotlinx.coroutines.runBlocking
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitProvider {

    private val logger = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(logger)
        .build()

    private fun obtenerBaseUrl(context: Context): String {
        val ip = runBlocking {
            UsuarioPreferences.obtenerIpBackend(context)
        } ?: "10.0.2.2" // IP por defecto para emulador
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