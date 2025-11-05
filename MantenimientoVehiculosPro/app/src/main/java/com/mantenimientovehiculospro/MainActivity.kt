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

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            // Aquí aplico el tema global de la aplicación
            MantenimientoVehiculosProTheme {
                // Creo el controlador de navegación que me permitirá moverme entre pantallas
                val navController = rememberNavController()

                // Defino el NavHost, que es el contenedor de todas las rutas de mi app
                NavHost(navController = navController, startDestination = "inicio") {

                    // Pantalla de inicio: desde aquí puedo ir a login o registro
                    composable("inicio") {
                        InicioScreen(
                            onLoginClick = { navController.navigate("login") },
                            onRegisterClick = { navController.navigate("registro") }
                        )
                    }

                    // Pantalla de login: si el login es exitoso, voy a la lista de vehículos
                    composable("login") {
                        LoginScreen(
                            onLoginSuccess = { navController.navigate("vehiculo_list") },
                            onBack = { navController.popBackStack() }
                        )
                    }

                    // Pantalla de registro: si el registro es exitoso, también voy a la lista de vehículos
                    composable("registro") {
                        RegistroScreen(
                            onRegistroExitoso = { navController.navigate("vehiculo_list") },
                            onBack = { navController.popBackStack() }
                        )
                    }

                    // Pantalla principal con la lista de vehículos
                    composable("vehiculo_list") {
                        VehiculoScreen(
                            onAddVehiculoClick = { navController.navigate("add_vehiculo") },
                            onVehiculoClick = { vehiculoId ->
                                navController.navigate("vehiculo_detail/$vehiculoId")
                            },
                            onLogout = {
                                // Al cerrar sesión, vuelvo al inicio y limpio el backstack
                                navController.navigate("inicio") {
                                    popUpTo("vehiculo_list") { inclusive = true }
                                }
                            },
                            navController = navController
                        )
                    }

                    // Pantalla para agregar un nuevo vehículo
                    composable("add_vehiculo") {
                        AddVehiculoScreen(
                            onVehiculoGuardado = {
                                navController.navigate("vehiculo_list") {
                                    popUpTo("add_vehiculo") { inclusive = true }
                                }
                            }
                        )
                    }

                    // Pantalla de detalle de un vehículo específico
                    composable(
                        route = "vehiculo_detail/{vehiculoId}",
                        arguments = listOf(navArgument("vehiculoId") { type = NavType.LongType })
                    ) { backStackEntry ->
                        val vehiculoId = backStackEntry.arguments?.getLong("vehiculoId") ?: return@composable
                        DetalleVehiculoScreen(
                            vehiculoId = vehiculoId,
                            onBack = { navController.popBackStack() },
                            onEditar = { id -> navController.navigate("editarVehiculo/$id") },
                            onAgregarMantenimiento = { id -> navController.navigate("crearMantenimiento/$id") },
                            onEditarMantenimiento = { id -> navController.navigate("editarMantenimiento/$id") },
                            onEliminarMantenimiento = { id ->
                                // Aquí hago la llamada al backend para eliminar un mantenimiento
                                try {
                                    val response = RetrofitProvider.instance.eliminarMantenimiento(id)
                                    response.isSuccessful
                                } catch (e: Exception) {
                                    false
                                }
                            }
                        )
                    }

                    // Pantalla para editar un vehículo existente
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

                    // Pantalla para crear un mantenimiento asociado a un vehículo
                    composable(
                        route = "crearMantenimiento/{vehiculoId}",
                        arguments = listOf(navArgument("vehiculoId") { type = NavType.LongType })
                    ) { backStackEntry ->
                        val vehiculoId = backStackEntry.arguments?.getLong("vehiculoId") ?: return@composable
                        CrearMantenimientoScreen(
                            vehiculoId = vehiculoId,
                            onMantenimientoGuardado = {
                                navController.navigate("vehiculo_detail/$vehiculoId") {
                                    popUpTo("crearMantenimiento/$vehiculoId") { inclusive = true }
                                }
                            },
                            onCancelar = { navController.popBackStack() }
                        )
                    }

                    // Pantalla para editar un mantenimiento existente
                    composable(
                        route = "editarMantenimiento/{mantenimientoId}",
                        arguments = listOf(navArgument("mantenimientoId") { type = NavType.LongType })
                    ) { backStackEntry ->
                        val mantenimientoId = backStackEntry.arguments?.getLong("mantenimientoId") ?: return@composable
                        EditarMantenimientoScreen(
                            mantenimientoId = mantenimientoId,
                            onMantenimientoActualizado = { vehiculoId ->
                                navController.navigate("vehiculo_detail/$vehiculoId") {
                                    popUpTo("editarMantenimiento/$mantenimientoId") { inclusive = true }
                                }
                            },
                            onCancelar = { navController.popBackStack() }
                        )
                    }

                    // Pantalla de resumen de mantenimientos de un vehículo
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
                }
            }
        }
    }
}