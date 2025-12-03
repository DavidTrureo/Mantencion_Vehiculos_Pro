package com.mantenimientovehiculospro.ui.screens

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

// Esta es la "plantilla" que guarda toda la información que necesita la pantalla de mantenimientos.
// La uso para saber si está cargando, para guardar la lista de mantenimientos o si hubo un error.
data class MantenimientoUiState(
    val isLoading: Boolean = false,              // Para saber si muestro el circulito de "cargando".
    val lista: List<Mantenimiento> = emptyList(), // Aquí guardo la lista de mantenimientos que me da la API.
    val error: String? = null                      // Si algo falla, aquí pongo el mensaje de error.
)

// Este es el ViewModel para la pantalla de Mantenimientos.
// Es el que se encarga de pedir los datos a la API y de manejar el estado de la pantalla.
class MantenimientoViewModel(application: Application) : AndroidViewModel(application) {

    // '_uiState' es el estado "privado" y "editable" que solo este ViewModel puede tocar.
    // Lo empiezo con un estado inicial vacío.
    private val _uiState = MutableStateFlow(MantenimientoUiState())

    // 'uiState' es la versión "pública" y de "solo lectura".
    // La pantalla "escucha" los cambios de aquí para saber cuándo tiene que redibujarse.
    val uiState: StateFlow<MantenimientoUiState> = _uiState

    // Esta es la función que la pantalla llama para pedir la lista de mantenimientos.
    fun cargarMantenimientos(vehiculoId: Long) {
        // Uso viewModelScope.launch para hacer la llamada a la API en segundo plano,
        // así la pantalla no se queda "congelada".
        viewModelScope.launch {
            // 1. Aviso que estoy empezando a cargar. La pantalla mostrará el circulito.
            _uiState.value = MantenimientoUiState(isLoading = true)

            try {
                // 2. Llamo a la API para que me dé la lista de mantenimientos de ese vehículo.
                val lista = RetrofitProvider.instance.obtenerMantenimientos(vehiculoId)

                // 3. Si todo sale bien, actualizo el estado con la lista que recibí.
                // La pantalla dejará de cargar y mostrará las tarjetas.
                _uiState.value = MantenimientoUiState(lista = lista)

            } catch (e: Exception) {
                // 4. Si algo falla (no hay internet, el servidor no responde, etc.),
                // actualizo el estado con un mensaje de error.
                _uiState.value = MantenimientoUiState(error = "No se pudieron cargar los mantenimientos.")
            }
        }
    }

    // Una función por si necesito limpiar el mensaje de error desde la pantalla.
    fun limpiarError() {
        // Creo una copia del estado actual, pero con el error en 'null'.
        _uiState.value = _uiState.value.copy(error = null)
    }
}
