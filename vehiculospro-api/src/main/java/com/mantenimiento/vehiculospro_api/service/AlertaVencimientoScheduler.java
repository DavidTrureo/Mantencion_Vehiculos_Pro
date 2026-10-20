package com.mantenimiento.vehiculospro_api.service;

import com.mantenimiento.vehiculospro_api.dto.ItemAlertaVencimientoDTO;
import com.mantenimiento.vehiculospro_api.dto.ReporteAlertaVencimientosDTO;
import com.mantenimiento.vehiculospro_api.model.DocumentoVehiculo;
import com.mantenimiento.vehiculospro_api.model.Usuario;
import com.mantenimiento.vehiculospro_api.model.UserRole;
import com.mantenimiento.vehiculospro_api.model.Vehiculo;
import com.mantenimiento.vehiculospro_api.repository.DocumentoVehiculoRepository;
import com.mantenimiento.vehiculospro_api.repository.UsuarioRepository;
import com.mantenimiento.vehiculospro_api.repository.VehiculoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AlertaVencimientoScheduler {

    private static final Logger log = LoggerFactory.getLogger(AlertaVencimientoScheduler.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Autowired
    private VehiculoRepository vehiculoRepository;

    @Autowired
    private DocumentoVehiculoRepository documentoVehiculoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private FirebaseService firebaseService;

    @Value("${app.alertas.dias-anticipacion:15}")
    private int diasAnticipacion;

    /**
     * Hilo en segundo plano programado mediante cron (por defecto todos los días a las 08:00 AM hora de Chile).
     */
    @Scheduled(cron = "${app.alertas.cron:0 0 8 * * *}", zone = "America/Santiago")
    public void ejecutarTareaProgramada() {
        log.info("⏰ [SCHEDULER CRON] Iniciando auditoría automática de vencimientos legales de flota (15 días de anticipación)...");
        ejecutarChequeoVencimientos();
    }

    /**
     * Ejecuta la evaluación de vencimientos legales y despacha alertas por correo y push.
     * Puede ser invocado automáticamente por el Cron o manualmente bajo demanda por un Administrador.
     */
    public ReporteAlertaVencimientosDTO ejecutarChequeoVencimientos() {
        LocalDate hoy = LocalDate.now();
        List<Vehiculo> vehiculos = vehiculoRepository.findAll();
        List<ItemAlertaVencimientoDTO> alertas = new ArrayList<>();

        int totalEvaluados = 0;

        for (Vehiculo v : vehiculos) {
            // Evaluar únicamente vehículos activos
            if (v.getActivo() != null && !v.getActivo()) {
                continue;
            }
            totalEvaluados++;

            String patente = (v.getPatente() != null && !v.getPatente().isBlank()) ? v.getPatente() : "S/P";
            String marcaModelo = String.format("%s %s (%d)",
                    v.getMarca() != null ? v.getMarca() : "",
                    v.getModelo() != null ? v.getModelo() : "",
                    v.getAnio()).trim();

            // 1. Revisión Técnica (PRT) desde entidad Vehiculo
            evaluarFecha(alertas, v.getId(), patente, marcaModelo, "Revisión Técnica (PRT)", v.getRevisionTecnicaVencimiento(), hoy);

            // 2. Seguro Obligatorio (SOAP) desde entidad Vehiculo
            evaluarFecha(alertas, v.getId(), patente, marcaModelo, "Seguro Obligatorio (SOAP)", v.getSoapVencimiento(), hoy);

            // 3. Permiso de Circulación desde entidad Vehiculo
            evaluarFecha(alertas, v.getId(), patente, marcaModelo, "Permiso de Circulación", v.getPermisoCirculacionVencimiento(), hoy);

            // 4. Documentos adicionales en tabla documentos_vehiculo
            try {
                List<DocumentoVehiculo> docsExtra = documentoVehiculoRepository.findByVehiculoIdAndVigenteTrue(v.getId());
                for (DocumentoVehiculo doc : docsExtra) {
                    if (doc.getFechaVencimiento() != null) {
                        String docNombre = formatTipoDoc(doc.getTipoDocumento());
                        evaluarFecha(alertas, v.getId(), patente, marcaModelo, docNombre, doc.getFechaVencimiento().toString(), hoy);
                    }
                }
            } catch (Exception ex) {
                log.debug("Aviso al consultar documentos extras para vehículo {}: {}", v.getId(), ex.getMessage());
            }
        }

        ReporteAlertaVencimientosDTO reporte = new ReporteAlertaVencimientosDTO();
        reporte.setFechaChequeo(hoy.format(DATE_FMT));
        reporte.setTotalVehiculosEvaluados(totalEvaluados);
        reporte.setTotalAlertas(alertas.size());
        reporte.setAlertas(alertas);

        if (alertas.isEmpty()) {
            log.info("✅ [AUDITORÍA VENCIMIENTOS] Todos los vehículos están al día. No hay vencimientos próximos a 15 días.");
            return reporte;
        }

        log.warn("⚠️ [AUDITORÍA VENCIMIENTOS] Se detectaron {} alertas de documentación legal por vencer o vencidas.", alertas.size());

        // Despachar Notificaciones (Correo y Push)
        despacharNotificaciones(reporte);

        return reporte;
    }

    private void evaluarFecha(List<ItemAlertaVencimientoDTO> alertas, Long vehiculoId, String patente, String marcaModelo, String nombreDoc, String fechaStr, LocalDate hoy) {
        if (fechaStr == null || fechaStr.isBlank()) return;

        try {
            LocalDate fechaVenc = LocalDate.parse(fechaStr.trim());
            long diasRestantes = ChronoUnit.DAYS.between(hoy, fechaVenc);

            // Condición: 15 días antes del vencimiento (0 <= dias <= 15) o ya vencido (dias < 0)
            if (diasRestantes <= diasAnticipacion) {
                String estado;
                String mensaje;

                if (diasRestantes < 0) {
                    estado = "VENCIDO";
                    mensaje = String.format("¡URGENTE! %s venció hace %d día(s) el %s.", nombreDoc, Math.abs(diasRestantes), fechaStr);
                } else if (diasRestantes == 0) {
                    estado = "POR_VENCER";
                    mensaje = String.format("¡ATENCIÓN! %s vence HOY (%s).", nombreDoc, fechaStr);
                } else {
                    estado = "POR_VENCER";
                    mensaje = String.format("Aviso preventivo: %s vence en %d día(s) (%s).", nombreDoc, diasRestantes, fechaStr);
                }

                // Evitar duplicados si ya fue agregado por la entidad
                boolean yaExiste = alertas.stream().anyMatch(a ->
                        a.getVehiculoId().equals(vehiculoId) &&
                        a.getDocumento().equalsIgnoreCase(nombreDoc) &&
                        a.getFechaVencimiento().equalsIgnoreCase(fechaStr)
                );

                if (!yaExiste) {
                    alertas.add(new ItemAlertaVencimientoDTO(vehiculoId, patente, marcaModelo, nombreDoc, fechaStr, diasRestantes, estado, mensaje));
                }
            }
        } catch (Exception ignored) {
            // Ignorar formatos de fecha inválidos
        }
    }

    private void despacharNotificaciones(ReporteAlertaVencimientosDTO reporte) {
        List<Usuario> administradores = usuarioRepository.findByRole(UserRole.ADMIN);
        Set<String> emailsDestino = new HashSet<>();
        List<String> pushTokens = new ArrayList<>();

        for (Usuario admin : administradores) {
            if (admin.getEmail() != null && !admin.getEmail().isBlank()) {
                emailsDestino.add(admin.getEmail().trim());
            }
            if (admin.getFcmToken() != null && !admin.getFcmToken().isBlank()) {
                pushTokens.add(admin.getFcmToken().trim());
            }
        }

        // Si no hay administradores registrados con email, usar el configurado por defecto
        if (emailsDestino.isEmpty()) {
            emailsDestino.add(emailService.getDefaultAdminEmail());
        }

        String asunto = String.format("🚨 [VehículosPro] Alerta de Vencimiento Legal (%d alertas - SOAP / PRT)", reporte.getTotalAlertas());
        String htmlBody = construirEmailHtml(reporte);

        int emailsSent = 0;
        for (String email : emailsDestino) {
            if (emailService.enviarEmailHtml(email, asunto, htmlBody)) {
                emailsSent++;
            }
        }
        reporte.setEmailsEnviados(emailsSent);

        // Despachar Push Notifications
        int pushSent = 0;
        String pushTitle = "🚨 Alerta de Vencimiento Legal";
        String pushBody = String.format("Hay %d documento(s) (SOAP/PRT) vencidos o por vencer en ≤ 15 días en tu flota.", reporte.getTotalAlertas());

        for (String token : pushTokens) {
            try {
                firebaseService.sendPushNotification(token, pushTitle, pushBody);
                pushSent++;
            } catch (Exception ex) {
                log.warn("Error al enviar push a token {}: {}", token, ex.getMessage());
            }
        }
        reporte.setPushEnviados(pushSent);

        log.info("📊 Resumen de despacho: {} correos enviados, {} notificaciones push enviadas.", emailsSent, pushSent);
    }

    private String construirEmailHtml(ReporteAlertaVencimientosDTO reporte) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html>");
        sb.append("<html lang='es'>");
        sb.append("<head><meta charset='UTF-8'><style>");
        sb.append("body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 20px; }");
        sb.append(".container { max-width: 650px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }");
        sb.append(".header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); padding: 24px; text-align: center; color: #ffffff; }");
        sb.append(".header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 700; }");
        sb.append(".header p { margin: 0; font-size: 13px; opacity: 0.9; }");
        sb.append(".content { padding: 24px; }");
        sb.append(".alert-box { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; color: #fca5a5; }");
        sb.append("table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }");
        sb.append("th { background: #1f2937; color: #9ca3af; text-align: left; padding: 10px; font-weight: 600; border-bottom: 1px solid #374151; }");
        sb.append("td { padding: 12px 10px; border-bottom: 1px solid #1f2937; color: #e5e7eb; }");
        sb.append(".badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }");
        sb.append(".badge-vencido { background: #7f1d1d; color: #fca5a5; border: 1px solid #ef4444; }");
        sb.append(".badge-por-vencer { background: #78350f; color: #fde68a; border: 1px solid #f59e0b; }");
        sb.append(".patente { font-family: monospace; font-size: 13px; font-weight: bold; background: #374151; padding: 3px 6px; border-radius: 4px; color: #ffffff; }");
        sb.append(".btn-container { text-align: center; margin: 30px 0 10px 0; }");
        sb.append(".btn { background: linear-gradient(135deg, #2563eb, #3b82f6); color: #ffffff !important; padding: 12px 24px; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.4); }");
        sb.append(".footer { background: #0f172a; padding: 16px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #1f2937; }");
        sb.append("</style></head><body>");

        sb.append("<div class='container'>");
        sb.append("<div class='header'>");
        sb.append("<h1>🚗 Mantención Vehículos Pro</h1>");
        sb.append("<p>Alerta Automática de Vencimientos Legales (SOAP y Revisión Técnica)</p>");
        sb.append("</div>");

        sb.append("<div class='content'>");
        sb.append("<div class='alert-box'>");
        sb.append(String.format("<strong>⚠️ Atención Administrador:</strong> Se han detectado <strong>%d documentos</strong> con vencimiento crítico o en los próximos 15 días.", reporte.getTotalAlertas()));
        sb.append("</div>");

        sb.append("<table>");
        sb.append("<thead><tr>");
        sb.append("<th>Patente</th><th>Vehículo</th><th>Documento</th><th>Fecha</th><th>Estado</th>");
        sb.append("</tr></thead><tbody>");

        for (ItemAlertaVencimientoDTO item : reporte.getAlertas()) {
            boolean vencido = "VENCIDO".equalsIgnoreCase(item.getEstado());
            sb.append("<tr>");
            sb.append(String.format("<td><span class='patente'>%s</span></td>", escapeHtml(item.getPatente())));
            sb.append(String.format("<td>%s</td>", escapeHtml(item.getMarcaModelo())));
            sb.append(String.format("<td><strong>%s</strong></td>", escapeHtml(item.getDocumento())));
            sb.append(String.format("<td>%s</td>", escapeHtml(item.getFechaVencimiento())));
            if (vencido) {
                sb.append(String.format("<td><span class='badge badge-vencido'>🚨 Vencido (%d d)</span></td>", Math.abs(item.getDiasRestantes())));
            } else {
                sb.append(String.format("<td><span class='badge badge-por-vencer'>⚠️ Vence en %d d</span></td>", item.getDiasRestantes()));
            }
            sb.append("</tr>");
        }

        sb.append("</tbody></table>");

        sb.append("<div class='btn-container'>");
        sb.append("<a href='https://mantenimiento-vehiculos-pro.web.app/vehiculos' class='btn'>Ingresar al Sistema de Vehículos</a>");
        sb.append("</div>");
        sb.append("</div>");

        sb.append("<div class='footer'>");
        sb.append(String.format("Reporte generado automáticamente el %s por el servicio cron de VehículosPro.<br>Este mensaje es confidencial y dirigido a la administración de flota.", reporte.getFechaChequeo()));
        sb.append("</div>");
        sb.append("</div>");
        sb.append("</body></html>");

        return sb.toString();
    }

    private String formatTipoDoc(DocumentoVehiculo.TipoDocumento tipo) {
        if (tipo == null) return "Documento Legal";
        switch (tipo) {
            case SOAP: return "Seguro Obligatorio (SOAP)";
            case REVISION_TECNICA: return "Revisión Técnica (PRT)";
            case PERMISO_CIRCULACION: return "Permiso de Circulación";
            case PADRON: return "Padrón Vehicular";
            case SEGURO_CARGA: return "Seguro de Carga";
            default: return "Documento Legal";
        }
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace(String.valueOf('"'), "&quot;");
    }
}
