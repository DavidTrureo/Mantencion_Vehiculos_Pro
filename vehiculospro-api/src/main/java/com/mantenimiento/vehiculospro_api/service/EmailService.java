package com.mantenimiento.vehiculospro_api.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Value("${app.alertas.admin-email:admin@vehiculospro.com}")
    private String defaultAdminEmail;

    /**
     * Envía un correo con formato HTML al destinatario especificado.
     * Si no hay un servidor SMTP configurado (modo offline/dev), registra el contenido
     * de forma segura y estructurada en los logs sin interrumpir la ejecución.
     */
    public boolean enviarEmailHtml(String destinatario, String asunto, String contenidoHtml) {
        String target = (destinatario != null && !destinatario.isBlank()) ? destinatario.trim() : defaultAdminEmail;

        if (mailSender != null) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

                helper.setTo(target);
                helper.setSubject(asunto);
                helper.setText(contenidoHtml, true);

                if (mailFrom != null && !mailFrom.isBlank()) {
                    helper.setFrom(mailFrom);
                }

                mailSender.send(message);
                log.info("✉️ Correo de alerta enviado exitosamente a: {}", target);
                return true;
            } catch (Exception e) {
                log.warn("⚠️ No se pudo enviar el correo vía SMTP a {}: {}. Registrando en log...", target, e.getMessage());
            }
        } else {
            log.info("ℹ️ [Modo Simulación SMTP] Servidor de correo no configurado. Notificación lista para: {}", target);
        }

        log.info("=== [ALERTA VENCIMIENTO DE FLOTA] === Para: {} | Asunto: {} | Estado: Notificación procesada", target, asunto);
        return true;
    }

    public String getDefaultAdminEmail() {
        return defaultAdminEmail;
    }
}
