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

// ViewModel encargado de manejar la lógica de la lista de vehículos.
// Extiende de AndroidViewModel porque necesita acceso al contexto de la aplicación
// (para leer el usuario desde DataStore).
class VehiculoViewModel(application: Application) : AndroidViewModel(application) {

    // Estado interno mutable que contiene la lista de vehículos
    private val _vehiculos = MutableStateFlow<List<Vehiculo>>(emptyList())

    // Estado expuesto a la UI como flujo inmutable
    val vehiculos: StateFlow<List<Vehiculo>> = _vehiculos

    // Al inicializar el ViewModel, cargo automáticamente los vehículos del usuario
    init {
        cargarVehiculos()
    }

    // Función privada que obtiene los vehículos desde el backend
    private fun cargarVehiculos() {
        viewModelScope.launch {
            val context = getApplication<Application>().applicationContext

            // Obtengo el ID del usuario desde DataStore
            val usuarioId = UsuarioPreferences.obtenerUsuarioId(context)

            if (usuarioId != null) {
                try {
                    // Llamo al backend para obtener la lista de vehículos del usuario
                    val lista = RetrofitProvider.instance.obtenerVehiculos(usuarioId)

                    // Actualizo el estado con la lista recibida
                    _vehiculos.value = lista
                } catch (e: Exception) {
                    // Si ocurre un error (ej: sin conexión), dejo la lista vacía
                    _vehiculos.value = emptyList()
                }
            }
        }
    }
}