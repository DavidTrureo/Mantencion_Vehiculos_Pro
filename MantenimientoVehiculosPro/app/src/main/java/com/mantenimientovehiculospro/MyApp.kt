package com.mantenimientovehiculospro

import android.app.Application

// Esta clase es un "truco" para poder acceder al 'context' de la aplicación
// desde cualquier parte del código de una forma muy sencilla.
// Ojo: Para que esto funcione, tuve que registrar esta clase en el archivo
// AndroidManifest.xml, dentro de la etiqueta <application>, así:
// android:name=".MyApp"
class MyApp : Application() {

    // 'companion object' es como crear miembros estáticos en otros lenguajes.
    // Esto significa que puedo acceder a 'instance' directamente desde cualquier
    // sitio escribiendo 'MyApp.instance'.
    companion object {
        // 'lateinit' significa "prometo que inicializaré esta variable más tarde".
        // La voy a usar para guardar una referencia a la propia aplicación.
        lateinit var instance: MyApp
            private set // 'private set' hace que solo se pueda cambiar desde dentro de esta clase.
    }

    // 'onCreate' es lo primero que se ejecuta cuando la aplicación arranca,
    // incluso antes que cualquier pantalla.
    override fun onCreate() {
        super.onCreate()
        // Aquí cumplo mi promesa: guardo la instancia actual de la aplicación
        // en la variable estática para poder usarla después.
        instance = this
    }
}
