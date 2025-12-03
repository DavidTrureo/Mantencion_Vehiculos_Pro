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

// Esta es una "plantilla" que guarda todos los datos de la pantalla de añadir vehículo.
// La uso para tener en un solo lugar la información que el usuario escribe,
// si el vehículo ya se guardó, o si hay algún mensaje de error que mostrar.
data class AddVehiculoUiState(
    val marca: String = "",
    val modelo: String = "",
    val anio: String = "",
    val kilometraje: String = "",
    val vehiculoGuardado: Boolean = false, // Lo pongo en 'true' cuando se guarda bien.
    val mensaje: String? = null // Para mostrar errores o avisos.
)

// Este es el ViewModel. Es el que piensa y hace todo el trabajo pesado.
// La pantalla (la View) solo se preocupa de mostrar los datos que el ViewModel le da
// y de avisarle cuando el usuario hace algo (como escribir o presionar un botón).
// Uso AndroidViewModel porque necesito el 'context' para leer el ID del usuario guardado.
class AddVehiculoViewModel(application: Application) : AndroidViewModel(application) {

    // '_uiState' es el estado "privado" y "editable". Solo el ViewModel puede cambiarlo.
    // Lo inicializo con un estado vacío.
    private val _uiState = MutableStateFlow(AddVehiculoUiState())

    // 'uiState' es la versión "pública" y de "solo lectura" del estado.
    // La pantalla "escucha" los cambios de aquí para redibujarse, pero no puede modificarlo directamente.
    val uiState: StateFlow<AddVehiculoUiState> = _uiState

    // --- Funciones que la pantalla llama cuando el usuario escribe algo ---
    // Cada vez que cambia el texto en un campo, actualizo el estado.
    // El .copy() crea un nuevo estado con solo el valor que cambió, manteniendo los demás.
    fun onMarcaChange(value: String) {
        _uiState.value = _uiState.value.copy(marca = value)
    }

    fun onModeloChange(value: String) {
        _uiState.value = _uiState.value.copy(modelo = value)
    }

    fun onAnioChange(value: String) {
        // Ojo: Guardo el año y el km como String para que el usuario pueda escribir,
        // luego los convierto a número antes de guardarlos.
        _uiState.value = _uiState.value.copy(anio = value)
    }

    fun onKilometrajeChange(value: String) {
        _uiState.value = _uiState.value.copy(kilometraje = value)
    }

    // --- La función principal: Guardar el Vehículo ---
    fun guardarVehiculo() {
        // Uso viewModelScope.launch para hacer operaciones en segundo plano,
        // como llamar a la API, sin bloquear la pantalla de la app.
        viewModelScope.launch {
            // Primero, necesito saber qué usuario está guardando el vehículo.
            val usuarioId = UsuarioPreferences.obtenerUsuarioId(getApplication())
            if (usuarioId == null) {
                _uiState.value = _uiState.value.copy(mensaje = "Error: No se encontró el usuario. Intenta iniciar sesión de nuevo.")
                return@launch
            }

            // Agarro los datos actuales del formulario.
            val estadoActual = _uiState.value
            val marca = estadoActual.marca.trim() // .trim() para quitar espacios en blanco al inicio y final.
            val modelo = estadoActual.modelo.trim()
            val anio = estadoActual.anio.toIntOrNull() // Intento convertir el texto a número. Si no se puede, da null.
            val kilometraje = estadoActual.kilometraje.toIntOrNull()

            // Valido que todos los campos estén llenos y correctos.
            if (marca.isEmpty() || modelo.isEmpty() || anio == null || kilometraje == null) {
                _uiState.value = estadoActual.copy(mensaje = "Error: Por favor, completa todos los campos.")
                return@launch
            }

            // Si todo está bien, creo el objeto Vehiculo que le voy a mandar a la API.
            val vehiculoParaEnviar = Vehiculo(
                marca = marca,
                modelo = modelo,
                anio = anio,
                kilometraje = kilometraje,
                propietarioId = usuarioId // Le asigno el ID del dueño.
            )

            try {
                // ¡Llamo a la API para crear el vehículo!
                RetrofitProvider.instance.crearVehiculo(usuarioId, vehiculoParaEnviar)

                // Si la llamada a la API no lanzó un error, todo salió bien.
                // Actualizo el estado para avisarle a la pantalla que ya se guardó.
                _uiState.value = estadoActual.copy(
                    vehiculoGuardado = true,
                    mensaje = null // Limpio cualquier mensaje de error anterior.
                )
            } catch (e: Exception) {
                // Si algo sale mal (no hay internet, el servidor está caído, etc.),
                // actualizo el estado con un mensaje de error para que lo vea el usuario.
                _uiState.value = estadoActual.copy(
                    mensaje = "Error al guardar el vehículo: ${e.message}"
                )
            }
        }
    }
}
