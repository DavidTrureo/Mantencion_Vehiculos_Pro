package com.mantenimientovehiculospro.data.network

import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.model.Usuario
import com.mantenimientovehiculospro.data.model.Vehiculo
import retrofit2.Response
import retrofit2.http.*

// Esta es como la "chuleta" o el "manual" de todas las operaciones que puedo hacer con la API.
// Cada función aquí es una petición al servidor. Retrofit se encarga de la magia por detrás.
interface ApiService {

    // --- SECCIÓN DE VEHÍCULOS ---

    // Pide al servidor la lista de todos los vehículos de un usuario específico.
    @GET("vehiculos/usuario/{usuarioId}")
    suspend fun obtenerVehiculos(@Path("usuarioId") usuarioId: Long): List<Vehiculo>

    // Pide un solo vehículo usando su ID.
    @GET("vehiculos/{vehiculoId}")
    suspend fun obtenerVehiculoPorId(@Path("vehiculoId") vehiculoId: Long): Vehiculo

    // Envía un vehículo nuevo al servidor para guardarlo en la base de datos.
    // Le paso el ID del usuario dueño y el objeto del vehículo en el cuerpo (@Body).
    @POST("vehiculos/usuario/{usuarioId}")
    suspend fun crearVehiculo(
        @Path("usuarioId") usuarioId: Long,
        @Body vehiculo: Vehiculo
    ): Vehiculo

    // Actualiza los datos de un vehículo que ya existe.
    @PUT("vehiculos/{vehiculoId}")
    suspend fun actualizarVehiculo(
        @Path("vehiculoId") vehiculoId: Long,
        @Body vehiculo: Vehiculo
    ): Vehiculo

    // Borra un vehículo de la base de datos usando su ID.
    @DELETE("vehiculos/{vehiculoId}")
    suspend fun eliminarVehiculo(@Path("vehiculoId") vehiculoId: Long): Response<Unit>


    // --- SECCIÓN DE MANTENIMIENTOS ---

    // Pide la lista de todos los mantenimientos de un vehículo específico.
    @GET("mantenimientos/vehiculo/{vehiculoId}")
    suspend fun obtenerMantenimientos(@Path("vehiculoId") vehiculoId: Long): List<Mantenimiento>

    // Guarda un mantenimiento nuevo para un vehículo.
    @POST("mantenimientos/vehiculo/{vehiculoId}")
    suspend fun crearMantenimiento(
        @Path("vehiculoId") vehiculoId: Long,
        @Body mantenimiento: Mantenimiento
    ): Mantenimiento

    // Pide un solo mantenimiento usando su ID. Útil para la pantalla de "Editar".
    @GET("mantenimientos/{id}")
    suspend fun obtenerMantenimientoPorId(@Path("id") id: Long): Mantenimiento

    // Actualiza los datos de un mantenimiento que ya existe.
    @PUT("mantenimientos/{id}")
    suspend fun actualizarMantenimiento(
        @Path("id") id: Long,
        @Body mantenimiento: Mantenimiento
    ): Response<Unit>

    // Borra un mantenimiento de la base de datos.
    @DELETE("mantenimientos/{id}")
    suspend fun eliminarMantenimiento(@Path("id") id: Long): Response<Unit>


    // --- SECCIÓN DE USUARIOS ---

    // Envía el email y la contraseña para ver si el usuario existe y la clave es correcta (iniciar sesión).
    @POST("usuarios/login")
    suspend fun login(@Body usuario: Usuario): Usuario

    // Envía los datos de un usuario nuevo para crearlo en el sistema.
    @POST("usuarios/registrar")
    suspend fun registrar(@Body usuario: Usuario): Usuario
}
