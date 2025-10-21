package com.mantenimiento.vehiculospro_api.mapper;

import com.mantenimiento.vehiculospro_api.dto.UsuarioDTO;
import com.mantenimiento.vehiculospro_api.model.Usuario;

public class UsuarioMapper {

    public static UsuarioDTO toDTO(Usuario u) {
        UsuarioDTO dto = new UsuarioDTO();
        dto.setId(u.getId());
        dto.setEmail(u.getEmail());
        return dto;
    }
}