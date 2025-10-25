package com.mantenimientovehiculospro.data.network

import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.model.Usuario
import com.mantenimientovehiculospro.data.model.Vehiculo
import retrofit2.http.*
import retrofit2.Response

interface ApiService {

    @GET("vehiculos/usuario/{usuarioId}")
    suspend fun obtenerVehiculos(@Path("usuarioId") usuarioId: Long): List<Vehiculo>

    @POST("vehiculos/usuario/{usuarioId}")
    suspend fun crearVehiculo(@Path("usuarioId") usuarioId: Long, @Body vehiculo: Vehiculo): Vehiculo

    @DELETE("vehiculos/{vehiculoId}")
    suspend fun eliminarVehiculo(@Path("vehiculoId") vehiculoId: Long): Response<Unit>

    @PUT("vehiculos/{vehiculoId}")
    suspend fun actualizarVehiculo(@Path("vehiculoId") vehiculoId: Long, @Body vehiculo: Vehiculo): Vehiculo

    @GET("mantenimientos/vehiculo/{vehiculoId}")
    suspend fun obtenerMantenimientos(@Path("vehiculoId") vehiculoId: Long): List<Mantenimiento>

    @POST("mantenimientos/vehiculo/{vehiculoId}")
    suspend fun crearMantenimiento(@Path("vehiculoId") vehiculoId: Long, @Body mantenimiento: Mantenimiento): Mantenimiento

    @POST("usuarios/login")
    suspend fun login(@Body usuario: Usuario): Usuario

    @POST("usuarios/registrar")
    suspend fun registrar(@Body usuario: Usuario): Usuario
}