package com.mantenimiento.vehiculospro_api.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Configuration
public class FirebaseConfig {

    @PostConstruct
    public void initialize() {
        try {
            InputStream serviceAccountStream = null;

            // 1. Variable de entorno con JSON en texto plano o Base64
            String envJson = System.getenv("FIREBASE_CREDENTIALS_JSON");
            if (envJson != null && !envJson.trim().isEmpty()) {
                String trimmed = envJson.trim();
                if (trimmed.startsWith("{")) {
                    serviceAccountStream = new ByteArrayInputStream(trimmed.getBytes(StandardCharsets.UTF_8));
                } else {
                    try {
                        byte[] decoded = Base64.getDecoder().decode(trimmed);
                        serviceAccountStream = new ByteArrayInputStream(decoded);
                    } catch (IllegalArgumentException e) {
                        serviceAccountStream = new ByteArrayInputStream(trimmed.getBytes(StandardCharsets.UTF_8));
                    }
                }
            }

            // 2. Variable de entorno con ruta personalizada
            if (serviceAccountStream == null) {
                String envPath = System.getenv("FIREBASE_CREDENTIALS_PATH");
                if (envPath != null && new File(envPath).exists()) {
                    serviceAccountStream = new FileInputStream(envPath);
                }
            }

            // 3. Render Secret File (/etc/secrets/serviceAccountKey.json)
            if (serviceAccountStream == null) {
                File renderSecretFile = new File("/etc/secrets/serviceAccountKey.json");
                if (renderSecretFile.exists()) {
                    serviceAccountStream = new FileInputStream(renderSecretFile);
                }
            }

            // 4. Archivo local raíz (desarrollo local)
            if (serviceAccountStream == null) {
                File localFile = new File("serviceAccountKey.json");
                if (localFile.exists()) {
                    serviceAccountStream = new FileInputStream(localFile);
                }
            }

            if (serviceAccountStream == null) {
                System.err.println("ADVERTENCIA: No se encontró serviceAccountKey.json ni FIREBASE_CREDENTIALS_JSON.");
                return;
            }

            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(serviceAccountStream))
                    .setStorageBucket("mantenimiento-vehiculos-pro.firebasestorage.app")
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
                System.out.println("Firebase Admin SDK inicializado correctamente.");
            }
        } catch (IOException e) {
            System.err.println("Error al inicializar Firebase Admin SDK: " + e.getMessage());
        }
    }
}
