package com.mantenimientovehiculospro.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.mantenimientovehiculospro.ui.screens.DetalleVehiculoScreen
import com.mantenimientovehiculospro.ui.screens.VehiculoScreen
import com.mantenimientovehiculospro.ui.screens.QrScannerScreen

@Composable
fun AppNavHost(usuarioId: Long) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = "vehiculo_list"
    ) {
        // ✅ Pantalla principal con lista de vehículos
        composable("vehiculo_list") {
            VehiculoScreen(
                onAddVehiculoClick = { navController.navigate("addVehiculo") },
                onVehiculoClick = { id -> navController.navigate("detalleVehiculo/$id") },
                onLogout = { navController.navigate("inicio") },
                navController = navController
            )
        }

        // ✅ Pantalla de escaneo QR
        composable("scanner") {
            QrScannerScreen(
                onQrScanned = { qrValue ->
                    val id = parseVehiculoId(qrValue)
                    if (id != null) {
                        navController.navigate("detalleVehiculo/$id")
                    }
                },
                onClose = { navController.popBackStack() }
            )
        }

        // ✅ Pantalla de detalle de vehículo
        composable(
            route = "detalleVehiculo/{vehiculoId}",
            arguments = listOf(navArgument("vehiculoId") { type = NavType.LongType })
        ) { backStackEntry ->
            val vehiculoId = backStackEntry.arguments!!.getLong("vehiculoId")
            DetalleVehiculoScreen(
                vehiculoId = vehiculoId,
                onBack = { navController.popBackStack() },
                onEditar = { id -> navController.navigate("editarVehiculo/$id") },
                onAgregarMantenimiento = { id -> navController.navigate("crearMantenimiento/$id") },
                onEditarMantenimiento = { id -> navController.navigate("editarMantenimiento/$id") },
                onEliminarMantenimiento = { id -> false }
            )
        }
    }
}

// ✅ Función auxiliar para interpretar el valor del QR
private fun parseVehiculoId(qrValue: String): Long? {
    return if (qrValue.startsWith("VEHICULO:")) {
        qrValue.removePrefix("VEHICULO:").toLongOrNull()
    } else {
        qrValue.split('/').lastOrNull()?.toLongOrNull()
    }
}