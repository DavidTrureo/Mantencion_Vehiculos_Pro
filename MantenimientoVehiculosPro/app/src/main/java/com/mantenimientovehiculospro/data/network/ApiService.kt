package com.mantenimientovehiculospro.data.network

import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.model.Usuario
import com.mantenimientovehiculospro.data.model.Vehiculo
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // 🚗 Vehículos
    @GET("vehiculos/usuario/{usuarioId}")
    suspend fun obtenerVehiculos(@Path("usuarioId") usuarioId: Long): List<Vehiculo>

    @POST("vehiculos/usuario/{usuarioId}")
    suspend fun crearVehiculo(@Path("usuarioId") usuarioId: Long, @Body vehiculo: Vehiculo): Vehiculo

    @PUT("vehiculos/{vehiculoId}")
    suspend fun actualizarVehiculo(@Path("vehiculoId") vehiculoId: Long, @Body vehiculo: Vehiculo): Vehiculo

    @DELETE("vehiculos/{vehiculoId}")
    suspend fun eliminarVehiculo(@Path("vehiculoId") vehiculoId: Long): Response<Unit>

    // 🔧 Mantenimientos
    @GET("mantenimientos/vehiculo/{vehiculoId}")
    suspend fun obtenerMantenimientos(@Path("vehiculoId") vehiculoId: Long): List<Mantenimiento>

    @POST("mantenimientos/vehiculo/{vehiculoId}")
    suspend fun crearMantenimiento(@Path("vehiculoId") vehiculoId: Long, @Body mantenimiento: Mantenimiento): Mantenimiento

    @GET("mantenimientos/{id}")
    suspend fun obtenerMantenimientoPorId(@Path("id") id: Long): Mantenimiento

    @PUT("mantenimientos/{id}")
    suspend fun actualizarMantenimiento(@Path("id") id: Long, @Body mantenimiento: Mantenimiento): Response<Unit>

    @DELETE("mantenimientos/{id}")
    suspend fun eliminarMantenimiento(@Path("id") id: Long): Response<Unit>

    // 👤 Usuarios
    @POST("usuarios/login")
    suspend fun login(@Body usuario: Usuario): Usuario

    @POST("usuarios/registrar")
    suspend fun registrar(@Body usuario: Usuario): Usuario
}