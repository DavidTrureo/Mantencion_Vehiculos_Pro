package com.mantenimiento.vehiculospro_api.controller;

import com.mantenimiento.vehiculospro_api.model.Incidente;
import com.mantenimiento.vehiculospro_api.model.Mantenimiento;
import com.mantenimiento.vehiculospro_api.model.Vehiculo;
import com.mantenimiento.vehiculospro_api.repository.IncidenteRepository;
import com.mantenimiento.vehiculospro_api.repository.MantenimientoRepository;
import com.mantenimiento.vehiculospro_api.repository.VehiculoRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    private final VehiculoRepository vehiculoRepository;
    private final MantenimientoRepository mantenimientoRepository;
    private final IncidenteRepository incidenteRepository;

    public ExportController(VehiculoRepository vehiculoRepository,
                            MantenimientoRepository mantenimientoRepository,
                            IncidenteRepository incidenteRepository) {
        this.vehiculoRepository = vehiculoRepository;
        this.mantenimientoRepository = mantenimientoRepository;
        this.incidenteRepository = incidenteRepository;
    }

    @GetMapping("/vehiculos/csv")
    public ResponseEntity<byte[]> exportarVehiculosCSV() {
        List<Vehiculo> vehiculos = vehiculoRepository.findAll();
        StringBuilder csv = new StringBuilder();
        // UTF-8 BOM para compatibilidad directa con Microsoft Excel
        csv.append("\uFEFF");
        csv.append("ID,Patente,Marca,Modelo,Año,Kilometraje,Activo,Vencimiento_PRT,Vencimiento_SOAP\n");

        for (Vehiculo v : vehiculos) {
            csv.append(v.getId()).append(",")
               .append(escapeCsv(v.getPatente())).append(",")
               .append(escapeCsv(v.getMarca())).append(",")
               .append(escapeCsv(v.getModelo())).append(",")
               .append(v.getAnio()).append(",")
               .append(v.getKilometraje()).append(",")
               .append(Boolean.TRUE.equals(v.getActivo()) ? "Activo" : "Inactivo").append(",")
               .append(escapeCsv(v.getRevisionTecnicaVencimiento())).append(",")
               .append(escapeCsv(v.getSoapVencimiento())).append("\n");
        }

        String filename = "Vehiculos_Flota_" + DateTimeFormatter.ofPattern("yyyyMMdd_HHmm").format(LocalDateTime.now()) + ".csv";
        return buildFileResponse(csv.toString(), filename);
    }

    @GetMapping("/mantenimientos/csv")
    public ResponseEntity<byte[]> exportarMantenimientosCSV() {
        List<Mantenimiento> mantenimientos = mantenimientoRepository.findAll();
        StringBuilder csv = new StringBuilder();
        csv.append("\uFEFF");
        csv.append("ID,Patente,Vehiculo,Tipo,Kilometraje,Fecha,Estado,Costo,Descripcion\n");

        for (Mantenimiento m : mantenimientos) {
            String patente = m.getVehiculo() != null ? m.getVehiculo().getPatente() : "N/A";
            String vehiculo = m.getVehiculo() != null ? m.getVehiculo().getMarca() + " " + m.getVehiculo().getModelo() : "N/A";
            csv.append(m.getId()).append(",")
               .append(escapeCsv(patente)).append(",")
               .append(escapeCsv(vehiculo)).append(",")
               .append(escapeCsv(m.getTipo())).append(",")
               .append(m.getKilometraje()).append(",")
               .append(m.getFecha() != null ? m.getFecha().toString() : "").append(",")
               .append(m.getEstado() != null ? m.getEstado().name() : "").append(",")
               .append(m.getCosto() != null ? m.getCosto() : 0.0).append(",")
               .append(escapeCsv(m.getDescripcion())).append("\n");
        }

        String filename = "Historial_Mantenimientos_" + DateTimeFormatter.ofPattern("yyyyMMdd_HHmm").format(LocalDateTime.now()) + ".csv";
        return buildFileResponse(csv.toString(), filename);
    }

    @GetMapping("/incidentes/csv")
    public ResponseEntity<byte[]> exportarIncidentesCSV() {
        List<Incidente> incidentes = incidenteRepository.findAll();
        StringBuilder csv = new StringBuilder();
        csv.append("\uFEFF");
        csv.append("ID,Patente,Vehiculo,Conductor,FechaHora,TipoEvento,Gravedad,Estado,Descripcion\n");

        for (Incidente i : incidentes) {
            csv.append(i.getId()).append(",")
               .append(escapeCsv(i.getPatente())).append(",")
               .append(escapeCsv(i.getVehiculoNombre())).append(",")
               .append(escapeCsv(i.getConductorNombre())).append(",")
               .append(escapeCsv(i.getFechaHoraStr())).append(",")
               .append(escapeCsv(i.getTipoEvento())).append(",")
               .append(escapeCsv(i.getGravedad())).append(",")
               .append(Boolean.TRUE.equals(i.getResuelto()) ? "Resuelto" : "Pendiente").append(",")
               .append(escapeCsv(i.getDescripcion())).append("\n");
        }

        String filename = "Incidentes_Vehiculos_" + DateTimeFormatter.ofPattern("yyyyMMdd_HHmm").format(LocalDateTime.now()) + ".csv";
        return buildFileResponse(csv.toString(), filename);
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private ResponseEntity<byte[]> buildFileResponse(String content, String filename) {
        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .contentLength(bytes.length)
                .body(bytes);
    }
}
