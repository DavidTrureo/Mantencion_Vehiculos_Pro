package com.mantenimientovehiculospro

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.mantenimientovehiculospro.ui.screens.*
import com.mantenimientovehiculospro.ui.theme.MantenimientoVehiculosProTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MantenimientoVehiculosProTheme {
                val navController = rememberNavController()

                NavHost(navController = navController, startDestination = "inicio") {

                    composable("inicio") {
                        InicioScreen(
                            onLoginClick = { navController.navigate("login") },
                            onRegisterClick = { navController.navigate("registro") }
                        )
                    }

                    composable("login") {
                        LoginScreen(
                            onLoginSuccess = { navController.navigate("vehiculo_list") },
                            onBack = { navController.popBackStack() }
                        )
                    }

                    composable("registro") {
                        RegistroScreen(
                            onRegistroExitoso = { navController.navigate("vehiculo_list") },
                            onBack = { navController.popBackStack() }
                        )
                    }

                    composable("vehiculo_list") {
                        VehiculoScreen(
                            onAddVehiculoClick = { navController.navigate("add_vehiculo") },
                            onVehiculoClick = { vehiculoId ->
                                navController.navigate("vehiculo_detail/$vehiculoId")
                            },
                            onLogout = {
                                navController.navigate("inicio") {
                                    popUpTo("vehiculo_list") { inclusive = true }
                                }
                            },
                            navController = navController
                        )
                    }

                    composable("add_vehiculo") {
                        AddVehiculoScreen(
                            onVehiculoGuardado = {
                                navController.navigate("vehiculo_list") {
                                    popUpTo("add_vehiculo") { inclusive = true }
                                }
                            }
                        )
                    }

                    composable(
                        route = "vehiculo_detail/{vehiculoId}",
                        arguments = listOf(navArgument("vehiculoId") { type = NavType.LongType })
                    ) { backStackEntry ->
                        val vehiculoId = backStackEntry.arguments?.getLong("vehiculoId") ?: return@composable
                        DetalleVehiculoScreen(
                            vehiculoId = vehiculoId,
                            onBack = { navController.popBackStack() },
                            onEditar = { id -> navController.navigate("editarVehiculo/$id") },
                            onAgregarMantenimiento = { id -> navController.navigate("crearMantenimiento/$id") }
                        )
                    }

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