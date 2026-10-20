package com.mantenimiento.vehiculospro_api.mapper;

import com.mantenimiento.vehiculospro_api.dto.MantenimientoDTO;
import com.mantenimiento.vehiculospro_api.model.Mantenimiento;
import com.mantenimiento.vehiculospro_api.model.Vehiculo;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class MantenimientoMapper {

    private static final DateTimeFormatter FORMATO = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public static Mantenimiento toEntity(MantenimientoDTO dto, Vehiculo vehiculo) {
        Mantenimiento m = new Mantenimiento();
        m.setId(dto.getId());
        m.setTipo(dto.getTipo()); // ✅ nuevo campo agregado
        m.setDescripcion(dto.getDescripcion());
        m.setKilometraje(dto.getKilometraje());
        m.setEstado(dto.getEstado());
        m.setVehiculo(vehiculo);
        m.setCosto(dto.getCosto());
        m.setFacturaImagen(dto.getFacturaImagen());
        m.setEvidenciaFotoUrl(dto.getEvidenciaFotoUrl());
        m.setAudioUrl(dto.getAudioUrl());
        m.setLatitud(dto.getLatitud());
        m.setLongitud(dto.getLongitud());
        if (dto.getClasificacion() != null && !dto.getClasificacion().isBlank()) {
            m.setClasificacion(dto.getClasificacion().toUpperCase().trim());
        } else {
            m.setClasificacion(determinarClasificacion(dto.getTipo(), dto.getDescripcion()));
        }

        // Validar y convertir fecha
        if (dto.getFecha() != null && !dto.getFecha().isBlank()) {
            try {
                LocalDate fecha = LocalDate.parse(dto.getFecha(), FORMATO);
                m.setFecha(fecha);
            } catch (DateTimeParseException e) {
                throw new RuntimeException("Formato de fecha inválido. Usa yyyy-MM-dd");
            }
        }

        return m;
    }

    public static MantenimientoDTO toDTO(Mantenimiento m) {
        MantenimientoDTO dto = new MantenimientoDTO();
        dto.setId(m.getId());
        dto.setTipo(m.getTipo()); // ✅ nuevo campo agregado
        dto.setDescripcion(m.getDescripcion());
        dto.setKilometraje(m.getKilometraje());
        dto.setEstado(m.getEstado());
        dto.setVehiculoId(m.getVehiculo().getId());
        dto.setCosto(m.getCosto());
        dto.setFacturaImagen(m.getFacturaImagen());
        dto.setEvidenciaFotoUrl(m.getEvidenciaFotoUrl());
        dto.setAudioUrl(m.getAudioUrl());
        dto.setLatitud(m.getLatitud());
        dto.setLongitud(m.getLongitud());
        if (m.getClasificacion() != null && !m.getClasificacion().isBlank()) {
            dto.setClasificacion(m.getClasificacion().toUpperCase().trim());
        } else {
            dto.setClasificacion(determinarClasificacion(m.getTipo(), m.getDescripcion()));
        }

        if (m.getFecha() != null) {
            dto.setFecha(m.getFecha().format(FORMATO));
        }

        return dto;
    }
    public static String determinarClasificacion(String tipo, String descripcion) {
        String texto = ((tipo != null ? tipo : "") + " " + (descripcion != null ? descripcion : "")).toLowerCase();
        if (texto.contains("choque") || texto.contains("falla") || texto.contains("rotura") ||
            texto.contains("reparac") || texto.contains("imprevist") || texto.contains("siniestro") ||
            texto.contains("pana") || texto.contains("accidente") || texto.contains("emergenc") ||
            texto.contains("averia") || texto.contains("correctiv")) {
            return "CORRECTIVO";
        }
        return "PREVENTIVO";
    }

}
