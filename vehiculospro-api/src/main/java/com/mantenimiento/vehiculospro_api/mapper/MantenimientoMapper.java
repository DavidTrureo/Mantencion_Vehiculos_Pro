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

        if (m.getFecha() != null) {
            dto.setFecha(m.getFecha().format(FORMATO));
        }

        return dto;
    }
}