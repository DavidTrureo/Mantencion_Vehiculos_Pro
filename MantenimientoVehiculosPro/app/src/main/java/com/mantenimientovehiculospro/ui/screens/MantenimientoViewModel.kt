package com.mantenimientovehiculospro.ui.screens

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.mantenimientovehiculospro.data.model.Mantenimiento
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class MantenimientoViewModel(application: Application) : AndroidViewModel(application) {

    private val _mantenimientos = MutableStateFlow<List<Mantenimiento>>(emptyList())
    val mantenimientos: StateFlow<List<Mantenimiento>> = _mantenimientos

    fun cargarMantenimientos(vehiculoId: Long) {
        viewModelScope.launch {
            try {
                val lista = RetrofitProvider.instance.obtenerMantenimientos(vehiculoId)
                _mantenimientos.value = lista
            } catch (e: Exception) {
                _mantenimientos.value = emptyList()
            }
        }
    }
}