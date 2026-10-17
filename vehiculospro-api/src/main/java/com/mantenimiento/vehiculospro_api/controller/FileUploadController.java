package com.mantenimiento.vehiculospro_api.controller;

import com.mantenimiento.vehiculospro_api.service.FirebaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    @Autowired
    private FirebaseService firebaseService;

    // Extensiones permitidas seguras para auditoría, evidencias mecánicas y documentos legales
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "webp", "pdf", "mp3", "m4a", "wav", "ogg", "webm"
    );

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp",
            "application/pdf",
            "audio/mpeg", "audio/mp3", "audio/wav", "audio/m4a", "audio/ogg", "audio/webm", "audio/x-m4a"
    );

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El archivo proporcionado está vacío."));
        }

        // Límite estricto de 15 MB
        if (file.getSize() > 15 * 1024 * 1024) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body(Map.of("error", "El archivo supera el tamaño máximo permitido de 15 MB."));
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Nombre de archivo no válido o malicioso."));
        }

        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0 && dotIndex < originalFilename.length() - 1) {
            extension = originalFilename.substring(dotIndex + 1).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                    .body(Map.of("error", "Formato de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP), PDF o Audios de evidencia."));
        }

        String contentType = file.getContentType();
        if (contentType != null && !contentType.isBlank()) {
            boolean validMime = ALLOWED_MIME_TYPES.contains(contentType.toLowerCase()) || contentType.startsWith("image/") || contentType.startsWith("audio/");
            if (!validMime) {
                return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                        .body(Map.of("error", "Tipo MIME no permitido para subida: " + contentType));
            }
        }

        try {
            String fileUrl = firebaseService.uploadFile(file);
            return ResponseEntity.ok(Map.of(
                    "message", "Archivo validado y subido correctamente a Firebase Storage",
                    "url", fileUrl
            ));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al procesar y guardar el archivo: " + e.getMessage()));
        }
    }
}
