package com.mantenimientovehiculospro.ui.screens

import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage

// Este es el Composable que muestra lo que ve la cámara del teléfono.
// Lo uso para poder escanear códigos QR.
@Composable
fun CameraPreview(
    // La función que se va a ejecutar cuando se escanee un QR válido.
    // Le paso el texto que contenía el código QR.
    onQrScanned: (String) -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    // Una bandera para saber si todavía estoy buscando un QR.
    // La uso para detener el escaneo una vez que encuentro uno.
    var isScanning by remember { mutableStateOf(true) }
    // Esta variable va a guardar el controlador de la cámara cuando esté listo.
    var cameraProvider by remember { mutableStateOf<ProcessCameraProvider?>(null) }

    // `AndroidView` es la magia que me permite usar una vista de Android (como la de la cámara)
    // dentro de mi pantalla de Compose.
    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { ctx ->
            // `factory` es el bloque que crea la vista. Solo se ejecuta una vez.
            val previewView = PreviewView(ctx)

            // Pido una instancia del controlador de la cámara. Esto es asíncrono.
            val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
            cameraProviderFuture.addListener({
                // Este bloque se ejecuta cuando el controlador de la cámara está listo para usarse.
                val provider = cameraProviderFuture.get()
                cameraProvider = provider

                // 1. Configuro el "Preview": es lo que se ve en la pantalla.
                // Básicamente, conecta la cámara con la `previewView` que creé antes.
                val preview = androidx.camera.core.Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

                // 2. Elijo la cámara: en este caso, la trasera.
                val selector = CameraSelector.DEFAULT_BACK_CAMERA

                // 3. Preparo el analizador de códigos de barra de ML Kit.
                val scanner = BarcodeScanning.getClient()

                // 4. Configuro el "ImageAnalysis": este es el caso de uso que analiza
                // los fotogramas de la cámara, uno por uno, para buscar algo.
                val analysis = ImageAnalysis.Builder()
                    // Le digo que si llega un fotograma nuevo, descarte el anterior y procese solo el último.
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()
                    .also { imageAnalysis ->
                        // Aquí le digo qué hacer con cada fotograma.
                        imageAnalysis.setAnalyzer(
                            ContextCompat.getMainExecutor(ctx)
                        ) { imageProxy ->
                            // Si ya encontré un QR, no sigo analizando.
                            if (!isScanning) {
                                imageProxy.close() // Cierro la imagen para liberar memoria.
                                return@setAnalyzer
                            }
                            // Llamo a mi función de abajo para que procese la imagen.
                            processImageProxy(
                                imageProxy = imageProxy,
                                scanner = scanner
                            ) { valorQr ->
                                // --- ¡ÉXITO! Se encontró un QR. ---
                                // Pongo la bandera en falso para detener el escaneo.
                                isScanning = false
                                // Desconecto la cámara para que deje de gastar batería.
                                cameraProvider?.unbindAll()
                                // Ejecuto la función que me pasaron con el valor del QR.
                                onQrScanned(valorQr)
                            }
                        }
                    }

                // 5. ¡A encender la cámara!
                // Conecto todos los "casos de uso" (el preview y el análisis) al ciclo de vida
                // de la pantalla. Esto hace que la cámara se encienda y se apague sola
                // cuando la pantalla aparece o desaparece.
                try {
                    provider.unbindAll() // Limpio cualquier configuración anterior.
                    provider.bindToLifecycle(
                        lifecycleOwner,
                        selector,
                        preview,    // Lo que se ve
                        analysis    // Lo que analiza
                    )
                } catch (e: Exception) {
                    // Si algo falla al encender la cámara (ej: permisos denegados).
                    e.printStackTrace()
                }
            }, ContextCompat.getMainExecutor(ctx))

            // Devuelvo la vista para que Compose la muestre.
            previewView
        }
    )

    // Este efecto se asegura de que la cámara se apague y libere
    // cuando salgo de la pantalla del escáner.
    DisposableEffect(Unit) {
        onDispose {
            cameraProvider?.unbindAll()
        }
    }
}

// Esta es una función privada que se encarga de procesar cada imagen que le pasa la cámara.
private fun processImageProxy(
    imageProxy: ImageProxy,
    scanner: BarcodeScanner,
    onQrFound: (String) -> Unit
) {
    // Saco la imagen en un formato que ML Kit pueda entender.
    val mediaImage = imageProxy.image
    if (mediaImage != null) {
        val image = InputImage.fromMediaImage(
            mediaImage,
            imageProxy.imageInfo.rotationDegrees // Le paso la rotación para que ML Kit la vea derecha.
        )

        // Le paso la imagen al escáner de ML Kit.
        scanner.process(image)
            .addOnSuccessListener { barcodes ->
                // Si ML Kit encuentra uno o más códigos de barra...
                for (barcode in barcodes) {
                    // Reviso si es un código QR.
                    if (barcode.format == Barcode.FORMAT_QR_CODE) {
                        val rawValue = barcode.rawValue // Saco el texto del QR.
                        if (!rawValue.isNullOrBlank()) {
                            // ¡Lo encontré! Llamo a la función de callback.
                            onQrFound(rawValue)
                            break // Salgo del bucle, ya no necesito buscar más.
                        }
                    }
                }
            }
            .addOnFailureListener { e ->
                // Si hubo un error en el análisis.
                e.printStackTrace()
            }
            .addOnCompleteListener {
                // Este bloque se ejecuta siempre, haya encontrado algo o no.
                // Cierro la imagen para que la cámara pueda enviar la siguiente.
                imageProxy.close()
            }
    } else {
        // Si por alguna razón la imagen es nula, la cierro igual.
        imageProxy.close()
    }
}
