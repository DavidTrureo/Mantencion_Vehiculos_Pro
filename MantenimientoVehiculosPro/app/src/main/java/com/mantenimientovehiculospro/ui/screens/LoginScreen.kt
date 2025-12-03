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

// Esta es la pantalla para que el usuario inicie sesión con su email y contraseña.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    // La función que se ejecuta si el login es exitoso, para llevarlo a la siguiente pantalla.
    onLoginSuccess: () -> Unit,
    // La función para volver a la pantalla de inicio.
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope() // Para llamar a la API en segundo plano.
    // El 'snackbar' es para mostrar mensajes emergentes, como "Completa todos los campos".
    val snackbarHostState = remember { SnackbarHostState() }

    // Estados para guardar lo que el usuario escribe en los campos de texto.
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    AppBackground(backgroundImageResId = R.drawable.auto2) {
        Scaffold(
            snackbarHost = { SnackbarHost(snackbarHostState) },
            containerColor = Color.Transparent, // Para que se vea la imagen de fondo.
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

                // La columna principal con el formulario, centrado en la pantalla.
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 24.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Iniciar Sesión",
                        style = MaterialTheme.typography.headlineLarge,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Spacer(modifier = Modifier.height(32.dp))

                    // Campo de texto para el correo electrónico.
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Correo electrónico") },
                        placeholder = { Text("ejemplo@correo.com") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true // Para que el teclado no muestre el botón "Enter" de varias líneas.
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Campo de texto para la contraseña.
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Contraseña") },
                        placeholder = { Text("••••••••") },
                        // Esto hace que se vean puntitos en lugar de las letras de la contraseña.
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    // El botón para intentar iniciar sesión.
                    Button(
                        onClick = {
                            // Inicio una corrutina para hacer la llamada a la API sin bloquear la pantalla.
                            scope.launch {
                                // Primero, valido que los campos no estén vacíos.
                                if (email.isBlank() || password.isBlank()) {
                                    snackbarHostState.showSnackbar("Completa todos los campos")
                                    return@launch // Salgo de la corrutina si faltan datos.
                                }
                                try {
                                    // Creo un objeto Usuario con los datos para enviarlo a la API.
                                    val usuario = Usuario(email = email, password = password)
                                    // ¡Llamo a la API para hacer login!
                                    val respuesta = RetrofitProvider.instance.login(usuario)

                                    // Si la API me devuelve un ID...
                                    respuesta.id?.let {
                                        // ...lo guardo en el teléfono para no tener que pedirlo de nuevo.
                                        UsuarioPreferences.guardarUsuarioId(context, it)
                                        // Y ejecuto la función para ir a la siguiente pantalla.
                                        onLoginSuccess()
                                    } ?: snackbarHostState.showSnackbar("Error: ID de usuario no recibido")

                                } catch (e: Exception) {
                                    // Si la API me da un error (ej: contraseña incorrecta), muestro un mensaje.
                                    snackbarHostState.showSnackbar("Credenciales inválidas o el usuario no existe")
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("INGRESAR")
                    }

                    // Un botón de texto para volver a la pantalla anterior.
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
