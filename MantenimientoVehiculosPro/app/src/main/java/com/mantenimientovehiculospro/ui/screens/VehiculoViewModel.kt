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

class VehiculoViewModel(application: Application) : AndroidViewModel(application) {

    private val _vehiculos = MutableStateFlow<List<Vehiculo>>(emptyList())
    val vehiculos: StateFlow<List<Vehiculo>> = _vehiculos

    init {
        cargarVehiculos()
    }

    private fun cargarVehiculos() {
        viewModelScope.launch {
            val context = getApplication<Application>().applicationContext
            val usuarioId = UsuarioPreferences.obtenerUsuarioId(context)
            if (usuarioId != null) {
                try {
                    val lista = RetrofitProvider.instance.obtenerVehiculos(usuarioId)
                    _vehiculos.value = lista
                } catch (e: Exception) {
                    // Manejo de error opcional
                    _vehiculos.value = emptyList()
                }
            }
        }
    }
}