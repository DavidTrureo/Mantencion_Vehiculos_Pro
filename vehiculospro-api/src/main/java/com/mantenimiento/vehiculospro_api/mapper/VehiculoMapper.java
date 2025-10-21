package com.mantenimiento.vehiculospro_api.mapper;

import com.mantenimiento.vehiculospro_api.dto.VehiculoDTO;
import com.mantenimiento.vehiculospro_api.model.Vehiculo;
import com.mantenimiento.vehiculospro_api.model.Usuario;

public class VehiculoMapper {

    public static VehiculoDTO toDTO(Vehiculo v) {
        VehiculoDTO dto = new VehiculoDTO();
        dto.setId(v.getId());
        dto.setMarca(v.getMarca());
        dto.setModelo(v.getModelo());
        dto.setAnio(v.getAnio());
        dto.setKilometraje(v.getKilometraje());
        dto.setPropietarioId(v.getPropietario().getId());
        return dto;
    }

    public static Vehiculo toEntity(VehiculoDTO dto, Usuario propietario) {
        Vehiculo v = new Vehiculo();
        v.setId(dto.getId());
        v.setMarca(dto.getMarca());
        v.setModelo(dto.getModelo());
        v.setAnio(dto.getAnio());
        v.setKilometraje(dto.getKilometraje());
        v.setPropietario(propietario);
        return v;
    }
}