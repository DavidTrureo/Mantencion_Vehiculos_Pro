package com.mantenimientovehiculospro.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat

// Esta es la pantalla que se encarga de mostrar el escáner de QR.
// Su principal trabajo es pedir el permiso de la cámara y, si se lo dan,
// mostrar el Composable `CameraPreview` que hace la magia de escanear.
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QrScannerScreen(
    // La función que se ejecuta cuando se escanea un QR con éxito.
    onQrScanned: (String) -> Unit,
    // La función para cerrar la pantalla si el usuario presiona "atrás".
    onClose: () -> Unit
) {
    val context = LocalContext.current
    // Este estado va a guardar si tengo o no permiso para usar la cámara.
    var hasCameraPermission by remember {
        mutableStateOf(
            // Reviso si ya tengo el permiso la primera vez que se carga la pantalla.
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
        )
    }

    // Este es el "lanzador" que se encarga de mostrar el diálogo de Android
    // que pregunta al usuario: "¿Permitir que la app use la cámara?".
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        // Este bloque se ejecuta después de que el usuario elige "Permitir" o "Denegar".
        // `granted` será `true` si aceptó, y `false` si no.
        hasCameraPermission = granted
    }

    // Este LaunchedEffect se ejecuta una sola vez al entrar en la pantalla.
    LaunchedEffect(Unit) {
        // Si al entrar veo que no tengo permiso...
        if (!hasCameraPermission) {
            // ...uso el "lanzador" para pedirlo.
            launcher.launch(Manifest.permission.CAMERA)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Escanear QR") },
                navigationIcon = {
                    IconButton(onClick = onClose) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Cerrar"
                        )
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            // Decido qué mostrar en la pantalla basado en si tengo el permiso o no.
            if (hasCameraPermission) {
                // Si SÍ tengo permiso, muestro la vista de la cámara.
                CameraPreview(
                    onQrScanned = { value ->
                        // Cuando `CameraPreview` encuentre un QR, me lo pasará aquí,
                        // y yo se lo paso a la función que me dieron desde el navegador.
                        onQrScanned(value)
                    }
                )
            } else {
                // Si NO tengo permiso (o el usuario lo denegó), muestro un texto.
                Text("Se necesita permiso de cámara para poder escanear")
            }
        }
    }
}
