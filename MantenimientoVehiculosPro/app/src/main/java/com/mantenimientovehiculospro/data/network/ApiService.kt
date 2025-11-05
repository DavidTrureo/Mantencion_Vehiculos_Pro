package com.mantenimientovehiculospro.data.network

import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.model.Usuario
import com.mantenimientovehiculospro.data.model.Vehiculo
import retrofit2.Response
import retrofit2.http.*

// Esta interfaz define todos los endpoints que uso para comunicarme con el backend.
// Cada función representa una operación HTTP (GET, POST, PUT, DELETE) sobre un recurso.
// Retrofit se encarga de implementar esta interfaz automáticamente.
interface ApiService {

    // 🚗 Vehículos

    // Obtengo todos los vehículos asociados a un usuario específico.
    @GET("vehiculos/usuario/{usuarioId}")
    suspend fun obtenerVehiculos(@Path("usuarioId") usuarioId: Long): List<Vehiculo>

    // Creo un nuevo vehículo para el usuario indicado.
    @POST("vehiculos/usuario/{usuarioId}")
    suspend fun crearVehiculo(@Path("usuarioId") usuarioId: Long, @Body vehiculo: Vehiculo): Vehiculo

    // Actualizo los datos de un vehículo existente.
    @PUT("vehiculos/{vehiculoId}")
    suspend fun actualizarVehiculo(@Path("vehiculoId") vehiculoId: Long, @Body vehiculo: Vehiculo): Vehiculo

    // Elimino un vehículo por su ID. Devuelve una respuesta vacía si es exitoso.
    @DELETE("vehiculos/{vehiculoId}")
    suspend fun eliminarVehiculo(@Path("vehiculoId") vehiculoId: Long): Response<Unit>

    // 🔧 Mantenimientos

    // Obtengo todos los mantenimientos registrados para un vehículo.
    @GET("mantenimientos/vehiculo/{vehiculoId}")
    suspend fun obtenerMantenimientos(@Path("vehiculoId") vehiculoId: Long): List<Mantenimiento>

    // Creo un nuevo mantenimiento para el vehículo indicado.
    @POST("mantenimientos/vehiculo/{vehiculoId}")
    suspend fun crearMantenimiento(@Path("vehiculoId") vehiculoId: Long, @Body mantenimiento: Mantenimiento): Mantenimiento

    // Obtengo un mantenimiento específico por su ID.
    @GET("mantenimientos/{id}")
    suspend fun obtenerMantenimientoPorId(@Path("id") id: Long): Mantenimiento

    // Actualizo los datos de un mantenimiento existente.
    @PUT("mantenimientos/{id}")
    suspend fun actualizarMantenimiento(@Path("id") id: Long, @Body mantenimiento: Mantenimiento): Response<Unit>

    // Elimino un mantenimiento por su ID.
    @DELETE("mantenimientos/{id}")
    suspend fun eliminarMantenimiento(@Path("id") id: Long): Response<Unit>

    // 👤 Usuarios

    // Inicio de sesión: envío el usuario y recibo los datos si son válidos.
    @POST("usuarios/login")
    suspend fun login(@Body usuario: Usuario): Usuario

    // Registro de nuevo usuario.
    @POST("usuarios/registrar")
    suspend fun registrar(@Body usuario: Usuario): Usuario
}