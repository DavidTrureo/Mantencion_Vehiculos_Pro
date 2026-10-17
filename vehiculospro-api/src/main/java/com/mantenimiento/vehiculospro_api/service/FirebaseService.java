package com.mantenimiento.vehiculospro_api.service;

import com.google.cloud.storage.Bucket;
import com.google.firebase.cloud.StorageClient;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Service
public class FirebaseService {

    public String uploadFile(MultipartFile file) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String newFilename = "vehiculos_pro/" + UUID.randomUUID().toString() + extension;

        Bucket bucket = StorageClient.getInstance().bucket();
        
        // Upload to Firebase Storage
        bucket.create(newFilename, file.getInputStream(), file.getContentType());

        // Construct Firebase Storage Public URL:
        // https://firebasestorage.googleapis.com/v0/b/<bucket-name>/o/<encoded-file-path>?alt=media
        String encodedPath = URLEncoder.encode(newFilename, StandardCharsets.UTF_8.toString());
        return String.format("https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media",
                bucket.getName(), encodedPath);
    }

    public void sendPushNotification(String token, String title, String body) {
        if (token == null || token.isBlank()) {
            return;
        }

        try {
            Notification notification = Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build();

            Message message = Message.builder()
                    .setToken(token)
                    .setNotification(notification)
                    .build();

            String response = FirebaseMessaging.getInstance().send(message);
            System.out.println("Notificación push enviada correctamente: " + response);
        } catch (Exception e) {
            System.err.println("Error al enviar notificación push: " + e.getMessage());
        }
    }
}
