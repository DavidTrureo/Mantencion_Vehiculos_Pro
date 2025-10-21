package com.mantenimientovehiculospro.ui.screens

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import com.mantenimientovehiculospro.data.local.predefinidas.obtenerMantencionesPredefinidas
import com.mantenimientovehiculospro.data.model.Vehiculo
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class AddVehiculoUiState(
    val marca: String = "",
    val modelo: String = "",
    val anio: String = "",
    val kilometraje: String = "",
    val vehiculoGuardado: Boolean = false,
    val mensaje: String? = null
)

class AddVehiculoViewModel(application: Application) : AndroidViewModel(application) {

    private val _uiState = MutableStateFlow(AddVehiculoUiState())
    val uiState: StateFlow<AddVehiculoUiState> = _uiState

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

    fun guardarVehiculo() {
        val context = getApplication<Application>().applicationContext

        viewModelScope.launch {
            val usuarioId = UsuarioPreferences.obtenerUsuarioId(context)
            if (usuarioId == null) {
                _uiState.value = _uiState.value.copy(mensaje = "No se pudo obtener el usuario")
                return@launch
            }

            val estado = _uiState.value
            val marca = estado.marca.trim()
            val modelo = estado.modelo.trim()
            val anio = estado.anio.toIntOrNull()
            val kilometraje = estado.kilometraje.toIntOrNull()

            if (marca.isEmpty() || modelo.isEmpty() || anio == null || kilometraje == null) {
                _uiState.value = estado.copy(mensaje = "Completa todos los campos correctamente")
                return@launch
            }

            val vehiculo = Vehiculo(
                marca = marca,
                modelo = modelo,
                anio = anio,
                kilometraje = kilometraje
            )

            try {
                // Crear vehículo
                val nuevoVehiculo = RetrofitProvider.instance.crearVehiculo(usuarioId, vehiculo)

                // Precargar mantenciones
                val mantenciones = obtenerMantencionesPredefinidas().map {
                    it.copy(vehiculoId = nuevoVehiculo.id ?: 0)
                }

                mantenciones.forEach {
                    RetrofitProvider.instance.crearMantenimiento(nuevoVehiculo.id ?: 0, it)
                }

                // Actualizar estado
                _uiState.value = estado.copy(
                    vehiculoGuardado = true,
                    mensaje = null
                )
            } catch (e: Exception) {
                _uiState.value = estado.copy(
                    mensaje = "Error al guardar vehículo: ${e.message}"
                )
            }
        }
    }
}