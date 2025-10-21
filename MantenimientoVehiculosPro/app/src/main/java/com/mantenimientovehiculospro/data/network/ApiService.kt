package com.mantenimientovehiculospro.data.network

import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.model.Usuario
import com.mantenimientovehiculospro.data.model.Vehiculo
import retrofit2.http.*
import retrofit2.Response

interface ApiService {

    // Vehículos
    @GET("api/vehiculos/usuario/{usuarioId}")
    suspend fun obtenerVehiculos(@Path("usuarioId") usuarioId: Long): List<Vehiculo>

    @POST("api/vehiculos/usuario/{usuarioId}")
    suspend fun crearVehiculo(@Path("usuarioId") usuarioId: Long, @Body vehiculo: Vehiculo): Vehiculo

    @DELETE("api/vehiculos/{vehiculoId}")
    suspend fun eliminarVehiculo(@Path("vehiculoId") vehiculoId: Long): Response<Unit>

    @PUT("api/vehiculos/{vehiculoId}")
    suspend fun actualizarVehiculo(@Path("vehiculoId") vehiculoId: Long, @Body vehiculo: Vehiculo): Vehiculo

    // Mantenimientos
    @GET("api/mantenimientos/vehiculo/{vehiculoId}")
    suspend fun obtenerMantenimientos(@Path("vehiculoId") vehiculoId: Long): List<Mantenimiento>

    @POST("api/mantenimientos/vehiculo/{vehiculoId}")
    suspend fun crearMantenimiento(@Path("vehiculoId") vehiculoId: Long, @Body mantenimiento: Mantenimiento): Mantenimiento

    // Autenticación
    @POST("api/usuarios/login")
    suspend fun login(@Body usuario: Usuario): Usuario

    @POST("api/usuarios/registrar")
    suspend fun registrar(@Body usuario: Usuario): Usuario
}