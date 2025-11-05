package com.mantenimientovehiculospro.ui.screens

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

// === Estado de la UI ===
// Representa el estado de la pantalla de mantenimientos.
// Incluye:
// - isLoading: indica si se están cargando los datos
// - lista: lista de mantenimientos obtenidos del backend
// - error: mensaje de error en caso de fallo
data class MantenimientoUiState(
    val isLoading: Boolean = false,
    val lista: List<Mantenimiento> = emptyList(),
    val error: String? = null
)

// === ViewModel ===
// Maneja la lógica de negocio y el estado de la pantalla de mantenimientos.
// Extiende de AndroidViewModel porque podría necesitar acceso al contexto de la aplicación.
class MantenimientoViewModel(application: Application) : AndroidViewModel(application) {

    // Estado interno mutable
    private val _uiState = MutableStateFlow(MantenimientoUiState())

    // Estado expuesto a la UI como flujo inmutable
    val uiState: StateFlow<MantenimientoUiState> = _uiState

    // === Cargar mantenimientos ===
    // Llama al backend para obtener la lista de mantenimientos de un vehículo específico.
    fun cargarMantenimientos(vehiculoId: Long) {
        viewModelScope.launch {
            // Primero actualizo el estado a "cargando"
            _uiState.value = MantenimientoUiState(isLoading = true)
            try {
                // Llamo al backend usando Retrofit
                val lista = RetrofitProvider.instance.obtenerMantenimientos(vehiculoId)

                // Actualizo el estado con la lista obtenida
                _uiState.value = MantenimientoUiState(lista = lista)
            } catch (e: Exception) {
                // Si ocurre un error, actualizo el estado con un mensaje de error
                _uiState.value = MantenimientoUiState(error = "Error al cargar mantenimientos")
            }
        }
    }

    // === Limpiar error ===
    // Permite resetear el mensaje de error para que la UI no lo siga mostrando.
    fun limpiarError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}