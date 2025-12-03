package com.mantenimientovehiculospro.data.model

// Esta es la plantilla para un objeto Usuario.
// La uso principalmente para enviar los datos de email y contraseña
// al servidor cuando el usuario intenta iniciar sesión o registrarse.
data class Usuario(
    // El ID que el servidor le asigna al usuario.
    // Lo recibo de la API después de un login exitoso.
    // Es nulo cuando solo envío el email/pass para registrarme.
    val id: Long? = null,

    // El correo electrónico que el usuario usa para su cuenta.
    val email: String,

    // La contraseña del usuario.
    // Ojo: solo la uso para enviarla al servidor, no la guardo en la app.
    val password: String
)
