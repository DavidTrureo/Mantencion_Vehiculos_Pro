package com.mantenimientovehiculospro

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.mantenimientovehiculospro.data.network.RetrofitProvider
import com.mantenimientovehiculospro.ui.screens.*
import com.mantenimientovehiculospro.ui.theme.MantenimientoVehiculosProTheme

// Esta es la actividad principal, el punto de partida de toda la aplicación.
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // setContent es donde le digo a la app que voy a usar Jetpack Compose.
        setContent {
            // Aplico el tema visual que definí para toda la aplicación.
            MantenimientoVehiculosProTheme {
                // El navController es el "jefe" de la navegación, sabe cómo ir de una pantalla a otra.
                val navController = rememberNavController()

                // NavHost es el área donde se van a mostrar las diferentes pantallas.
                // Le digo que empiece en la ruta "inicio".
                NavHost(navController = navController, startDestination = "inicio") {

                    // --- Defino cada una de las pantallas (rutas) de mi app ---

                    // Pantalla de bienvenida con botones de login y registro.
                    composable("inicio") {
                        InicioScreen(
                            onLoginClick = { navController.navigate("login") },
                            onRegisterClick = { navController.navigate("registro") }
                        )
                    }

                    // Pantalla para iniciar sesión.
                    composable("login") {
                        LoginScreen(
                            // Si el login es exitoso, lo llevo a su lista de vehículos.
                            onLoginSuccess = { navController.navigate("vehiculo_list") },
                            onBack = { navController.popBackStack() } // Para volver a la pantalla anterior.
                        )
                    }

                    // Pantalla para crear una cuenta nueva.
                    composable("registro") {
                        RegistroScreen(
                            // Si se registra bien, también lo llevo a la lista de vehículos.
                            onRegistroExitoso = { navController.navigate("vehiculo_list") },
                            onBack = { navController.popBackStack() }
                        )
                    }

                    // Pantalla principal que muestra la lista de vehículos del usuario.
                    composable("vehiculo_list") {
                        VehiculoScreen(
                            onAddVehiculoClick = { navController.navigate("add_vehiculo") },
                            onVehiculoClick = { vehiculoId ->
                                // Al tocar un vehículo, voy al detalle pasándole su ID.
                                navController.navigate("vehiculo_detail/$vehiculoId")
                            },
                            onLogout = {
                                // Al cerrar sesión, lo mando a la pantalla de inicio.
                                // El popUpTo es para limpiar el historial de navegación y que no pueda volver atrás.
                                navController.navigate("inicio") {
                                    popUpTo("vehiculo_list") { inclusive = true }
                                }
                            },
                            navController = navController
                        )
                    }

                    // Pantalla para añadir un nuevo vehículo.
                    composable("add_vehiculo") {
                        AddVehiculoScreen(
                            onVehiculoGuardado = {
                                // Cuando guardo, vuelvo a la lista de vehículos.
                                navController.navigate("vehiculo_list") {
                                    popUpTo("add_vehiculo") { inclusive = true }
                                }
                            },
                            onBack = { navController.popBackStack() }
                        )
                    }

                    // Pantalla que muestra el detalle completo de un vehículo.
                    composable(
                        route = "vehiculo_detail/{vehiculoId}", // La ruta espera un ID.
                        arguments = listOf(navArgument("vehiculoId") { type = NavType.LongType })
                    ) { backStackEntry ->
                        val vehiculoId = backStackEntry.arguments?.getLong("vehiculoId") ?: return@composable
                        DetalleVehiculoScreen(
                            vehiculoId = vehiculoId,
                            onBack = { navController.popBackStack() },
                            onEditar = { id -> navController.navigate("editarVehiculo/$id") },
                            onAgregarMantenimiento = { id -> navController.navigate("crearMantenimiento/$id") },
                            onEditarMantenimiento = { id -> navController.navigate("editarMantenimiento/$id") },
                            // La lógica de eliminar ahora está dentro de DetalleVehiculoScreen.
                            onEliminarMantenimiento = { false }
                        )
                    }

                    // Pantalla para editar un vehículo existente.
                    composable(
                        route = "editarVehiculo/{vehiculoId}",
                        arguments = listOf(navArgument("vehiculoId") { type = NavType.LongType })
                    ) { backStackEntry ->
                        val vehiculoId = backStackEntry.arguments?.getLong("vehiculoId") ?: return@composable
                        EditarVehiculoScreen(
                            vehiculoId = vehiculoId,
                            navController = navController
                        )
                    }

                    // Pantalla para crear un nuevo mantenimiento para un vehículo.
                    composable(
                        route = "crearMantenimiento/{vehiculoId}",
                        arguments = listOf(navArgument("vehiculoId") { type = NavType.LongType })
                    ) { backStackEntry ->
                        val vehiculoId = backStackEntry.arguments?.getLong("vehiculoId") ?: return@composable
                        CrearMantenimientoScreen(
                            vehiculoId = vehiculoId,
                            onMantenimientoGuardado = {
                                // Cuando guardo, vuelvo a la pantalla de detalle del vehículo.
                                navController.navigate("vehiculo_detail/$vehiculoId") {
                                    popUpTo("crearMantenimiento/$vehiculoId") { inclusive = true }
                                }
                            },
                            onCancelar = { navController.popBackStack() }
                        )
                    }

                    // Pantalla para editar un mantenimiento existente.
                    composable(
                        route = "editarMantenimiento/{mantenimientoId}",
                        arguments = listOf(navArgument("mantenimientoId") { type = NavType.LongType })
                    ) { backStackEntry ->
                        val mantenimientoId = backStackEntry.arguments?.getLong("mantenimientoId") ?: return@composable
                        EditarMantenimientoScreen(
                            mantenimientoId = mantenimientoId,
                            onMantenimientoActualizado = { vehiculoId ->
                                // Cuando guardo, vuelvo a la pantalla de detalle del vehículo al que pertenece.
                                navController.navigate("vehiculo_detail/$vehiculoId") {
                                    popUpTo("editarMantenimiento/$mantenimientoId") { inclusive = true }
                                }
                            },
                            onCancelar = { navController.popBackStack() }
                        )
                    }

                    // Pantalla para el resumen de mantenimientos (la que no tiene grupos).
                    composable(
                        route = "resumenMantenimientos/{vehiculoId}",
                        arguments = listOf(navArgument("vehiculoId") { type = NavType.LongType })
                    ) { backStackEntry ->
                        val vehiculoId = backStackEntry.arguments?.getLong("vehiculoId") ?: return@composable
                        ResumenMantenimientosScreen(
                            vehiculoId = vehiculoId,
                            onBack = { navController.popBackStack() }
                        )
                    }

                    // Pantalla para escanear códigos QR.
                    composable("scanner") {
                        QrScannerScreen(
                            onQrScanned = { qrValue ->
                                // Intento "entender" el texto del QR para sacar el ID.
                                val id = parseVehiculoId(qrValue)
                                if (id != null) {
                                    // Si lo encuentro, voy directo al detalle de ese vehículo.
                                    navController.navigate("vehiculo_detail/$id")
                                }
                            },
                            onClose = { navController.popBackStack() }
                        )
                    }
                }
            }
        }
    }
}

// Una función pequeña que hice para "limpiar" el texto que me da el QR.
private fun parseVehiculoId(qrValue: String): Long? {
    return if (qrValue.startsWith("VEHICULO:")) {
        qrValue.removePrefix("VEHICULO:").toLongOrNull()
    } else {
        qrValue.split('/').lastOrNull()?.toLongOrNull()
    }
}
