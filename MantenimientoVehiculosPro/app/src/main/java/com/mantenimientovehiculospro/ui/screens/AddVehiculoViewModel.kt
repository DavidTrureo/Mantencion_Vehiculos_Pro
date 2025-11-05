package com.mantenimientovehiculospro.ui.screens

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import com.mantenimientovehiculospro.data.model.Vehiculo
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import retrofit2.HttpException

// === Estado de la UI ===
// Esta data class representa el estado de la pantalla "Añadir Vehículo".
// Contiene los campos del formulario, un flag para saber si se guardó el vehículo
// y un mensaje opcional para mostrar errores o confirmaciones.
data class AddVehiculoUiState(
    val marca: String = "",
    val modelo: String = "",
    val anio: String = "",
    val kilometraje: String = "",
    val vehiculoGuardado: Boolean = false,
    val mensaje: String? = null
)

// === ViewModel ===
// Maneja la lógica de la pantalla "Añadir Vehículo".
// Extiende de AndroidViewModel porque necesita acceso al contexto de la aplicación
// (para leer las preferencias del usuario).
class AddVehiculoViewModel(application: Application) : AndroidViewModel(application) {

    // Estado interno mutable (privado)
    private val _uiState = MutableStateFlow(AddVehiculoUiState())

    // Estado expuesto a la UI como flujo inmutable
    val uiState: StateFlow<AddVehiculoUiState> = _uiState

    // === Funciones para actualizar los campos del formulario ===
    fun onMarcaChange(value: String) {
        _uiState.value = _uiState.value.copy(marca = value)
    }

    fun onModeloChange(value: String) {
        _uiState.value = _uiState.value.copy(modelo = value)
    }

    fun onAnioChange(value: String) {
        _uiState.value = _uiState.value.copy(anio = value)
    }

    fun onKilometrajeChange(value: String) {
        _uiState.value = _uiState.value.copy(kilometraje = value)
    }

    // === Guardar vehículo ===
    // Esta función valida los datos ingresados y llama al backend para guardar el vehículo.
    fun guardarVehiculo() {
        val context = getApplication<Application>().applicationContext

        viewModelScope.launch {
            // Obtengo el ID del usuario desde DataStore
            val usuarioId = UsuarioPreferences.obtenerUsuarioId(context)
            if (usuarioId == null) {
                _uiState.value = _uiState.value.copy(mensaje = "No se pudo obtener el usuario")
                return@launch
            }

            // Obtengo el estado actual del formulario
            val estado = _uiState.value
            val marca = estado.marca.trim()
            val modelo = estado.modelo.trim()
            val anio = estado.anio.toIntOrNull()
            val kilometraje = estado.kilometraje.toIntOrNull()

            // Validación de campos
            if (marca.isEmpty() || modelo.isEmpty() || anio == null || kilometraje == null) {
                _uiState.value = estado.copy(mensaje = "Completa todos los campos correctamente")
                return@launch
            }

            // Creo el objeto Vehiculo listo para enviar al backend
            val vehiculo = Vehiculo(
                marca = marca,
                modelo = modelo,
                anio = anio,
                kilometraje = kilometraje,
                propietarioId = usuarioId
            )

            try {
                // Llamo al endpoint para crear el vehículo
                RetrofitProvider.instance.crearVehiculo(usuarioId, vehiculo)

                // Actualizo el estado indicando éxito
                _uiState.value = estado.copy(
                    vehiculoGuardado = true,
                    mensaje = null
                )
            } catch (e: HttpException) {
                // Manejo de errores HTTP (ej: 400, 500)
                val errorBody = e.response()?.errorBody()?.string()
                _uiState.value = estado.copy(
                    mensaje = "Error ${e.code()}: ${errorBody ?: e.message()}"
                )
            } catch (e: Exception) {
                // Manejo de errores inesperados (ej: sin conexión)
                _uiState.value = estado.copy(
                    mensaje = "Error inesperado: ${e.message}"
                )
            }
        }
    }
}