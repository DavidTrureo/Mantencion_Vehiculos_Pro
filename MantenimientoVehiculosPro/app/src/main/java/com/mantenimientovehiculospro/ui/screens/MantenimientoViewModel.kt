package com.mantenimientovehiculospro.ui.screens

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class MantenimientoUiState(
    val isLoading: Boolean = false,
    val lista: List<Mantenimiento> = emptyList(),
    val error: String? = null
)

class MantenimientoViewModel(application: Application) : AndroidViewModel(application) {

    private val _uiState = MutableStateFlow(MantenimientoUiState())
    val uiState: StateFlow<MantenimientoUiState> = _uiState

    fun cargarMantenimientos(vehiculoId: Long) {
        viewModelScope.launch {
            _uiState.value = MantenimientoUiState(isLoading = true)
            try {
                val lista = RetrofitProvider.instance.obtenerMantenimientos(vehiculoId)
                _uiState.value = MantenimientoUiState(lista = lista)
            } catch (e: Exception) {
                _uiState.value = MantenimientoUiState(error = "Error al cargar mantenimientos")
            }
        }
    }

    fun limpiarError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}