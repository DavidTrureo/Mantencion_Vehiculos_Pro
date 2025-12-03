package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.mantenimientovehiculospro.R
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import com.mantenimientovehiculospro.data.model.Usuario
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import com.mantenimientovehiculospro.ui.components.AppBackground
import kotlinx.coroutines.launch

// Esta es la pantalla para que un usuario nuevo pueda crear su cuenta.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegistroScreen(
    // La función que se ejecuta si el registro sale bien, para llevarlo a la app.
    onRegistroExitoso: () -> Unit,
    // La función para volver a la pantalla de inicio.
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope() // Para llamar a la API.
    // Para mostrar mensajes flotantes de error o éxito.
    val snackbarHostState = remember { SnackbarHostState() }

    // Estados para guardar lo que el usuario escribe.
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    AppBackground(backgroundImageResId = R.drawable.auto1) {
        Scaffold(
            snackbarHost = { SnackbarHost(snackbarHostState) },
            containerColor = Color.Transparent,
            modifier = Modifier.fillMaxSize()
        ) { padding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                // El botón de flecha para volver a la pantalla anterior.
                IconButton(
                    onClick = onBack,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                        contentDescription = "Volver",
                        tint = MaterialTheme.colorScheme.onBackground
                    )
                }

                // La columna con el formulario, centrado en la pantalla.
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 24.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Crear Cuenta",
                        style = MaterialTheme.typography.headlineLarge,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Spacer(modifier = Modifier.height(32.dp))

                    // Campo de texto para el correo.
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Correo electrónico") },
                        placeholder = { Text("ejemplo@correo.com") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Campo de texto para la contraseña.
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Contraseña") },
                        placeholder = { Text("Crea una contraseña segura") },
                        // Esto hace que la contraseña se vea como puntitos.
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    // El botón para intentar registrar al usuario.
                    Button(
                        onClick = {
                            scope.launch {
                                // Valido que no haya campos vacíos.
                                if (email.isBlank() || password.isBlank()) {
                                    snackbarHostState.showSnackbar("Completa todos los campos")
                                    return@launch
                                }
                                try {
                                    // Creo el objeto Usuario con los datos del formulario.
                                    val usuario = Usuario(email = email, password = password)
                                    // ¡Llamo a la API para registrar al usuario!
                                    val respuesta = RetrofitProvider.instance.registrar(usuario)

                                    // Si la API me devuelve un ID de usuario...
                                    if (respuesta.id != null) {
                                        // ...lo guardo en el teléfono.
                                        UsuarioPreferences.guardarUsuarioId(context, respuesta.id)
                                        snackbarHostState.showSnackbar("¡Registro exitoso!")
                                        // Y lo llevo a la pantalla principal de la app.
                                        onRegistroExitoso()
                                    } else {
                                        snackbarHostState.showSnackbar("Error: El servidor no devolvió un ID.")
                                    }
                                } catch (e: Exception) {
                                    // Si algo falla (ej: el email ya existe), muestro un error.
                                    snackbarHostState.showSnackbar("Error al registrar: ${e.message}")
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("REGISTRARSE")
                    }

                    // Botón de texto para volver a la pantalla anterior.
                    TextButton(
                        onClick = onBack,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("VOLVER", color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.7f))
                    }
                }
            }
        }
    }
}
