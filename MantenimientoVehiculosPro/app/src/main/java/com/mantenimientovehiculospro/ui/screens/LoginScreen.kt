package com.mantenimientovehiculospro.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.mantenimientovehiculospro.data.local.UsuarioPreferences
import com.mantenimientovehiculospro.data.model.Usuario
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import com.mantenimientovehiculospro.ui.components.BotonAccion
import com.mantenimientovehiculospro.ui.theme.InfoBlue
import com.mantenimientovehiculospro.ui.theme.NeutralGray
import kotlinx.coroutines.launch
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onBack: () -> Unit
) {
    // Obtengo el contexto de la aplicación y preparo un scope para corrutinas
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    // Variables de estado que guardan lo que el usuario escribe en los campos
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    // Uso un Scaffold para estructurar la pantalla con barra superior y snackbar
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Iniciar Sesión") },
                navigationIcon = {
                    // Botón de retroceso en la barra superior
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        // Organizo el contenido en una columna con espaciado
        Column(
            modifier = Modifier
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Campo de texto para el correo electrónico
            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Correo electrónico") },
                placeholder = { Text("ejemplo@correo.com") },
                modifier = Modifier.fillMaxWidth()
            )

            // Campo de texto para la contraseña (oculta con puntos)
            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Contraseña") },
                placeholder = { Text("••••••••") },
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth()
            )

            // Botón personalizado para ingresar
            BotonAccion(
                texto = "Ingresar",
                colorFondo = InfoBlue,
                onClick = {
                    scope.launch {
                        // Valido que los campos no estén vacíos
                        if (email.isBlank() || password.isBlank()) {
                            snackbarHostState.showSnackbar("Completa todos los campos")
                            return@launch
                        }

                        try {
                            // Creo un objeto Usuario y hago la llamada al backend con Retrofit
                            val usuario = Usuario(email = email, password = password)
                            val respuesta = RetrofitProvider.instance.login(usuario)

                            // Si recibo un ID válido, lo guardo en preferencias y navego
                            respuesta.id?.let {
                                UsuarioPreferences.guardarUsuarioId(context, it)
                                onLoginSuccess()
                            } ?: snackbarHostState.showSnackbar("Error: ID de usuario no recibido")
                        } catch (e: Exception) {
                            // Si ocurre un error, muestro un mensaje en el snackbar
                            snackbarHostState.showSnackbar("Credenciales inválidas o usuario no existe")
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth()
            )

            // Botón para volver atrás
            BotonAccion(
                texto = "Volver",
                colorFondo = NeutralGray,
                onClick = onBack,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}