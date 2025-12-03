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

// Este es el ViewModel para la pantalla que muestra la lista de vehículos.
// Su única misión es pedirle a la API la lista de autos y dársela a la pantalla.
// Uso AndroidViewModel porque necesito el 'context' para leer el ID del usuario.
class VehiculoViewModel(application: Application) : AndroidViewModel(application) {

    // '_vehiculos' es el estado "privado" y "editable" donde guardo la lista de autos.
    private val _vehiculos = MutableStateFlow<List<Vehiculo>>(emptyList())

    // 'vehiculos' es la versión "pública" y de "solo lectura" que la pantalla va a observar.
    val vehiculos: StateFlow<List<Vehiculo>> = _vehiculos

    // El bloque 'init' se ejecuta automáticamente en cuanto se crea el ViewModel por primera vez.
    // Lo uso para que cargue la lista de vehículos sin que la pantalla se lo tenga que pedir.
    init {
        cargarVehiculos()
    }

    // Esta función es la que hace el trabajo de hablar con el servidor.
    private fun cargarVehiculos() {
        // Uso viewModelScope.launch para hacer la llamada en segundo plano.
        viewModelScope.launch {
            val context = getApplication<Application>().applicationContext

            // Primero, necesito saber qué usuario está usando la app.
            val usuarioId = UsuarioPreferences.obtenerUsuarioId(context)

            // Si tengo el ID del usuario...
            if (usuarioId != null) {
                try {
                    // ...llamo a la API para que me dé su lista de vehículos.
                    val lista = RetrofitProvider.instance.obtenerVehiculos(usuarioId)

                    // Si todo sale bien, actualizo el estado con la lista que recibí.
                    // La pantalla se redibujará para mostrar los autos.
                    _vehiculos.value = lista
                } catch (e: Exception) {
                    // Si algo falla (no hay internet, etc.), dejo la lista vacía para
                    // que la pantalla muestre el mensaje de "No tienes vehículos".
                    _vehiculos.value = emptyList()
                }
            }
        }
    }
}
